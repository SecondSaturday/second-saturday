/**
 * Compute the second Saturday of a given month as a UTC timestamp.
 * Returns the date at 10:59:00 UTC (the submission deadline).
 */
export function computeSecondSaturdayDeadline(year: number, month: number): number {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  return Date.UTC(year, month - 1, secondSaturdayDay, 10, 59, 0)
}

/**
 * Get just the day-of-month for the second Saturday of a given month.
 */
export function getSecondSaturdayDay(year: number, month: number): number {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  return 1 + daysToFirstSaturday + 7
}

/**
 * Parse a cycleId string (e.g., "2026-04") into year and month.
 */
export function parseCycleId(cycleId: string): { year: number; month: number } {
  const [yearStr, monthStr] = cycleId.split('-')
  return { year: parseInt(yearStr!, 10), month: parseInt(monthStr!, 10) }
}
