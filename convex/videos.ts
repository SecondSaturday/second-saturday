'use node'

import { v } from 'convex/values'
import { mutation, query, internalMutation, action } from './_generated/server'
import Mux from '@mux/mux-node'
import { api } from './_generated/api'

// Initialize Mux client
const getMuxClient = () => {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be configured')
  }

  return new Mux({ tokenId, tokenSecret })
}

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

// Upload video to Mux - Returns direct upload URL
export const uploadVideoToMux = action({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    circleId: v.optional(v.id('circles')),
  },
  handler: async (ctx, args) => {
    try {
      const mux = getMuxClient()

      // Create a direct upload
      const upload = await mux.video.uploads.create({
        cors_origin: '*', // Configure based on your domain in production
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard',
        },
      })

      // Create video record in database
      const videoId = await ctx.runMutation(api.videos.createVideo, {
        uploadId: upload.id,
        userId: args.userId,
        title: args.title,
        circleId: args.circleId,
      })

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
        videoId,
      }
    } catch (error) {
      console.error('Failed to create Mux upload:', error)
      throw new Error(
        `Failed to create video upload: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
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
