import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

/** Get the authenticated user or throw (safe for queries) */
async function getAuthUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()

  if (!user) throw new Error('User not found')
  return user
}

/** Get the authenticated user, auto-creating if needed (mutations only) */
async function getOrCreateAuthUser(ctx: MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()

  if (existing) return existing

  const now = Date.now()
  const id = await ctx.db.insert('users', {
    clerkId: identity.subject,
    email: identity.email ?? '',
    name: identity.name,
    imageUrl: identity.pictureUrl,
    createdAt: now,
    updatedAt: now,
  })
  return (await ctx.db.get(id)) as Doc<'users'>
}

export const getCircleMembers = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is a member
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt) throw new Error('Not a member of this circle')

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMembers = memberships.filter((m) => !m.leftAt)

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const memberUser = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('_id'), m.userId))
          .first()
        return {
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          name: memberUser?.name ?? memberUser?.email ?? 'Unknown',
          imageUrl: memberUser?.imageUrl,
        }
      })
    )

    return members
  },
})

export const getMembershipCount = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    return members.filter((m) => !m.leftAt).length
  },
})

export const joinCircle = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)

    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .first()

    if (!circle) throw new Error('Invalid invite code')
    if (circle.archivedAt) throw new Error('This circle has been archived')

    // Check if already a member or previously left
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', circle._id))
      .first()

    if (existing) {
      if (existing.blocked) throw new Error('You have been blocked from this circle')
      if (!existing.leftAt) return { circleId: circle._id, alreadyMember: true }

      // Rejoin: clear leftAt and update joinedAt
      await ctx.db.patch(existing._id, { leftAt: undefined, joinedAt: Date.now() })
      return { circleId: circle._id, alreadyMember: false }
    }

    await ctx.db.insert('memberships', {
      userId: user._id,
      circleId: circle._id,
      role: 'member',
      joinedAt: Date.now(),
    })

    return { circleId: circle._id, alreadyMember: false }
  },
})

export const getSubmissionStatus = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Admin-only access
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMembers = memberships.filter((m) => !m.leftAt)

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const memberUser = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('_id'), m.userId))
          .first()
        return {
          userId: m.userId,
          name: memberUser?.name ?? memberUser?.email ?? 'Unknown',
          imageUrl: memberUser?.imageUrl ?? null,
          status: 'Not Started' as 'Submitted' | 'In Progress' | 'Not Started',
          submittedAt: null as number | null,
        }
      })
    )

    return { members, deadline: null as number | null }
  },
})

/** Helper to get active membership */
async function getActiveMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'memberships'> | null> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()
  if (!membership || membership.leftAt) return null
  return membership
}

export const leaveCircle = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    const membership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!membership) throw new Error('Not a member of this circle')

    if (membership.role === 'admin') {
      throw new Error('Transfer admin role before leaving')
    }

    await ctx.db.patch(membership._id, { leftAt: Date.now() })
    return { success: true }
  },
})

export const removeMember = mutation({
  args: {
    circleId: v.id('circles'),
    targetUserId: v.id('users'),
    keepContributions: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is admin
    const callerMembership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Cannot remove yourself
    if (args.targetUserId === user._id) {
      throw new Error('Cannot remove yourself. Use leave circle instead.')
    }

    // Verify target is an active member
    const targetMembership = await getActiveMembership(ctx, args.targetUserId, args.circleId)
    if (!targetMembership) throw new Error('Target user is not an active member')

    if (args.keepContributions) {
      // Remove but keep contributions — member can rejoin
      await ctx.db.patch(targetMembership._id, { leftAt: Date.now() })
    } else {
      // Remove and block — contributions will be cleaned up when content tables exist (Epic 4)
      await ctx.db.patch(targetMembership._id, { leftAt: Date.now(), blocked: true })
      // TODO: Replace contributions with "[Removed]" when content/submission tables exist
    }

    return { success: true }
  },
})
