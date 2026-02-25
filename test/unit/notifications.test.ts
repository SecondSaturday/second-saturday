/**
 * Unit tests for notification business logic.
 *
 * Tests the logic from convex/notifications.ts replicated in isolation,
 * following the same pattern as newsletter.test.ts.
 */
import { describe, it, expect } from 'vitest'

// --- Replicated logic from convex/notifications.ts ---

/** Default notification preferences when no prefs exist */
function getDefaultPreferences(): { submissionReminders: boolean; newsletterReady: boolean } {
  return { submissionReminders: true, newsletterReady: true }
}

/** Return preferences from a record, or defaults if null */
function resolvePreferences(
  prefs: { submissionReminders: boolean; newsletterReady: boolean } | null
): { submissionReminders: boolean; newsletterReady: boolean } {
  if (!prefs) {
    return getDefaultPreferences()
  }
  return {
    submissionReminders: prefs.submissionReminders,
    newsletterReady: prefs.newsletterReady,
  }
}

/** Check if admin has reached the max 3 reminders per cycle */
function hasReachedReminderLimit(existingCount: number): boolean {
  return existingCount >= 3
}

// --- Replicated non-submitter filtering logic ---

interface Membership {
  _id: string
  userId: string
  circleId: string
  role: 'admin' | 'member'
  leftAt?: number
  blocked?: boolean
}

interface Submission {
  _id: string
  circleId: string
  userId: string
  cycleId: string
  submittedAt?: number
}

/**
 * Filter active members who have not submitted for the given cycle.
 * Replicates getNonSubmittersInternal from convex/notifications.ts.
 */
function getNonSubmitters(
  memberships: Membership[],
  submissions: Submission[],
  cycleId: string
): Membership[] {
  const activeMembers = memberships.filter((m) => !m.leftAt && !m.blocked)

  const submittedUserIds = new Set(
    submissions.filter((s) => s.cycleId === cycleId && s.submittedAt).map((s) => s.userId)
  )

  return activeMembers.filter((m) => !submittedUserIds.has(m.userId))
}

// --- Replicated isComingSaturdaySecondSaturday logic ---

/**
 * Check if the coming Saturday (3 days from the given Wednesday date)
 * is the second Saturday of its month.
 */
function isComingSaturdaySecondSaturday(now: Date): boolean {
  const saturday = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const day = saturday.getUTCDate()
  return saturday.getUTCDay() === 6 && day >= 8 && day <= 14
}

/**
 * Pure second-Saturday detection: day 8-14 and dayOfWeek === 6.
 */
function isSecondSaturday(date: Date): boolean {
  if (date.getUTCDay() !== 6) return false
  const day = date.getUTCDate()
  return day >= 8 && day <= 14
}

// --- Replicated cycleId format logic ---

