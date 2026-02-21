import { mutation, query, internalMutation } from './_generated/server'
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

/**
 * Compile a newsletter from submissions for a given circle and cycle.
 * Gathers all submissions, organizes responses by prompt, resolves media URLs,
 * and stores the compiled data as a JSON string in htmlContent.
 */
export const compileNewsletter = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const { circleId, cycleId } = args

    // Get circle for title
    const circle = await ctx.db.get(circleId)
    if (!circle) throw new Error('Circle not found')

    // Get active prompts sorted by order
    const allPrompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const prompts = allPrompts.filter((p) => p.active).sort((a, b) => a.order - b.order)

    // Get active memberships for this circle
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const activeMembers = allMemberships.filter((m) => !m.leftAt)
    const memberCount = activeMembers.length

    // Get all submissions for this circle and cycle
    const allSubmissions = await ctx.db
      .query('submissions')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const submissions = allSubmissions.filter((s) => s.cycleId === cycleId && s.lockedAt)
    const submissionCount = submissions.length

    // Build a map of userId -> user for member names
    const userIds = [...new Set(submissions.map((s) => s.userId))]
    const userMap = new Map<string, string>()
    for (const userId of userIds) {
      const user = await ctx.db.get(userId)
      userMap.set(userId as string, user?.name ?? user?.email ?? 'Unknown Member')
    }

    // For each prompt, collect responses from all submissions
    const sections: Array<{
      promptTitle: string
      responses: Array<{
        memberName: string
        text: string
        media: Array<{ type: string; url: string; thumbnailUrl?: string }>
      }>
    }> = []

    for (const prompt of prompts) {
      const promptResponses: (typeof sections)[number]['responses'] = []

      for (const submission of submissions) {
        // Get response for this submission + prompt
        const response = await ctx.db
          .query('responses')
          .withIndex('by_submission_prompt', (q) =>
            q.eq('submissionId', submission._id).eq('promptId', prompt._id)
          )
          .first()

        if (!response) continue

        // Get media for this response
        const mediaItems = await ctx.db
          .query('media')
          .withIndex('by_response', (q) => q.eq('responseId', response._id))
          .collect()
        const sortedMedia = mediaItems.sort((a, b) => a.order - b.order)

        // Resolve media URLs
        const media: Array<{ type: string; url: string; thumbnailUrl?: string }> = []
        for (const m of sortedMedia) {
          if (m.type === 'image' && m.storageId) {
            const url = await ctx.storage.getUrl(m.storageId)
            if (url) {
              media.push({ type: 'image', url })
            }
          } else if (m.type === 'video' && m.muxAssetId) {
            // Look up playbackId from videos table
            const video = await ctx.db
              .query('videos')
              .withIndex('by_asset_id', (q) => q.eq('assetId', m.muxAssetId!))
              .first()
            if (video?.playbackId) {
              const thumbnailUrl = `https://image.mux.com/${video.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`
              media.push({
                type: 'video',
                url: `https://stream.mux.com/${video.playbackId}.m3u8`,
                thumbnailUrl,
              })
            }
          }
        }

        promptResponses.push({
          memberName: userMap.get(submission.userId as string) ?? 'Unknown Member',
          text: response.text,
          media,
        })
      }

      // Omit prompts with zero responses
      if (promptResponses.length > 0) {
        sections.push({
          promptTitle: prompt.text,
          responses: promptResponses,
        })
      }
    }

    // Calculate issue number
    const existingNewsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const issueNumber = existingNewsletters.length + 1

    // Format title
    const [year, month] = cycleId.split('-')
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const monthName = monthNames[parseInt(month!, 10) - 1] ?? month
    const title = `${circle.name} - ${monthName} ${year}`

    const now = Date.now()

    // Store compiled data as JSON in htmlContent
    const htmlContent = JSON.stringify({ sections })

    const newsletterId = await ctx.db.insert('newsletters', {
      circleId,
      cycleId,
      title,
      htmlContent,
      issueNumber,
      status: 'published',
      submissionCount,
      memberCount,
      publishedAt: now,
      createdAt: now,
    })

    const missedMonth = submissionCount === 0

    return { newsletterId, submissionCount, memberCount, missedMonth }
  },
})
