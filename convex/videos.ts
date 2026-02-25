import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
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

// Create a new video record when upload starts
export const createVideo = mutation({
  args: {
    uploadId: v.string(),
    title: v.optional(v.string()),
    circleId: v.optional(v.id('circles')),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const now = Date.now()
    return await ctx.db.insert('videos', {
      uploadId: args.uploadId,
      userId: user.clerkId,
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
    const user = await getAuthUser(ctx)
    const video = await ctx.db.get(args.id)

    if (!video) {
      throw new Error('Video not found')
    }

    // Check if user is the owner
    if (video.userId === user.clerkId) {
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
      .withIndex('by_user', (q) => q.eq('userId', user.clerkId))
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
    if (video.userId !== user.clerkId) {
      throw new Error('Not authorized to delete this video')
    }

    await ctx.db.delete(args.id)
    return { success: true }
  },
})
