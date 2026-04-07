import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { getAuthUser, requireMembership } from './authHelpers'

/** Validate cycle ID format (YYYY-MM) */
function validateCycleId(cycleId: string): void {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    throw new Error('Cycle ID must be in YYYY-MM format')
  }

  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]!
  if (year < 2024 || year > 2099) {
    throw new Error('Invalid year in cycle ID')
  }
  if (month < 1 || month > 12) {
    throw new Error('Invalid month in cycle ID')
  }
}

/** Validate response text length (500 character limit) */
function validateResponseText(text: string): void {
  if (text.length > 500) {
    throw new Error('Response text must be 500 characters or less')
  }
}

/**
 * Compute the deadline timestamp (10:59 AM UTC on the second Saturday)
 * for the given cycle month (YYYY-MM) or the current month if omitted.
 */
function computeDeadlineTimestamp(cycleMonth?: string): number {
  let year: number
  let month: number // 0-indexed

  if (cycleMonth) {
    const parts = cycleMonth.split('-').map(Number)
    year = parts[0]!
    month = parts[1]! - 1 // convert to 0-indexed
  } else {
    const now = new Date(Date.now())
    year = now.getUTCFullYear()
    month = now.getUTCMonth()
  }

  const firstDayOfMonth = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDayOfMonth.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  return Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)
}

/**
 * Create a new submission for a user in a circle for a specific cycle
 * Constraint: One submission per user per circle per cycle
 */
export const createSubmission = mutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Validate membership
    await requireMembership(ctx, user._id, args.circleId)

    // Validate cycle ID format
    validateCycleId(args.cycleId)

    // Check for existing submission (one per user per circle per cycle)
    const existingSubmission = await ctx.db
      .query('submissions')
      .withIndex('by_user_circle_cycle', (q) =>
        q.eq('userId', user._id).eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .first()

    if (existingSubmission) {
      throw new Error('Only one submission per user per circle per cycle allowed')
    }

    const now = Date.now()
    const submissionId = await ctx.db.insert('submissions', {
      circleId: args.circleId,
      userId: user._id,
      cycleId: args.cycleId,
      createdAt: now,
      updatedAt: now,
    })

    return submissionId
  },
})

/**
 * Update or create a response to a prompt within a submission
 * Supports auto-save functionality
 * Constraint: One response per prompt within a submission
 */
export const updateResponse = mutation({
  args: {
    submissionId: v.id('submissions'),
    promptId: v.id('prompts'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Validate text length
    validateResponseText(args.text)

    // Get submission and verify ownership
    const submission = await ctx.db.get(args.submissionId)
    if (!submission) throw new Error('Submission not found')
    if (submission.userId !== user._id) throw new Error('Not authorized to modify this submission')

    // If locked, auto-unlock if deadline hasn't passed; otherwise block
    if (submission.lockedAt && submission.lockedAt > 0) {
      const deadlineTs = computeDeadlineTimestamp(submission.cycleId)
      if (Date.now() >= deadlineTs) {
        throw new Error('Cannot modify submission after deadline')
      }
      // Silently unlock for editing (keep submittedAt to track "unsubmitted changes" state)
      await ctx.db.patch(args.submissionId, {
        lockedAt: undefined,
        updatedAt: Date.now(),
      })
    }

    // Verify prompt belongs to the same circle
    const prompt = await ctx.db.get(args.promptId)
    if (!prompt) throw new Error('Prompt not found')
    if (prompt.circleId !== submission.circleId) {
      throw new Error('Prompt does not belong to this circle')
    }

    // Check for existing response (one per prompt within submission)
    const existingResponse = await ctx.db
      .query('responses')
      .withIndex('by_submission_prompt', (q) =>
        q.eq('submissionId', args.submissionId).eq('promptId', args.promptId)
      )
      .first()

    const now = Date.now()

    if (existingResponse) {
      // Update existing response
      await ctx.db.patch(existingResponse._id, {
        text: args.text,
        updatedAt: now,
      })

      // Update submission's updatedAt
      await ctx.db.patch(args.submissionId, {
        updatedAt: now,
      })

      return existingResponse._id
    } else {
      // Create new response
      const responseId = await ctx.db.insert('responses', {
        submissionId: args.submissionId,
        promptId: args.promptId,
        text: args.text,
        createdAt: now,
        updatedAt: now,
      })

      // Update submission's updatedAt
      await ctx.db.patch(args.submissionId, {
        updatedAt: now,
      })

      return responseId
    }
  },
})

/**
 * Lock a submission to prevent further modifications
 * Typically called when the submission deadline passes
 */
export const lockSubmission = mutation({
  args: {
    submissionId: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Get submission and verify ownership
    const submission = await ctx.db.get(args.submissionId)
    if (!submission) throw new Error('Submission not found')
    if (submission.userId !== user._id) throw new Error('Not authorized to lock this submission')

    // Check if already locked
    if (submission.lockedAt && submission.lockedAt > 0) {
      throw new Error('Submission is already locked')
    }

    const now = Date.now()
    await ctx.db.patch(args.submissionId, {
      lockedAt: now,
      submittedAt: now,
      updatedAt: now,
    })

    return args.submissionId
  },
})

/**
 * Check if the current user has any non-empty responses across all their circles for a cycle.
 */
export const hasAnyResponses = query({
  args: {
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Get all user's submissions for this cycle
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('cycleId'), args.cycleId))
      .collect()

    for (const submission of submissions) {
      const responses = await ctx.db
        .query('responses')
        .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
        .collect()

      if (responses.some((r) => r.text.trim().length > 0)) {
        return true
      }
    }

    return false
  },
})

