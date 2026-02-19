import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()

    const now = Date.now()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: now,
      })
      return existingUser._id
    }

    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()

    if (user) {
      await ctx.db.delete(user._id)
    }
  },
})

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
  },
})

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
  },
})

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
    if (!user) throw new Error('User not found')

    const updates: Record<string, unknown> = { updatedAt: Date.now() }

    if (args.name !== undefined) {
      updates.name = args.name
    }

    if (args.avatarStorageId !== undefined) {
      // Delete old avatar from storage if replacing
      if (user.avatarStorageId) {
        await ctx.storage.delete(user.avatarStorageId)
      }
      const url = await ctx.storage.getUrl(args.avatarStorageId)
      if (url) {
        updates.imageUrl = url
        updates.avatarStorageId = args.avatarStorageId
      }
    }

    await ctx.db.patch(user._id, updates)
    return user._id
  },
})

export const setTimezone = mutation({
  args: { timezone: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
    if (!user) throw new Error('User not found')

    await ctx.db.patch(user._id, { timezone: args.timezone, updatedAt: Date.now() })
  },
})

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
    if (!user) throw new Error('User not found')

    // Check if user is admin of any circle
    const adminCircles = await ctx.db
      .query('circles')
      .withIndex('by_admin', (q) => q.eq('adminId', user._id))
      .collect()

    const activeAdminCircles = adminCircles.filter((c) => !c.archivedAt)
    if (activeAdminCircles.length > 0) {
      throw new Error('You must transfer or archive your circles before deleting your account')
    }

    // Set leftAt on all active memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const now = Date.now()
    for (const membership of memberships) {
      if (!membership.leftAt) {
        await ctx.db.patch(membership._id, { leftAt: now })
      }
    }

    // Delete all user-generated content (GDPR compliance)
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    for (const submission of submissions) {
      const responses = await ctx.db
        .query('responses')
        .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
        .collect()

      for (const response of responses) {
        const mediaItems = await ctx.db
          .query('media')
          .withIndex('by_response', (q) => q.eq('responseId', response._id))
          .collect()

        for (const mediaItem of mediaItems) {
          if (mediaItem.storageId) {
            await ctx.storage.delete(mediaItem.storageId)
          }
          await ctx.db.delete(mediaItem._id)
        }

        await ctx.db.delete(response._id)
      }

      await ctx.db.delete(submission._id)
    }

    // Delete all videos by this user
    const videos = await ctx.db
      .query('videos')
      .withIndex('by_user', (q) => q.eq('userId', user.clerkId))
      .collect()

    for (const video of videos) {
      await ctx.db.delete(video._id)
    }

    // Delete user's avatar from storage
    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId)
    }

    // Clean up newsletter read records
    const newsletterReads = await ctx.db
      .query('newsletterReads')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id))
      .collect()
    for (const read of newsletterReads) {
      await ctx.db.delete(read._id)
    }

    // Send deletion confirmation email
    await ctx.scheduler.runAfter(0, internal.emails.sendAccountDeletionEmail, {
      email: user.email,
      name: user.name,
    })

    // Delete the user record
    await ctx.db.delete(user._id)
  },
})
