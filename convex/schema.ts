import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    timezone: v.optional(v.string()),
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
    leftAt: v.optional(v.number()),
    blocked: v.optional(v.boolean()),
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

  submissions: defineTable({
    circleId: v.id('circles'),
    userId: v.id('users'),
    cycleId: v.string(), // Format: YYYY-MM for monthly cycles
    submittedAt: v.optional(v.number()),
    lockedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_circle', ['circleId'])
    .index('by_user', ['userId'])
    .index('by_cycle', ['cycleId'])
    .index('by_user_circle_cycle', ['userId', 'circleId', 'cycleId']),

  responses: defineTable({
    submissionId: v.id('submissions'),
    promptId: v.id('prompts'),
    text: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_submission', ['submissionId'])
    .index('by_prompt', ['promptId'])
    .index('by_submission_prompt', ['submissionId', 'promptId']),

  media: defineTable({
    responseId: v.id('responses'),
    storageId: v.optional(v.id('_storage')),
    muxAssetId: v.optional(v.string()),
    type: v.union(v.literal('image'), v.literal('video')),
    thumbnailUrl: v.optional(v.string()),
    order: v.number(), // 0, 1, or 2 (max 3 items)
    uploadedAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_response', ['responseId'])
    .index('by_response_order', ['responseId', 'order']),
})
