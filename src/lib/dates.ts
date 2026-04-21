/**
 * Get the second Saturday of a given month/year.
 */
export function getSecondSaturday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1)
  const firstSaturday = ((6 - firstDay.getDay() + 7) % 7) + 1
  return new Date(year, month, firstSaturday + 7)
}

/**
 * Get the next upcoming second Saturday from a given date.
 * If today IS the second Saturday, returns today.
 * If past this month's, returns next month's.
 */
export function getNextSecondSaturday(from: Date = new Date()): Date {
  const year = from.getFullYear()
  const month = from.getMonth()

  const thisMonth = getSecondSaturday(year, month)
  const thisDeadline = getSecondSaturdayDeadline(thisMonth)

  // If we're still before this month's deadline, use it
  if (from.getTime() <= thisDeadline.getTime()) {
    return thisMonth
  }

  // Otherwise, get next month's
  return getSecondSaturday(year, month + 1)
}

/**
 * Get the most recent past second Saturday from a given date.
 * If today IS the second Saturday, returns today.
 * If before this month's second Saturday, returns last month's.
 */
export function getLastSecondSaturday(from: Date = new Date()): Date {
  const year = from.getFullYear()
  const month = from.getMonth()

  const thisMonth = getSecondSaturday(year, month)

  // If today is on or after this month's second Saturday, use it
  if (from >= thisMonth) {
    return thisMonth
  }

  // Otherwise, get last month's
  return getSecondSaturday(year, month - 1)
}

/**
 * Format a date as "Mon DD" (e.g., "Oct 11").
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Returns 10:59 AM UTC on the second Saturday of the month containing `date`.
 */
export function getSecondSaturdayDeadline(date: Date): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  // Find the first day of the month in UTC
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDayOfMonth.getUTCDay()
  // Days until the first Saturday (day 6)
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  // Deadline is 10:59:00 UTC on the second Saturday
  return new Date(Date.UTC(year, month, secondSaturdayDay, 10, 59, 0))
}

/**
 * Returns time remaining until deadline.
 */
export function getTimeRemaining(deadline: Date): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
} {
  const totalMs = deadline.getTime() - Date.now()

  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }

  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, isPast: false }
}

/**
 * Returns a human-friendly "Due in N days" label for the current cycle's deadline.
 * Uses calendar-day diff in the local timezone so crossings aren't off-by-one.
 */
/**
 * Returns the active cycle id (format `YYYY-MM`) in UTC.
 * If the current month's second-Saturday deadline has passed, rolls to next month —
 * so the client never opens a locked (past-deadline) cycle.
 */
export function getActiveCycleId(now: Date = new Date()): string {
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth() // 0-indexed
  const deadline = getSecondSaturdayDeadline(now)
  if (now.getTime() > deadline.getTime()) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function getDueLabel(): string {
  const now = new Date()
  let deadline = getSecondSaturdayDeadline(now)
  if (now.getTime() > deadline.getTime()) {
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    deadline = getSecondSaturdayDeadline(nextMonth)
  }
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dlDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime()
  const days = Math.round((dlDay - nowDay) / 86400000)
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}
