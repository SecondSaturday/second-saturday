import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

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

/** Validate cycle ID format (YYYY-MM) */
function validateCycleId(cycleId: string): void {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    throw new Error('Cycle ID must be in YYYY-MM format')
  }

  const [year, month] = cycleId.split('-').map(Number)
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

    // Check if submission is locked
    if (submission.lockedAt && submission.lockedAt > 0) {
      throw new Error('Cannot modify locked submission')
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
            let url = null
            if (m.storageId) {
              url = await ctx.storage.getUrl(m.storageId)
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

    return prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)
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

    // Check if submission is locked
    if (submission.lockedAt && submission.lockedAt > 0) {
      throw new Error('Cannot modify locked submission')
    }

    // Check media count (max 3)
    const existingMedia = await ctx.db
      .query('media')
      .withIndex('by_response', (q) => q.eq('responseId', args.responseId))
      .collect()

    if (existingMedia.length >= 3) {
      throw new Error('Response can have up to 3 media items')
    }

    // Calculate next order
    const order = existingMedia.length

    const now = Date.now()
    const mediaId = await ctx.db.insert('media', {
      responseId: args.responseId,
      storageId: args.storageId,
      muxAssetId: args.muxAssetId,
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

    // Check if submission is locked
    if (submission.lockedAt && submission.lockedAt > 0) {
      throw new Error('Cannot modify locked submission')
    }

    // Delete the media
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
