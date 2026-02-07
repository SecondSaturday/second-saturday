import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'

// Create a new video record when upload starts
export const createVideo = mutation({
  args: {
    uploadId: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
    circleId: v.optional(v.id('circles')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('videos', {
      uploadId: args.uploadId,
      userId: args.userId,
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
    return await ctx.db.get(args.id)
  },
})

// Get videos for a user
export const getVideosByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('videos')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})

// Get videos for a circle
export const getVideosByCircle = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
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
    await ctx.db.delete(args.id)
    return { success: true }
  },
})
