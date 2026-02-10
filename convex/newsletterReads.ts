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

export const markNewsletterRead = mutation({
  args: {
    circleId: v.id('circles'),
    newsletterId: v.id('newsletters'),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)

    // Verify membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!membership) throw new Error('Not a member of this circle')

    // Check if already read
    const existing = await ctx.db
      .query('newsletterReads')
      .withIndex('by_user_newsletter', (q) =>
        q.eq('userId', user._id).eq('newsletterId', args.newsletterId)
      )
      .first()

    if (existing) return existing._id

    return await ctx.db.insert('newsletterReads', {
      userId: user._id,
      circleId: args.circleId,
      newsletterId: args.newsletterId,
      readAt: Date.now(),
    })
  },
})

export const getNewslettersByDate = query({
  args: {
    circleId: v.id('circles'),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!membership) throw new Error('Not a member of this circle')

    const startOfMonth = new Date(args.year, args.month, 1).getTime()
    const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime()

    const newsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const filtered = newsletters.filter(
      (n) => n.publishedAt && n.publishedAt >= startOfMonth && n.publishedAt <= endOfMonth
    )

    const withReadStatus = await Promise.all(
      filtered.map(async (n) => {
        const read = await ctx.db
          .query('newsletterReads')
          .withIndex('by_user_newsletter', (q) =>
            q.eq('userId', user._id).eq('newsletterId', n._id)
          )
          .first()

        return { ...n, isRead: !!read }
      })
    )

    return withReadStatus
  },
})