/** Generate cycleId in YYYY-MM format from a Date */
function generateCycleId(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// --- Tests ---

describe('Notification preference defaults', () => {
  it('returns submissionReminders: true when no prefs exist', () => {
    const defaults = getDefaultPreferences()
    expect(defaults.submissionReminders).toBe(true)
  })

  it('returns newsletterReady: true when no prefs exist', () => {
    const defaults = getDefaultPreferences()
    expect(defaults.newsletterReady).toBe(true)
  })

  it('resolvePreferences returns defaults for null input', () => {
    const result = resolvePreferences(null)
    expect(result).toEqual({ submissionReminders: true, newsletterReady: true })
  })

  it('resolvePreferences returns actual values when prefs exist', () => {
    const result = resolvePreferences({ submissionReminders: false, newsletterReady: true })
    expect(result.submissionReminders).toBe(false)
    expect(result.newsletterReady).toBe(true)
  })

  it('resolvePreferences returns both false when both disabled', () => {
    const result = resolvePreferences({ submissionReminders: false, newsletterReady: false })
    expect(result.submissionReminders).toBe(false)
    expect(result.newsletterReady).toBe(false)
  })

  it('default preferences have exactly two keys', () => {
    const defaults = getDefaultPreferences()
    expect(Object.keys(defaults)).toHaveLength(2)
    expect(Object.keys(defaults).sort()).toEqual(['newsletterReady', 'submissionReminders'])
  })
})

describe('Admin reminder count tracking', () => {
  it('allows reminders when count is 0', () => {
    expect(hasReachedReminderLimit(0)).toBe(false)
  })

  it('allows reminders when count is 1', () => {
    expect(hasReachedReminderLimit(1)).toBe(false)
  })

  it('allows reminders when count is 2', () => {
    expect(hasReachedReminderLimit(2)).toBe(false)
  })

  it('blocks reminders when count is 3 (max reached)', () => {
    expect(hasReachedReminderLimit(3)).toBe(true)
  })

  it('blocks reminders when count exceeds 3', () => {
    expect(hasReachedReminderLimit(4)).toBe(true)
    expect(hasReachedReminderLimit(10)).toBe(true)
  })
})

describe('Non-submitter filtering (getNonSubmittersInternal logic)', () => {
  const baseMemberships: Membership[] = [
    { _id: 'mem1', userId: 'u1', circleId: 'c1', role: 'admin' },
    { _id: 'mem2', userId: 'u2', circleId: 'c1', role: 'member' },
    { _id: 'mem3', userId: 'u3', circleId: 'c1', role: 'member' },
  ]

  it('returns all active members when no submissions exist', () => {
    const result = getNonSubmitters(baseMemberships, [], '2026-02')
    expect(result).toHaveLength(3)
  })

  it('excludes members who have submitted for the cycle', () => {
    const submissions: Submission[] = [
      { _id: 's1', circleId: 'c1', userId: 'u1', cycleId: '2026-02', submittedAt: 1000 },
    ]

    const result = getNonSubmitters(baseMemberships, submissions, '2026-02')
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.userId)).toEqual(['u2', 'u3'])
  })

  it('excludes members with leftAt (not active)', () => {
    const memberships: Membership[] = [
      { _id: 'mem1', userId: 'u1', circleId: 'c1', role: 'member' },
      { _id: 'mem2', userId: 'u2', circleId: 'c1', role: 'member', leftAt: 1000 },
    ]

    const result = getNonSubmitters(memberships, [], '2026-02')
    expect(result).toHaveLength(1)
    expect(result[0]!.userId).toBe('u1')
  })

  it('excludes blocked members', () => {
    const memberships: Membership[] = [
      { _id: 'mem1', userId: 'u1', circleId: 'c1', role: 'member' },
      { _id: 'mem2', userId: 'u2', circleId: 'c1', role: 'member', blocked: true },
    ]

    const result = getNonSubmitters(memberships, [], '2026-02')
    expect(result).toHaveLength(1)
    expect(result[0]!.userId).toBe('u1')
  })

  it('ignores submissions without submittedAt', () => {
    const submissions: Submission[] = [
      { _id: 's1', circleId: 'c1', userId: 'u1', cycleId: '2026-02' }, // no submittedAt
    ]

    const result = getNonSubmitters(baseMemberships, submissions, '2026-02')
    // u1 has no submittedAt, so still counts as non-submitter
    expect(result).toHaveLength(3)
  })

  it('ignores submissions for a different cycle', () => {
    const submissions: Submission[] = [
      { _id: 's1', circleId: 'c1', userId: 'u1', cycleId: '2026-01', submittedAt: 1000 },
    ]

    const result = getNonSubmitters(baseMemberships, submissions, '2026-02')
    // u1 submitted for a different cycle, so still non-submitter for 2026-02
    expect(result).toHaveLength(3)
  })

  it('returns empty array when all active members have submitted', () => {
    const submissions: Submission[] = [
      { _id: 's1', circleId: 'c1', userId: 'u1', cycleId: '2026-02', submittedAt: 1000 },
      { _id: 's2', circleId: 'c1', userId: 'u2', cycleId: '2026-02', submittedAt: 2000 },
      { _id: 's3', circleId: 'c1', userId: 'u3', cycleId: '2026-02', submittedAt: 3000 },
    ]

    const result = getNonSubmitters(baseMemberships, submissions, '2026-02')
    expect(result).toHaveLength(0)
  })

  it('combines leftAt and blocked exclusions correctly', () => {
    const memberships: Membership[] = [
      { _id: 'mem1', userId: 'u1', circleId: 'c1', role: 'member' },
      { _id: 'mem2', userId: 'u2', circleId: 'c1', role: 'member', leftAt: 1000 },
      { _id: 'mem3', userId: 'u3', circleId: 'c1', role: 'member', blocked: true },
      { _id: 'mem4', userId: 'u4', circleId: 'c1', role: 'member', leftAt: 500, blocked: true },
    ]

    const result = getNonSubmitters(memberships, [], '2026-02')
    expect(result).toHaveLength(1)
    expect(result[0]!.userId).toBe('u1')
  })

  it('handles empty membership list', () => {
    const result = getNonSubmitters([], [], '2026-02')
    expect(result).toHaveLength(0)
  })
})

describe('isComingSaturdaySecondSaturday logic', () => {
  it('returns true when Wednesday + 3 days lands on second Saturday (day 8-14)', () => {
    // Wed Feb 11, 2026 -> Sat Feb 14, 2026 (day 14, second Saturday)
    const wednesday = new Date(Date.UTC(2026, 1, 11, 12, 0, 0))
    expect(isComingSaturdaySecondSaturday(wednesday)).toBe(true)
  })

  it('returns false when coming Saturday is the first Saturday (day < 8)', () => {
    // Wed Feb 4, 2026 -> Sat Feb 7, 2026 (day 7, first Saturday)
    const wednesday = new Date(Date.UTC(2026, 1, 4, 12, 0, 0))
    expect(isComingSaturdaySecondSaturday(wednesday)).toBe(false)
  })

  it('returns false when coming Saturday is the third Saturday (day > 14)', () => {
    // Wed Feb 18, 2026 -> Sat Feb 21, 2026 (day 21, third Saturday)
    const wednesday = new Date(Date.UTC(2026, 1, 18, 12, 0, 0))
    expect(isComingSaturdaySecondSaturday(wednesday)).toBe(false)
  })

  it('returns true when coming Saturday is day 8', () => {
    // Wed Aug 5, 2026 -> Sat Aug 8, 2026 (day 8, second Saturday)
    const wednesday = new Date(Date.UTC(2026, 7, 5, 12, 0, 0))
    expect(isComingSaturdaySecondSaturday(wednesday)).toBe(true)
  })
})