/**
 * Get submission for the current user in a specific circle and cycle
 * Includes all responses and their associated prompts
 */
export const getSubmissionForCircle = query({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify membership
    await requireMembership(ctx, user._id, args.circleId)

    // Get submission
    const submission = await ctx.db
      .query('submissions')
      .withIndex('by_user_circle_cycle', (q) =>
        q.eq('userId', user._id).eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .first()

    if (!submission) return null

    // Get all responses for this submission
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
      .collect()

    // Get prompts and media for each response
    const responsesWithDetails = await Promise.all(
      responses.map(async (response) => {
        const prompt = await ctx.db.get(response.promptId)
        const media = await ctx.db
          .query('media')
          .withIndex('by_response', (q) => q.eq('responseId', response._id))
          .collect()

        // Sort media by order
        const sortedMedia = media.sort((a, b) => a.order - b.order)

        // Get media URLs
        const mediaWithUrls = await Promise.all(
          sortedMedia.map(async (m) => {
            let url: string | null = null
            if (m.storageId) {
              url = await ctx.storage.getUrl(m.storageId)
            } else if (m.type === 'video' && m.muxAssetId) {
              // Videos stored on Mux don't have a storageId — look up the playback ID
              const video = await ctx.db
                .query('videos')
                .withIndex('by_asset_id', (q) => q.eq('assetId', m.muxAssetId!))
                .first()
              if (video?.playbackId) {
                url = `https://stream.mux.com/${video.playbackId}.m3u8`
              }
            } else if (m.type === 'video' && m.videoId) {
              // Fallback: muxAssetId not yet populated by webhook, look up via videoId FK
              const video = await ctx.db.get(m.videoId)
              if (video?.playbackId) {
                url = `https://stream.mux.com/${video.playbackId}.m3u8`
              }
            }
            return {
              ...m,
              url,
            }
          })
        )

        return {
          ...response,
          prompt,
          media: mediaWithUrls,
        }
      })
    )

    return {
      ...submission,
      responses: responsesWithDetails,
    }
  },
})

/**
 * Get all active prompts for a circle
 */
