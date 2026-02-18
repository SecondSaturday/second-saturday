import { cronJobs } from 'convex/server'
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Internal mutation to lock all unlocked submissions whose deadline has passed.
 * Called by the cron job — bypasses user auth since it runs server-side.
 */
export const lockPastDeadlineSubmissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Fetch all submissions that have not been locked yet
    const unlocked = await ctx.db
      .query('submissions')
      .filter((q) => q.eq(q.field('lockedAt'), undefined))
      .collect()

    let lockedCount = 0
    for (const submission of unlocked) {
      // Derive deadline for this submission's cycle (YYYY-MM)
      const [yearStr, monthStr] = submission.cycleId.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1 // 0-indexed

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1))
      const dayOfWeek = firstDayOfMonth.getUTCDay()
      const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
      const secondSaturdayDay = 1 + daysToFirstSaturday + 7
      const deadlineMs = Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)

      if (now >= deadlineMs) {
        await ctx.db.patch(submission._id, {
          lockedAt: now,
          submittedAt: submission.submittedAt ?? now,
          updatedAt: now,
        })
        lockedCount++
      }
    }

    return { lockedCount }
  },
})

// Run at 10:59 AM UTC every Saturday to lock submissions at deadline
const crons = cronJobs()

crons.cron(
  'lock submissions at deadline',
  '59 10 * * 6', // 10:59 AM UTC every Saturday
  internal.crons.lockPastDeadlineSubmissions,
  {}
)

export default crons
