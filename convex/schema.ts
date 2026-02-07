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
})