export const getPromptsForCircle = query({
  args: {
    circleId: v.id('circles'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify membership
    await requireMembership(ctx, user._id, args.circleId)

    // Get all active prompts ordered by their order field
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const active = prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)
    // Deduplicate by prompt text (safety net for legacy data)
    const seen = new Set<string>()
    return active.filter((p) => {
      const key = p.text.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  },
})

/**
 * Add media to a response
 * Constraint: Up to 3 media items per response
 */
export const addMediaToResponse = mutation({
  args: {
    responseId: v.id('responses'),
    storageId: v.optional(v.id('_storage')),
    muxAssetId: v.optional(v.string()),
    videoId: v.optional(v.id('videos')),
    type: v.union(v.literal('image'), v.literal('video')),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Get response and verify ownership
    const response = await ctx.db.get(args.responseId)
    if (!response) throw new Error('Response not found')

    const submission = await ctx.db.get(response.submissionId)
    if (!submission) throw new Error('Submission not found')
    if (submission.userId !== user._id) throw new Error('Not authorized to modify this response')

    // If locked, auto-unlock if deadline hasn't passed; otherwise block
    if (submission.lockedAt && submission.lockedAt > 0) {
      const deadlineTs = computeDeadlineTimestamp(submission.cycleId)
      if (Date.now() >= deadlineTs) {
        throw new Error('Cannot modify submission after deadline')
      }
      await ctx.db.patch(response.submissionId, {
        lockedAt: undefined,
        updatedAt: Date.now(),
      })
    }

    // Check media count (max 3)
    const existingMedia = await ctx.db
      .query('media')
      .withIndex('by_response', (q) => q.eq('responseId', args.responseId))
      .collect()

    if (existingMedia.length >= 3) {
      throw new Error('Response can have up to 3 media items')
    }

    // Guard against duplicate media on retry
    if (args.storageId) {
      const existing = existingMedia.find((m) => m.storageId === args.storageId)
      if (existing) return existing._id
    }

    // Calculate next order
    const order = existingMedia.length

    const now = Date.now()
    const mediaId = await ctx.db.insert('media', {
      responseId: args.responseId,
      storageId: args.storageId,
      muxAssetId: args.muxAssetId,
      videoId: args.videoId,
      type: args.type,
      thumbnailUrl: args.thumbnailUrl,
      order,
      uploadedAt: now,
      createdAt: now,
    })

    return mediaId
  },
})

/**
 * Remove media from a response
 */
export const removeMediaFromResponse = mutation({
  args: {
    mediaId: v.id('media'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Get media and verify ownership
    const media = await ctx.db.get(args.mediaId)
    if (!media) throw new Error('Media not found')

    const response = await ctx.db.get(media.responseId)
    if (!response) throw new Error('Response not found')

    const submission = await ctx.db.get(response.submissionId)
    if (!submission) throw new Error('Submission not found')
    if (submission.userId !== user._id) throw new Error('Not authorized to remove this media')

    // If locked, auto-unlock if deadline hasn't passed; otherwise block
    if (submission.lockedAt && submission.lockedAt > 0) {
      const deadlineTs = computeDeadlineTimestamp(submission.cycleId)
      if (Date.now() >= deadlineTs) {
        throw new Error('Cannot modify submission after deadline')
      }
      await ctx.db.patch(response.submissionId, {
        lockedAt: undefined,
        updatedAt: Date.now(),
      })
    }

    // Delete the storage blob if it exists
    if (media.storageId) {
      await ctx.storage.delete(media.storageId)
    }

    // If video media, schedule Mux asset cleanup
    if (media.type === 'video' && media.videoId) {
      const video = await ctx.db.get(media.videoId)
      if (video?.assetId) {
        await ctx.scheduler.runAfter(0, internal.videoActions.deleteMuxAsset, {
          assetId: video.assetId,
        })
      }
    }

    // Delete the media record
    await ctx.db.delete(args.mediaId)

    // Reorder remaining media
    const remainingMedia = await ctx.db
      .query('media')
      .withIndex('by_response', (q) => q.eq('responseId', media.responseId))
      .collect()

    const sortedMedia = remainingMedia.sort((a, b) => a.order - b.order)
    for (let i = 0; i < sortedMedia.length; i++) {
      if (sortedMedia[i]!.order !== i) {
        await ctx.db.patch(sortedMedia[i]!._id, { order: i })
      }
    }

    return args.mediaId
  },
})

/**
 * Get deadline status for the current (or specified) cycle.
 * Returns the deadline timestamp, lock state, and seconds remaining.
 */
export const getDeadlineStatus = query({
  args: {
    cycleMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deadlineTimestamp = computeDeadlineTimestamp(args.cycleMonth)
    const now = Date.now()
    const secondsRemaining = Math.max(0, Math.floor((deadlineTimestamp - now) / 1000))
    const isLocked = now >= deadlineTimestamp

    return {
      deadlineTimestamp,
      isLocked,
      secondsRemaining,
    }
  },
})

/**
 * Get review data for all user's circles in a cycle.
 * Returns per-circle: circle info, prompt count, answered count, submission status.
 */
export const getReviewData = query({
  args: {
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Get all user's active memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const activeMemberships = memberships.filter((m) => !m.leftAt)

    const results = await Promise.all(
      activeMemberships.map(async (m) => {
        const circle = await ctx.db.get(m.circleId)
        if (!circle || circle.archivedAt) return null

        // Get active prompts
        const prompts = await ctx.db
          .query('prompts')
          .withIndex('by_circle', (q) => q.eq('circleId', m.circleId))
          .collect()
        const activePrompts = prompts.filter((p) => p.active)

        // Get submission for this cycle
        const submission = await ctx.db
          .query('submissions')
          .withIndex('by_user_circle_cycle', (q) =>
            q.eq('userId', user._id).eq('circleId', m.circleId).eq('cycleId', args.cycleId)
          )
          .first()

        let answeredCount = 0
        if (submission) {
          const responses = await ctx.db
            .query('responses')
            .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
            .collect()
          answeredCount = responses.filter((r) => r.text.trim().length > 0).length
        }

        return {
          circleId: circle._id,
          circleName: circle.name,
          circleIconUrl: circle.iconImageId ? await ctx.storage.getUrl(circle.iconImageId) : null,
          totalPrompts: activePrompts.length,
          answeredCount,
          submissionId: submission?._id ?? null,
          submittedAt: submission?.submittedAt ?? null,
          lockedAt: submission?.lockedAt ?? null,
          updatedAt: submission?.updatedAt ?? null,
        }
      })
    )

    return results.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})
