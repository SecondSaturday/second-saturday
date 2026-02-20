import { mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * E2E test data cleanup mutation.
 * Finds circles whose names match known E2E test patterns,
 * then cascade-deletes all related data (prompts, memberships,
 * submissions, responses, media, newsletter reads, newsletters).
 *
 * Does NOT touch pre-existing data — only circles matching the patterns.
 */

// Exact circle names created by E2E tests
const E2E_EXACT_NAMES = new Set([
  'Test Circle',
  'E2E Test Circle',
  'Settings Test Circle',
  'InvLink Section Test',
  'Regen Link Test',
  'Warning Test Circle',
  'Dialog Test Circle',
  'Prompts Default Test',
  'Prompts Library Test',
  'Prompts Content Test',
  'Prompts Count Test',
  'Prompts Add Test',
  'Prompts Custom Test',
  'Prompts Save Test',
  'Prompts Drag Test',
  'E2E Test Circle - Invite Flow',
  'E2E Join Test Circle',
  'E2E Redirect Test Circle',
  'E2E Admin Leave Test',
  'E2E Rejoin Test',
  'E2E Member List Test',
  'E2E Remove Button Test',
  'E2E Rejoin Test Circle',
  'E2E Remove Member Test',
  'E2E Remove Modal Test',
  'E2E Self Remove Test',
  'E2E Submission Dashboard Test',
])

function isE2ECircle(name: string): boolean {
  // Match exact known test names or any circle starting with "E2E "
  return E2E_EXACT_NAMES.has(name) || name.startsWith('E2E ')
}

export const cleanupE2EData = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false

    // Find all circles matching E2E patterns
    const allCircles = await ctx.db.query('circles').collect()
    const e2eCircles = allCircles.filter((c) => isE2ECircle(c.name))

    const stats = {
      circles: 0,
      prompts: 0,
      memberships: 0,
      submissions: 0,
      responses: 0,
      media: 0,
      videos: 0,
      newsletterReads: 0,
      newsletters: 0,
    }

    for (const circle of e2eCircles) {
      // Delete prompts
      const prompts = await ctx.db
        .query('prompts')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
      for (const p of prompts) {
        // Delete responses referencing this prompt
        const responses = await ctx.db
          .query('responses')
          .withIndex('by_prompt', (q) => q.eq('promptId', p._id))
          .collect()
        for (const r of responses) {
          // Delete media for this response
          const media = await ctx.db
            .query('media')
            .withIndex('by_response', (q) => q.eq('responseId', r._id))
            .collect()
          for (const m of media) {
            if (m.storageId && !dryRun) await ctx.storage.delete(m.storageId)
            if (!dryRun) await ctx.db.delete(m._id)
            stats.media++
          }
          if (!dryRun) await ctx.db.delete(r._id)
          stats.responses++
        }
        if (!dryRun) await ctx.db.delete(p._id)
        stats.prompts++
      }

      // Delete submissions for this circle
      const submissions = await ctx.db
        .query('submissions')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
      for (const s of submissions) {
        // Delete responses for this submission
        const responses = await ctx.db
          .query('responses')
          .withIndex('by_submission', (q) => q.eq('submissionId', s._id))
          .collect()
        for (const r of responses) {
          const media = await ctx.db
            .query('media')
            .withIndex('by_response', (q) => q.eq('responseId', r._id))
            .collect()
          for (const m of media) {
            if (m.storageId && !dryRun) await ctx.storage.delete(m.storageId)
            if (!dryRun) await ctx.db.delete(m._id)
            stats.media++
          }
          if (!dryRun) await ctx.db.delete(r._id)
          stats.responses++
        }
        if (!dryRun) await ctx.db.delete(s._id)
        stats.submissions++
      }

      // Delete newsletters and their reads
      const newsletters = await ctx.db
        .query('newsletters')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
      for (const n of newsletters) {
        // Clean up reads for each newsletter (full scan, fine for cleanup)
        const allReads = await ctx.db.query('newsletterReads').collect()
        const nReads = allReads.filter((r) => r.newsletterId === n._id)
        for (const r of nReads) {
          if (!dryRun) await ctx.db.delete(r._id)
          stats.newsletterReads++
        }
        if (!dryRun) await ctx.db.delete(n._id)
        stats.newsletters++
      }

      // Delete memberships
      const memberships = await ctx.db
        .query('memberships')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
      for (const m of memberships) {
        if (!dryRun) await ctx.db.delete(m._id)
        stats.memberships++
      }

      // Delete videos linked to this circle
      const videos = await ctx.db
        .query('videos')
        .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
        .collect()
      for (const vid of videos) {
        if (!dryRun) await ctx.db.delete(vid._id)
        stats.videos++
      }

      // Delete storage blobs for circle images
      if (circle.iconImageId) {
        if (!dryRun) await ctx.storage.delete(circle.iconImageId)
      }
      if (circle.coverImageId) {
        if (!dryRun) await ctx.storage.delete(circle.coverImageId)
      }

      // Delete the circle itself
      if (!dryRun) await ctx.db.delete(circle._id)
      stats.circles++
    }

    return {
      dryRun,
      matchedCircles: e2eCircles.map((c) => c.name),
      deleted: stats,
    }
  },
})
