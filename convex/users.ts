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
      const url = await ctx.storage.getUrl(args.avatarStorageId)
      if (url) {
        updates.imageUrl = url
      }
    }

    await ctx.db.patch(user._id, updates)
    return user._id
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

    // Send deletion confirmation email
    await ctx.scheduler.runAfter(0, internal.emails.sendAccountDeletionEmail, {
      email: user.email,
      name: user.name,
    })

    // Delete the user record
    await ctx.db.delete(user._id)
  },
})
