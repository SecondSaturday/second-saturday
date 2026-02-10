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

  // If today is on or before this month's second Saturday, use it
  if (from <= thisMonth) {
    return thisMonth
  }

  // Otherwise, get next month's
  return getSecondSaturday(year, month + 1)
}

/**
 * Format a date as "Mon DD" (e.g., "Oct 11").
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
