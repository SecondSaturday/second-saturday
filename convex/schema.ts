import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

  videos: defineTable({
    uploadId: v.string(),
    assetId: v.optional(v.string()),
    playbackId: v.optional(v.string()),
    userId: v.string(),
    circleId: v.optional(v.id('circles')),
    title: v.optional(v.string()),
    duration: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
    status: v.string(), // uploading, processing, ready, error
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_upload_id', ['uploadId'])
    .index('by_asset_id', ['assetId'])
    .index('by_user', ['userId'])
    .index('by_circle', ['circleId']),

  circles: defineTable({
    name: v.string(),
    iconImageId: v.optional(v.id('_storage')),
    coverImageId: v.optional(v.id('_storage')),
    description: v.optional(v.string()),
    adminId: v.id('users'),
    inviteCode: v.string(),
    timezone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index('by_admin', ['adminId'])
    .index('by_invite_code', ['inviteCode']),

  prompts: defineTable({
    circleId: v.id('circles'),
    text: v.string(),
    order: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index('by_circle', ['circleId']),

  memberships: defineTable({
    userId: v.id('users'),
    circleId: v.id('circles'),
    role: v.union(v.literal('admin'), v.literal('member')),
    joinedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_circle', ['circleId'])
    .index('by_user_circle', ['userId', 'circleId']),

  newsletters: defineTable({
    circleId: v.id('circles'),
    title: v.optional(v.string()),
    status: v.string(), // draft, published
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_circle', ['circleId']),

  newsletterReads: defineTable({
    userId: v.id('users'),
    circleId: v.id('circles'),
    newsletterId: v.id('newsletters'),
    readAt: v.number(),
  })
    .index('by_user_circle', ['userId', 'circleId'])
    .index('by_user_newsletter', ['userId', 'newsletterId']),
})
