import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

const DEFAULT_PROMPTS = [
  'What did you do this month?',
  'One Good Thing',
  'On Your Mind',
  'What are you listening to?',
]

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

/** Get the authenticated user, auto-creating if not yet synced via webhook (mutations only) */
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

/** Check if user is a member of the circle */
async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'memberships'>> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()

  if (!membership || membership.leftAt) throw new Error('Not a member of this circle')
  return membership
}

/** Check if user is the admin of the circle */
async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
) {
  const membership = await requireMembership(ctx, userId, circleId)
  if (membership.role !== 'admin') throw new Error('Admin access required')
  return membership
}

export const createCircle = mutation({
  args: {
    name: v.string(),
    iconImageId: v.optional(v.id('_storage')),
    coverImageId: v.optional(v.id('_storage')),
    description: v.optional(v.string()),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)

    if (args.name.length < 3 || args.name.length > 50) {
      throw new Error('Circle name must be 3-50 characters')
    }

    const now = Date.now()
    const inviteCode = crypto.randomUUID()

    const circleId = await ctx.db.insert('circles', {
      name: args.name,
      iconImageId: args.iconImageId,
      coverImageId: args.coverImageId,
      description: args.description,
      adminId: user._id,
      inviteCode,
      timezone: args.timezone,
      createdAt: now,
      updatedAt: now,
    })

    // Create admin membership
    await ctx.db.insert('memberships', {
      userId: user._id,
      circleId,
      role: 'admin',
      joinedAt: now,
    })

    // Create default prompts
    for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
      const text = DEFAULT_PROMPTS[i]!
      await ctx.db.insert('prompts', {
        circleId,
        text,
        order: i,
        active: true,
        createdAt: now,
      })
    }

    return circleId
  },
})

export const updateCircle = mutation({
  args: {
    circleId: v.id('circles'),
    name: v.optional(v.string()),
    iconImageId: v.optional(v.id('_storage')),
    coverImageId: v.optional(v.id('_storage')),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)
    await requireAdmin(ctx, user._id, args.circleId)

    const { circleId, ...updates } = args
    const patch: Record<string, string | number | Id<'_storage'> | undefined> = {
      updatedAt: Date.now(),
    }
    if (updates.name !== undefined) {
      if (updates.name.length < 3 || updates.name.length > 50) {
        throw new Error('Circle name must be 3-50 characters')
      }
      patch.name = updates.name
    }
    if (updates.iconImageId !== undefined) patch.iconImageId = updates.iconImageId
    if (updates.coverImageId !== undefined) patch.coverImageId = updates.coverImageId
    if (updates.description !== undefined) patch.description = updates.description

    await ctx.db.patch(circleId, patch)
    return circleId
  },
})

export const regenerateInviteCode = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)
    await requireAdmin(ctx, user._id, args.circleId)

    const newCode = crypto.randomUUID()
    await ctx.db.patch(args.circleId, {
      inviteCode: newCode,
      updatedAt: Date.now(),
    })
    return newCode
  },
})

export const getCirclesByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    // User not synced to Convex yet (webhook pending) — return empty
    if (!user) return []

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const activeMemberships = memberships.filter((m) => !m.leftAt)

    const circles = await Promise.all(
      activeMemberships.map(async (m) => {
        const circle = await ctx.db.get(m.circleId)
        if (!circle || circle.archivedAt) return null

        // Get active member count and preview names
        // Take limited batch to avoid reading too many documents
        const memberBatch = await ctx.db
          .query('memberships')
          .withIndex('by_circle', (q) => q.eq('circleId', m.circleId))
          .take(200)
        const activeMembers = memberBatch.filter((mem) => !mem.leftAt)

        const memberUsers = await Promise.all(
          activeMembers.slice(0, 5).map(async (mem) => {
            const u = await ctx.db.get(mem.userId)
            return u?.name ?? u?.email ?? 'Unknown'
          })
        )

        // Check for unread newsletters
        const latestNewsletter = await ctx.db
          .query('newsletters')
          .withIndex('by_circle', (q) => q.eq('circleId', m.circleId))
          .order('desc')
          .first()

        let hasUnread = false
        if (latestNewsletter) {
          const read = await ctx.db
            .query('newsletterReads')
            .withIndex('by_user_newsletter', (q) =>
              q.eq('userId', user._id).eq('newsletterId', latestNewsletter._id)
            )
            .first()
          hasUnread = !read
        }

        // Get icon URL if exists
        const iconUrl = circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null

        return {
          ...circle,
          iconUrl,
          role: m.role,
          memberCount: activeMembers.length,
          memberNames: memberUsers,
          hasUnread,
        }
      })
    )

    return circles.filter(Boolean)
  },
})

export const getCircle = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Check membership - return null if not a member
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!membership || membership.leftAt) return null

    const circle = await ctx.db.get(args.circleId)
    if (!circle) return null

    const iconUrl = circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null
    const coverUrl = circle.coverImageId ? await ctx.storage.getUrl(circle.coverImageId) : null

    const members = (
      await ctx.db
        .query('memberships')
        .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
        .collect()
    ).filter((m) => !m.leftAt)

    const newsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    return {
      ...circle,
      iconUrl,
      coverUrl,
      memberCount: members.length,
      role: membership.role,
      newsletterCount: newsletters.filter((n) => n.status === 'published').length,
    }
  },
})

export const getCircleByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .first()

    if (!circle) return null

    const iconUrl = circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null

    const admin = await ctx.db.get(circle.adminId)

    const members = (
      await ctx.db
        .query('memberships')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
    ).filter((m) => !m.leftAt)

    return {
      _id: circle._id,
      name: circle.name,
      description: circle.description,
      iconUrl,
      memberCount: members.length,
      adminName: admin?.name ?? admin?.email ?? 'Unknown',
    }
  },
})
