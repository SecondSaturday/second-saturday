import { cronJobs } from 'convex/server'
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { computeSecondSaturdayDeadline } from './lib/dates'

/**
 * Internal mutation to lock all unlocked submissions whose deadline has passed.
 * Called by the cron job — bypasses user auth since it runs server-side.
 */
export const lockPastDeadlineSubmissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const d = new Date(now)
    const year = d.getUTCFullYear()
    const month = d.getUTCMonth() // 0-indexed

    // Build current and prior two cycle IDs to scope the query.
    // Three-cycle window gives headroom if a multi-week outage spans a boundary.
    const currentCycleId = `${year}-${String(month + 1).padStart(2, '0')}`
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevCycleId = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`
    const prev2Month = prevMonth === 0 ? 11 : prevMonth - 1
    const prev2Year = prevMonth === 0 ? prevYear - 1 : prevYear
    const prev2CycleId = `${prev2Year}-${String(prev2Month + 1).padStart(2, '0')}`

    const cyclesToCheck = [currentCycleId, prevCycleId, prev2CycleId]

    let lockedCount = 0
    for (const cycleId of cyclesToCheck) {
      const submissions = await ctx.db
        .query('submissions')
        .withIndex('by_cycle', (q) => q.eq('cycleId', cycleId))
        .collect()

      const unlocked = submissions.filter((s) => !s.lockedAt)

      // Derive deadline for this cycle
      const [yearStr, monthStr] = cycleId.split('-')
      const cYear = parseInt(yearStr!, 10)
      const cMonth = parseInt(monthStr!, 10)
      const deadlineMs = computeSecondSaturdayDeadline(cYear, cMonth)

      if (now >= deadlineMs) {
        for (const submission of unlocked) {
          await ctx.db.patch(submission._id, {
            lockedAt: now,
            updatedAt: now,
          })
          lockedCount++
        }
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

crons.daily(
  'cleanup orphaned storage',
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.cleanupOrphanedStorage
)

crons.daily(
  'cleanup orphaned videos',
  { hourUTC: 3, minuteUTC: 30 },
  internal.cleanup.cleanupOrphanedVideos
)

export default crons
