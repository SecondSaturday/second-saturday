/**
 * Unit tests for newsletter email business logic.
 *
 * Tests the logic from convex/newsletterEmails.ts (isSecondSaturday,
 * processNewsletters flow, URL construction, recipient filtering)
 * replicated in isolation.
 */
import { describe, it, expect } from 'vitest'

// --- Replicated logic from convex/newsletterEmails.ts ---

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Check if a given date is the second Saturday of its month (UTC). */
function isSecondSaturday(date: Date): boolean {
  if (date.getUTCDay() !== 6) return false // Not a Saturday
  const day = date.getUTCDate()
  // Second Saturday falls between day 8 and day 14
  return day >= 8 && day <= 14
}

/** Calculate cycleId from a date. */
function calculateCycleId(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Build the viewInAppUrl for a newsletter email. */
function buildViewInAppUrl(appUrl: string, circleId: string, newsletterId: string): string {
  return `${appUrl}/dashboard/circles/${circleId}/newsletter/${newsletterId}?utm_source=email&utm_medium=newsletter`
}

/** Build the unsubscribeUrl for a newsletter email. */
function buildUnsubscribeUrl(appUrl: string, circleId: string): string {
  return `${appUrl}/circles/${circleId}/unsubscribe`
}

/** Build the viewCircleUrl for missed month email. */
function buildViewCircleUrl(appUrl: string, circleId: string): string {
  return `${appUrl}/circles/${circleId}`
}

interface Membership {
  userId: string
  leftAt?: number
  blocked?: boolean
  emailUnsubscribed?: boolean
}

interface User {
  _id: string
  email?: string
  name?: string
}

/** Filter recipients: active, not blocked, not unsubscribed, with email */
function filterRecipients(
  memberships: Membership[],
  users: Map<string, User>
): Array<{ email: string; name: string | undefined }> {
  const activeMemberships = memberships.filter(
    (m) => !m.leftAt && !m.blocked && !m.emailUnsubscribed
  )

  const recipients: Array<{ email: string; name: string | undefined }> = []
  for (const membership of activeMemberships) {
    const user = users.get(membership.userId)
    if (user?.email) {
      recipients.push({ email: user.email, name: user.name })
    }
  }

  return recipients
}

/** Calculate next deadline (next month's second Saturday). */
function calculateNextDeadline(cycleId: string): string {
  const [yearStr, monthStr] = cycleId.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10) - 1 // 0-indexed

  // Next month
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const firstDay = new Date(Date.UTC(nextYear, nextMonth, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7

  return `${MONTH_NAMES[nextMonth]} ${secondSaturdayDay}, ${nextYear}`
}

/**
 * Simulate the processNewsletters decision logic:
 * - If not second Saturday, skip
 * - If second Saturday, compile newsletter for each circle
 * - If missedMonth (0 submissions), send missed-month email
 * - Otherwise, send newsletter
 */
interface CompileResult {
  newsletterId: string
  submissionCount: number
  memberCount: number
  missedMonth: boolean
}

function processNewsletterDecision(
  compileResult: CompileResult
): 'send_newsletter' | 'send_missed_month' {
  if (compileResult.missedMonth) {
    return 'send_missed_month'
  }
  return 'send_newsletter'
}

// --- Tests ---

describe('isSecondSaturday: correctly identifies second Saturday', () => {
  it('returns true for Jan 10, 2026 (second Saturday)', () => {
    const date = new Date(Date.UTC(2026, 0, 10)) // Jan 10, 2026 is Saturday
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('returns true for Feb 14, 2026 (second Saturday)', () => {
    const date = new Date(Date.UTC(2026, 1, 14))
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('returns true for Mar 14, 2026 (second Saturday)', () => {
    const date = new Date(Date.UTC(2026, 2, 14))
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('returns true for Oct 11, 2025 (second Saturday)', () => {
    const date = new Date(Date.UTC(2025, 9, 11))
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('returns true for dates between day 8-14 that are Saturday', () => {
    // Check all 12 months of 2026
    for (let month = 0; month < 12; month++) {
      // Find the second Saturday
      const firstDay = new Date(Date.UTC(2026, month, 1))
      const dayOfWeek = firstDay.getUTCDay()
      const daysToFirstSat = (6 - dayOfWeek + 7) % 7
      const secondSatDay = 1 + daysToFirstSat + 7
      const secondSat = new Date(Date.UTC(2026, month, secondSatDay))

      expect(isSecondSaturday(secondSat)).toBe(true)
    }
  })
})

describe('isSecondSaturday: rejects non-second-Saturdays', () => {
  it('rejects a weekday', () => {
    // Jan 12, 2026 is Monday
    const date = new Date(Date.UTC(2026, 0, 12))
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects the first Saturday (day 1-7)', () => {
    // Jan 3, 2026 is Saturday (first Saturday)
    const date = new Date(Date.UTC(2026, 0, 3))
    expect(date.getUTCDay()).toBe(6) // confirm it's Saturday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects the third Saturday (day 15-21)', () => {
    // Jan 17, 2026 is Saturday (third Saturday)
    const date = new Date(Date.UTC(2026, 0, 17))
    expect(date.getUTCDay()).toBe(6)
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects the fourth Saturday (day 22-28)', () => {
    // Jan 24, 2026 is Saturday (fourth Saturday)
    const date = new Date(Date.UTC(2026, 0, 24))
    expect(date.getUTCDay()).toBe(6)
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects Sunday even if day is 8-14', () => {
    // Jan 11, 2026 is Sunday
    const date = new Date(Date.UTC(2026, 0, 11))
    expect(date.getUTCDay()).toBe(0) // Sunday
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects Friday even if day is 8-14', () => {
    // Jan 9, 2026 is Friday
    const date = new Date(Date.UTC(2026, 0, 9))
    expect(date.getUTCDay()).toBe(5) // Friday
    expect(isSecondSaturday(date)).toBe(false)
  })
})

describe('processNewsletters flow: with submissions -> compile + send', () => {
  it('decides to send newsletter when submissions exist', () => {
    const result: CompileResult = {
      newsletterId: 'nl_123',
      submissionCount: 5,
      memberCount: 10,
      missedMonth: false,
    }
    expect(processNewsletterDecision(result)).toBe('send_newsletter')
  })

  it('decides to send newsletter even with 1 submission', () => {
    const result: CompileResult = {
      newsletterId: 'nl_456',
      submissionCount: 1,
      memberCount: 10,
      missedMonth: false,
    }
    expect(processNewsletterDecision(result)).toBe('send_newsletter')
  })
})

describe('processNewsletters flow: with 0 submissions -> missed month email', () => {
  it('decides to send missed month email when no submissions', () => {
    const result: CompileResult = {
      newsletterId: 'nl_789',
      submissionCount: 0,
      memberCount: 10,
      missedMonth: true,
    }
    expect(processNewsletterDecision(result)).toBe('send_missed_month')
  })
})

describe('processNewsletters: second Saturday guard', () => {
  it('skips processing on non-second-Saturday', () => {
    const date = new Date(Date.UTC(2026, 0, 3)) // first Saturday
    const shouldProcess = isSecondSaturday(date)
    expect(shouldProcess).toBe(false)
  })

  it('proceeds on second Saturday', () => {
    const date = new Date(Date.UTC(2026, 0, 10)) // second Saturday
    const shouldProcess = isSecondSaturday(date)
    expect(shouldProcess).toBe(true)
  })
})

describe('cycleId calculation', () => {
  it('calculates cycleId from a date', () => {
    const date = new Date(Date.UTC(2026, 0, 10))
    expect(calculateCycleId(date)).toBe('2026-01')
  })

  it('pads single-digit months with leading zero', () => {
    const date = new Date(Date.UTC(2026, 1, 14))
    expect(calculateCycleId(date)).toBe('2026-02')
  })

  it('handles December correctly', () => {
    const date = new Date(Date.UTC(2025, 11, 13))
    expect(calculateCycleId(date)).toBe('2025-12')
  })
})

describe('Email URL construction', () => {
  const APP_URL = 'https://secondsaturday.app'

  it('builds viewInAppUrl with correct parameters', () => {
    const url = buildViewInAppUrl(APP_URL, 'circle_123', 'nl_456')
    expect(url).toBe(
      'https://secondsaturday.app/dashboard/circles/circle_123/newsletter/nl_456?utm_source=email&utm_medium=newsletter'
    )
  })

  it('builds unsubscribeUrl correctly', () => {
    const url = buildUnsubscribeUrl(APP_URL, 'circle_123')
    expect(url).toBe('https://secondsaturday.app/circles/circle_123/unsubscribe')
  })

  it('builds viewCircleUrl for missed month email', () => {
    const url = buildViewCircleUrl(APP_URL, 'circle_123')
    expect(url).toBe('https://secondsaturday.app/circles/circle_123')
  })

  it('viewInAppUrl includes UTM tracking parameters', () => {
    const url = buildViewInAppUrl(APP_URL, 'c1', 'n1')
    expect(url).toContain('utm_source=email')
    expect(url).toContain('utm_medium=newsletter')
  })
})

describe('Recipient filtering: only active, subscribed members', () => {
  const users = new Map<string, User>([
    ['u1', { _id: 'u1', email: 'alice@test.com', name: 'Alice' }],
    ['u2', { _id: 'u2', email: 'bob@test.com', name: 'Bob' }],
    ['u3', { _id: 'u3', email: 'carol@test.com', name: 'Carol' }],
    ['u4', { _id: 'u4', email: 'dave@test.com', name: 'Dave' }],
    ['u5', { _id: 'u5', name: 'NoEmail' }], // no email
  ])

  it('includes active, non-blocked, subscribed members', () => {
    const memberships: Membership[] = [{ userId: 'u1' }, { userId: 'u2' }]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(2)
    expect(recipients.map((r) => r.email)).toEqual(['alice@test.com', 'bob@test.com'])
  })

  it('excludes members who left', () => {
    const memberships: Membership[] = [{ userId: 'u1' }, { userId: 'u2', leftAt: 1000 }]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(1)
    expect(recipients[0]!.email).toBe('alice@test.com')
  })

  it('excludes blocked members', () => {
    const memberships: Membership[] = [{ userId: 'u1' }, { userId: 'u2', blocked: true }]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(1)
    expect(recipients[0]!.email).toBe('alice@test.com')
  })

  it('excludes email-unsubscribed members', () => {
    const memberships: Membership[] = [{ userId: 'u1' }, { userId: 'u3', emailUnsubscribed: true }]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(1)
    expect(recipients[0]!.email).toBe('alice@test.com')
  })

  it('excludes members without an email address', () => {
    const memberships: Membership[] = [
      { userId: 'u1' },
      { userId: 'u5' }, // no email
    ]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(1)
    expect(recipients[0]!.email).toBe('alice@test.com')
  })

  it('includes name in recipient data', () => {
    const memberships: Membership[] = [{ userId: 'u1' }]
    const recipients = filterRecipients(memberships, users)
    expect(recipients[0]!.name).toBe('Alice')
  })

  it('returns empty array when all members are filtered out', () => {
    const memberships: Membership[] = [
      { userId: 'u1', leftAt: 1000 },
      { userId: 'u2', blocked: true },
      { userId: 'u3', emailUnsubscribed: true },
    ]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(0)
  })

  it('handles multiple exclusion criteria on same member', () => {
    const memberships: Membership[] = [
      { userId: 'u1', leftAt: 1000, blocked: true, emailUnsubscribed: true },
    ]
    const recipients = filterRecipients(memberships, users)
    expect(recipients).toHaveLength(0)
  })
})

describe('Next deadline calculation for missed month email', () => {
  it('calculates next deadline from January cycle', () => {
    // Cycle 2026-01 -> next is February 2026
    // Feb 2026: 1st is Sunday (day 0), first Sat = 7th, second Sat = 14th
    const deadline = calculateNextDeadline('2026-01')
    expect(deadline).toBe('February 14, 2026')
  })

  it('calculates next deadline from November cycle (rolls to December)', () => {
    // Cycle 2026-11 -> next is December 2026
    // Dec 2026: 1st is Tuesday (day 2), first Sat = 5th, second Sat = 12th
    const deadline = calculateNextDeadline('2026-11')
    expect(deadline).toBe('December 12, 2026')
  })

  it('handles December -> January year rollover', () => {
    // Cycle 2025-12 -> next is January 2026
    // Jan 2026: 1st is Thursday (day 4), first Sat = 3rd, second Sat = 10th
    const deadline = calculateNextDeadline('2025-12')
    expect(deadline).toBe('January 10, 2026')
  })

  it('result always contains a month name and year', () => {
    const deadline = calculateNextDeadline('2026-06')
    expect(deadline).toMatch(/^[A-Z][a-z]+ \d+, \d{4}$/)
  })
})
