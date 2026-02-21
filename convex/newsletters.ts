import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'

/** Get the authenticated user or throw */
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

/** Check if user is an active member of the circle */
async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Doc<'users'>['_id'],
  circleId: Doc<'circles'>['_id']
): Promise<Doc<'memberships'>> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()

  if (!membership || membership.leftAt) throw new Error('Not a member of this circle')
  return membership
}

export const getNewsletterById = query({
  args: { newsletterId: v.id('newsletters') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const newsletter = await ctx.db.get(args.newsletterId)
    if (!newsletter) return null

    await requireMembership(ctx, user._id, newsletter.circleId)

    // Get circle info for display
    const circle = await ctx.db.get(newsletter.circleId)

    // Check read status
    const read = await ctx.db
      .query('newsletterReads')
      .withIndex('by_user_newsletter', (q) =>
        q.eq('userId', user._id).eq('newsletterId', newsletter._id)
      )
      .first()

    const iconUrl = circle?.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null
    const coverUrl = circle?.coverImageId ? await ctx.storage.getUrl(circle.coverImageId) : null

    return {
      ...newsletter,
      circle: circle ? { name: circle.name, iconUrl, coverUrl, timezone: circle.timezone } : null,
      isRead: !!read,
    }
  },
})

export const getNewslettersByCircle = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await requireMembership(ctx, user._id, args.circleId)

    const newsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    // Sort newest first by publishedAt (or createdAt as fallback)
    const sorted = newsletters
      .filter((n) => n.status === 'published')
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))

    const withReadStatus = await Promise.all(
      sorted.map(async (n) => {
        const read = await ctx.db
          .query('newsletterReads')
          .withIndex('by_user_newsletter', (q) =>
            q.eq('userId', user._id).eq('newsletterId', n._id)
          )
          .first()

        return {
          _id: n._id,
          circleId: n.circleId,
          cycleId: n.cycleId,
          title: n.title,
          issueNumber: n.issueNumber,
          status: n.status,
          submissionCount: n.submissionCount,
          memberCount: n.memberCount,
          publishedAt: n.publishedAt,
          createdAt: n.createdAt,
          isRead: !!read,
        }
      })
    )

    return withReadStatus
  },
})

export const getLatestNewsletter = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await requireMembership(ctx, user._id, args.circleId)

    const latest = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .order('desc')
      .first()

    if (!latest || latest.status !== 'published') return null

    const read = await ctx.db
      .query('newsletterReads')
      .withIndex('by_user_newsletter', (q) =>
        q.eq('userId', user._id).eq('newsletterId', latest._id)
      )
      .first()

    return { ...latest, isRead: !!read }
  },
})

export const unsubscribeFromEmail = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const membership = await requireMembership(ctx, user._id, args.circleId)

    await ctx.db.patch(membership._id, { emailUnsubscribed: true })
    return { success: true }
  },
})

export const resubscribeToEmail = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const membership = await requireMembership(ctx, user._id, args.circleId)

    await ctx.db.patch(membership._id, { emailUnsubscribed: undefined })
    return { success: true }
  },
})
