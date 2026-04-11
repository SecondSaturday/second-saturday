import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { getAuthUser, requireMembership } from './authHelpers'

// Create a new video record when upload starts
export const createVideo = mutation({
  args: {
    uploadId: v.string(),
    title: v.optional(v.string()),
    circleId: v.optional(v.id('circles')),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (args.circleId) {
      await requireMembership(ctx, user._id, args.circleId)
    }
    const now = Date.now()
    return await ctx.db.insert('videos', {
      uploadId: args.uploadId,
      userId: user._id,
      title: args.title,
      circleId: args.circleId,
      status: 'uploading',
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update video when Mux asset is created (internal - called from webhooks)
export const updateVideoAsset = internalMutation({
  args: {
    uploadId: v.string(),
    assetId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query('videos')
      .withIndex('by_upload_id', (q) => q.eq('uploadId', args.uploadId))
      .first()

    if (!video) {
      console.error('Video not found for upload:', args.uploadId)
      return null
    }

    await ctx.db.patch(video._id, {
      assetId: args.assetId,
      status: args.status,
      updatedAt: Date.now(),
    })

    return video._id
  },
})

// Update video when Mux asset is ready (internal - called from webhooks)
export const updateVideoReady = internalMutation({
  args: {
    assetId: v.string(),
    playbackId: v.string(),
    duration: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query('videos')
      .withIndex('by_asset_id', (q) => q.eq('assetId', args.assetId))
      .first()

    if (!video) {
      console.error('Video not found for asset:', args.assetId)
      return null
    }

    await ctx.db.patch(video._id, {
      playbackId: args.playbackId,
      duration: args.duration,
      aspectRatio: args.aspectRatio,
      status: 'ready',
      updatedAt: Date.now(),
    })

    // Update linked media record with muxAssetId so newsletters can find the video
    const linkedMedia = await ctx.db
      .query('media')
      .withIndex('by_video', (q) => q.eq('videoId', video._id))
      .first()

    if (linkedMedia && !linkedMedia.muxAssetId) {
      await ctx.db.patch(linkedMedia._id, { muxAssetId: args.assetId })
    }

    return video._id
  },
})

// Mark video as errored (internal - called from webhooks)
export const updateVideoError = internalMutation({
  args: {
    assetId: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query('videos')
      .withIndex('by_asset_id', (q) => q.eq('assetId', args.assetId))
      .first()

    if (!video) {
      console.error('Video not found for asset:', args.assetId)
      return null
    }

    // Don't overwrite a ready video with an error from a stale/replayed event
    if (video.status === 'ready') {
      return null
    }

    await ctx.db.patch(video._id, {
      status: 'error',
      error: args.error,
      updatedAt: Date.now(),
    })

    return video._id
  },
})

// Get video by ID
export const getVideo = query({
  args: { id: v.id('videos') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const video = await ctx.db.get(args.id)

    if (!video) {
      throw new Error('Video not found')
    }

    // Check if user is the owner
    if (video.userId === user._id) {
      return video
    }

    // If video has a circleId, check circle membership
    if (video.circleId) {
      await requireMembership(ctx, user._id, video.circleId)
      return video
    }

    // User is neither owner nor circle member
    throw new Error('Not authorized to view this video')
  },
})

// Get videos for a user
export const getVideosByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)
    return await ctx.db
      .query('videos')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect()
  },
})

// Get videos for a circle
export const getVideosByCircle = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await requireMembership(ctx, user._id, args.circleId)

    return await ctx.db
      .query('videos')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .order('desc')
      .collect()
  },
})

// Delete a video
export const deleteVideo = mutation({
  args: { id: v.id('videos') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const video = await ctx.db.get(args.id)

    if (!video) {
      throw new Error('Video not found')
    }

    // Verify ownership
    if (video.userId !== user._id) {
      throw new Error('Not authorized to delete this video')
    }

    // Schedule Mux asset deletion before removing the DB record
    if (video.assetId) {
      await ctx.scheduler.runAfter(0, internal.videoActions.deleteMuxAsset, {
        assetId: video.assetId,
      })
    }

    // Clean up linked media records that reference this video,
    // tracking affected responses so we can renumber remaining siblings.
    const linkedMedia = await ctx.db
      .query('media')
      .withIndex('by_video', (q) => q.eq('videoId', args.id))
      .collect()
    const affectedResponseIds = new Set<string>()
    for (const m of linkedMedia) {
      if (m.storageId) {
        await ctx.storage.delete(m.storageId)
      }
      affectedResponseIds.add(m.responseId as unknown as string)
      await ctx.db.delete(m._id)
    }

    // Renumber remaining media per response to keep `order` contiguous (0..n-1)
    for (const responseId of affectedResponseIds) {
      const remaining = await ctx.db
        .query('media')
        .withIndex('by_response', (q) =>
          q.eq('responseId', responseId as unknown as Id<'responses'>)
        )
        .collect()
      const sorted = remaining.sort((a, b) => a.order - b.order)
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i]!.order !== i) {
          await ctx.db.patch(sorted[i]!._id, { order: i })
        }
      }
    }

    await ctx.db.delete(args.id)
    return { success: true }
  },
})
