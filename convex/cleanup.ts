import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours
const BATCH_SIZE = 100

/**
 * Clean up orphaned media records whose parent response no longer exists.
 * Deletes the media record and its associated storage blob.
 *
 * Limitation: Convex does not expose a direct _storage query API, so we cannot
 * find storage blobs that were uploaded but never linked to any record. This
 * cleanup only handles media records orphaned by deleted responses.
 */
export const cleanupOrphanedStorage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS

    const allMedia = await ctx.db.query('media').collect()
    const orphanedMedia = allMedia.filter((m) => m.storageId && m.createdAt < cutoff)

    let deletedCount = 0
    for (const m of orphanedMedia.slice(0, BATCH_SIZE)) {
      const response = await ctx.db.get(m.responseId)
      if (!response) {
        // storageId guaranteed non-null by filter above
        await ctx.storage.delete(m.storageId!)
        await ctx.db.delete(m._id)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})

/**
 * Clean up orphaned Mux video records with no matching media entry.
 * Schedules Mux asset deletion via the deleteMuxAsset internal action.
 */
export const cleanupOrphanedVideos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS

    const allVideos = await ctx.db.query('videos').collect()
    let deletedCount = 0

    for (const video of allVideos.slice(0, BATCH_SIZE)) {
      if (video.createdAt > cutoff) continue

      const mediaRef = await ctx.db
        .query('media')
        .withIndex('by_video', (q) => q.eq('videoId', video._id))
        .first()

      if (!mediaRef) {
        if (video.assetId) {
          await ctx.scheduler.runAfter(0, internal.videoActions.deleteMuxAsset, {
            assetId: video.assetId,
          })
        }
        await ctx.db.delete(video._id)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})
