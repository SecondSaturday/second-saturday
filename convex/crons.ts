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
      const year = parseInt(yearStr!, 10)
      const month = parseInt(monthStr!, 10) - 1 // 0-indexed

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1))
      const dayOfWeek = firstDayOfMonth.getUTCDay()
      const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
      const secondSaturdayDay = 1 + daysToFirstSaturday + 7
      const deadlineMs = Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)

      if (now >= deadlineMs) {
        const patch: { lockedAt: number; updatedAt: number; submittedAt?: number } = {
          lockedAt: now,
          updatedAt: now,
        }
        if (submission.submittedAt) {
          patch.submittedAt = submission.submittedAt
        }
        await ctx.db.patch(submission._id, patch)
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

crons.cron(
  'compile and send newsletters',
  '0 11 * * 6', // 11:00 AM UTC every Saturday (action checks for second Saturday)
  internal.newsletterEmails.processNewsletters,
  {}
)

// Run every Wednesday at 11:00 UTC to send submission reminders
// (3 days before Saturday deadline — action checks for second Saturday)
crons.weekly(
  'send submission reminders',
  { dayOfWeek: 'wednesday', hourUTC: 11, minuteUTC: 0 },
  internal.notifications.sendSubmissionReminder
)

export default crons
