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
        const memberUser = await ctx.db.get(m.userId)
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

/** Get current cycle ID in YYYY-MM format */
function getCurrentCycleId(): string {
  const now = new Date(Date.now())
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** Compute deadline timestamp for a cycle (second Saturday at 10:59 UTC) */
function computeDeadline(cycleId: string): number {
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]! - 1
  const firstDay = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  return Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)
}

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

    const cycleId = getCurrentCycleId()
    const deadline = computeDeadline(cycleId)

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMembers = memberships.filter((m) => !m.leftAt)

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId)

        // Look up submission for this member in the current cycle
        const submission = await ctx.db
          .query('submissions')
          .withIndex('by_user_circle_cycle', (q) =>
            q.eq('userId', m.userId).eq('circleId', args.circleId).eq('cycleId', cycleId)
          )
          .first()

        let status: 'Submitted' | 'In Progress' | 'Not Started' = 'Not Started'
        let submittedAt: number | null = null

        if (submission) {
          if (submission.submittedAt) {
            status = 'Submitted'
            submittedAt = submission.submittedAt
          } else {
            status = 'In Progress'
          }
        }

        return {
          userId: m.userId,
          name: memberUser?.name ?? memberUser?.email ?? 'Unknown',
          imageUrl: memberUser?.imageUrl ?? null,
          status,
          submittedAt,
        }
      })
    )

    return { members, deadline }
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

export const transferAdmin = mutation({
  args: {
    circleId: v.id('circles'),
    newAdminUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is current admin
    const callerMembership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Cannot transfer to yourself
    if (args.newAdminUserId === user._id) {
      throw new Error('Cannot transfer admin to yourself')
    }

    // Verify target is an active member
    const targetMembership = await getActiveMembership(ctx, args.newAdminUserId, args.circleId)
    if (!targetMembership) throw new Error('Target user is not an active member')

    // Transfer: promote target, demote caller
    await ctx.db.patch(targetMembership._id, { role: 'admin' })
    await ctx.db.patch(callerMembership._id, { role: 'member' })

    // Update adminId on the circle
    await ctx.db.patch(args.circleId, { adminId: args.newAdminUserId, updatedAt: Date.now() })

    return { success: true }
  },
})

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
      // Remove and block — redact all contributions
      await ctx.db.patch(targetMembership._id, { leftAt: Date.now(), blocked: true })

      // Find all submissions by this user in this circle and redact responses
      const userSubmissions = await ctx.db
        .query('submissions')
        .withIndex('by_user_circle_cycle', (q) =>
          q.eq('userId', args.targetUserId).eq('circleId', args.circleId)
        )
        .collect()

      for (const submission of userSubmissions) {
        // Redact all responses for this submission
        const responses = await ctx.db
          .query('responses')
          .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
          .collect()

        for (const response of responses) {
          await ctx.db.patch(response._id, { text: '[Removed]', updatedAt: Date.now() })

          // Delete associated media
          const mediaItems = await ctx.db
            .query('media')
            .withIndex('by_response', (q) => q.eq('responseId', response._id))
            .collect()

          for (const item of mediaItems) {
            if (item.storageId) {
              await ctx.storage.delete(item.storageId)
            }
            await ctx.db.delete(item._id)
          }
        }
      }
    }

    return { success: true }
  },
})

export const getInviteStatus = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { status: 'not_authenticated' as const }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return { status: 'not_authenticated' as const }

    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .first()

    if (!circle) return { status: 'invalid_invite' as const }

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', circle._id))
      .first()

    if (!membership) return { status: 'can_join' as const }
    if (membership.blocked) return { status: 'blocked' as const }
    if (!membership.leftAt) return { status: 'already_member' as const, circleId: circle._id }

    return { status: 'can_rejoin' as const }
  },
})
