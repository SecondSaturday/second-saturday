import { internalQuery, internalMutation } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'

export interface ResolvedMediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
}

/**
 * Resolve all media attached to a response into renderable URLs.
 * Images come from Convex storage; videos resolve to Mux HLS + thumbnail.
 * Shared between newsletter compile and member profile queries.
 */
export async function resolveResponseMedia(
  ctx: QueryCtx | MutationCtx,
  responseId: Id<'responses'>
): Promise<ResolvedMediaItem[]> {
  const mediaItems = await ctx.db
    .query('media')
    .withIndex('by_response', (q) => q.eq('responseId', responseId))
    .collect()
  const sortedMedia = mediaItems.sort((a, b) => a.order - b.order)

  const resolved: ResolvedMediaItem[] = []
  for (const m of sortedMedia) {
    if (m.type === 'image' && m.storageId) {
      const url = await ctx.storage.getUrl(m.storageId)
      if (url) resolved.push({ type: 'image', url })
    } else if (m.type === 'video' && m.muxAssetId) {
      const video = await ctx.db
        .query('videos')
        .withIndex('by_asset_id', (q) => q.eq('assetId', m.muxAssetId!))
        .first()
      if (video?.playbackId) {
        resolved.push({
          type: 'video',
          url: `https://stream.mux.com/${video.playbackId}.m3u8`,
          thumbnailUrl: `https://image.mux.com/${video.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`,
        })
      }
    } else if (m.type === 'video' && m.videoId) {
      const video = await ctx.db.get(m.videoId)
      if (video?.playbackId) {
        resolved.push({
          type: 'video',
          url: `https://stream.mux.com/${video.playbackId}.m3u8`,
          thumbnailUrl: `https://image.mux.com/${video.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`,
        })
      }
    }
  }
  return resolved
}

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
    return await ctx.db
      .query('circles')
      .withIndex('by_archived', (q) => q.eq('archivedAt', undefined))
      .collect()
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

/**
 * Internal mutation to atomically claim the send slot for a newsletter.
 * Returns true if the caller successfully claimed the slot (i.e., sentAt was unset).
 * Returns false if a prior invocation already claimed it — caller must bail to avoid duplicate sends.
 */
export const claimNewsletterSendSlot = internalMutation({
  args: { newsletterId: v.id('newsletters') },
  handler: async (ctx, args) => {
    const newsletter = await ctx.db.get(args.newsletterId)
    if (!newsletter) return false
    if (newsletter.sentAt) return false
    await ctx.db.patch(args.newsletterId, { sentAt: Date.now() })
    return true
  },
})

/**
 * Internal query to look up an existing newsletter row by (circleId, cycleId).
 */
export const getNewsletterByCircleCycle = internalQuery({
  args: { circleId: v.id('circles'), cycleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('newsletters')
      .withIndex('by_circle_cycle', (q) =>
        q.eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .first()
  },
})
