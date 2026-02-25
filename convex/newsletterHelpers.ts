import { internalQuery, internalMutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Internal query to get newsletter data needed for sending emails.
 * Returns newsletter, circle info, icon URL, and active subscribed members.
 */
export const getNewsletterSendData = internalQuery({
  args: { newsletterId: v.id('newsletters') },
  handler: async (ctx, args) => {
    const newsletter = await ctx.db.get(args.newsletterId)
    if (!newsletter) throw new Error('Newsletter not found')

    const circle = await ctx.db.get(newsletter.circleId)
    if (!circle) throw new Error('Circle not found')

    const iconUrl = circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null

    // Get active, non-blocked, email-subscribed members
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', newsletter.circleId))
      .collect()

    const activeMemberships = allMemberships.filter(
      (m) => !m.leftAt && !m.blocked && !m.emailUnsubscribed
    )

    // Resolve member emails
    const recipients: Array<{ email: string; name: string | undefined }> = []
    for (const membership of activeMemberships) {
      const user = await ctx.db.get(membership.userId)
      if (user?.email) {
        recipients.push({ email: user.email, name: user.name })
      }
    }

    return {
      newsletter,
      circleName: circle.name,
      iconUrl,
      recipients,
    }
  },
})

/**
 * Internal query to get circle data and subscribed members for missed-month emails.
 */
export const getCircleSendData = internalQuery({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const circle = await ctx.db.get(args.circleId)
    if (!circle) throw new Error('Circle not found')

    const iconUrl = circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null

    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMemberships = allMemberships.filter(
      (m) => !m.leftAt && !m.blocked && !m.emailUnsubscribed
    )

    const recipients: Array<{ email: string; name: string | undefined }> = []
    for (const membership of activeMemberships) {
      const user = await ctx.db.get(membership.userId)
      if (user?.email) {
        recipients.push({ email: user.email, name: user.name })
      }
    }

    return {
      circleName: circle.name,
      iconUrl,
      recipients,
    }
  },
})

/**
 * Internal query to get all non-archived circles.
 */
export const getAllActiveCircles = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allCircles = await ctx.db.query('circles').collect()
    return allCircles.filter((c) => !c.archivedAt)
  },
})

/**
 * Internal mutation to update newsletter recipient count after sending.
 */
export const updateRecipientCount = internalMutation({
  args: {
    newsletterId: v.id('newsletters'),
    recipientCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.newsletterId, { recipientCount: args.recipientCount })
  },
})