describe('isSecondSaturday (pure date detection)', () => {
  it('identifies second Saturday correctly - day 14, Saturday', () => {
    const date = new Date(Date.UTC(2026, 1, 14, 11, 0, 0)) // Feb 14, 2026 is Saturday
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('identifies second Saturday correctly - day 8, Saturday', () => {
    const date = new Date(Date.UTC(2026, 7, 8, 11, 0, 0)) // Aug 8, 2026 is Saturday
    expect(date.getUTCDay()).toBe(6)
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('rejects first Saturday (day < 8)', () => {
    const date = new Date(Date.UTC(2026, 1, 7, 11, 0, 0)) // Feb 7, 2026 is Saturday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects third Saturday (day > 14)', () => {
    const date = new Date(Date.UTC(2026, 1, 21, 11, 0, 0)) // Feb 21, 2026 is Saturday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects non-Saturday dates even if day is in range', () => {
    const date = new Date(Date.UTC(2026, 1, 9, 11, 0, 0)) // Feb 9, 2026 is Monday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects Sunday even if day is in range', () => {
    const date = new Date(Date.UTC(2026, 1, 8, 11, 0, 0)) // Feb 8, 2026 is Sunday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('boundary: day 8 is within range', () => {
    // Need a month where day 8 is a Saturday
    // Aug 8, 2026 is Saturday
    const date = new Date(Date.UTC(2026, 7, 8, 0, 0, 0))
    expect(date.getUTCDay()).toBe(6)
    expect(date.getUTCDate()).toBe(8)
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('boundary: day 14 is within range', () => {
    // Feb 14, 2026 is Saturday
    const date = new Date(Date.UTC(2026, 1, 14, 0, 0, 0))
    expect(date.getUTCDay()).toBe(6)
    expect(date.getUTCDate()).toBe(14)
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('boundary: day 7 is outside range', () => {
    // Feb 7, 2026 is Saturday
    const date = new Date(Date.UTC(2026, 1, 7, 0, 0, 0))
    expect(date.getUTCDay()).toBe(6)
    expect(date.getUTCDate()).toBe(7)
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('boundary: day 15 is outside range', () => {
    // Need a month where day 15 is a Saturday
    // Aug 15, 2026 is Saturday
    const date = new Date(Date.UTC(2026, 7, 15, 0, 0, 0))
    expect(date.getUTCDay()).toBe(6)
    expect(date.getUTCDate()).toBe(15)
    expect(isSecondSaturday(date)).toBe(false)
  })
})

describe('CycleId format generation (YYYY-MM)', () => {
  it('generates "2026-01" for January 2026', () => {
    const date = new Date(Date.UTC(2026, 0, 15))
    expect(generateCycleId(date)).toBe('2026-01')
  })

  it('generates "2026-02" for February 2026', () => {
    const date = new Date(Date.UTC(2026, 1, 10))
    expect(generateCycleId(date)).toBe('2026-02')
  })

  it('generates "2025-12" for December 2025', () => {
    const date = new Date(Date.UTC(2025, 11, 25))
    expect(generateCycleId(date)).toBe('2025-12')
  })

  it('pads single-digit months with leading zero', () => {
    for (let m = 0; m < 9; m++) {
      const date = new Date(Date.UTC(2026, m, 1))
      const cycleId = generateCycleId(date)
      expect(cycleId).toMatch(/^\d{4}-0\d$/)
    }
  })

  it('does not pad double-digit months', () => {
    for (let m = 9; m < 12; m++) {
      const date = new Date(Date.UTC(2026, m, 1))
      const cycleId = generateCycleId(date)
      expect(cycleId).toMatch(/^\d{4}-1\d$/)
    }
  })

  it('all 12 months produce valid YYYY-MM format', () => {
    for (let m = 0; m < 12; m++) {
      const date = new Date(Date.UTC(2026, m, 1))
      const cycleId = generateCycleId(date)
      expect(cycleId).toMatch(/^\d{4}-\d{2}$/)
    }
  })

  it('generates "2026-06" for June 2026', () => {
    const date = new Date(Date.UTC(2026, 5, 14))
    expect(generateCycleId(date)).toBe('2026-06')
  })
})
