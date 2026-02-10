import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'

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

    if (!callerMembership) throw new Error('Not a member of this circle')

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const members = await Promise.all(
      memberships.map(async (m) => {
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

    return members.length
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

    // Check if already a member
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', circle._id))
      .first()

    if (existing) return { circleId: circle._id, alreadyMember: true }

    await ctx.db.insert('memberships', {
      userId: user._id,
      circleId: circle._id,
      role: 'member',
      joinedAt: Date.now(),
    })

    return { circleId: circle._id, alreadyMember: false }
  },
})
