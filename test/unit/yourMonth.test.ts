/**
 * Unit tests for the yourMonth server query's gating + filtering logic.
 *
 * Replicates the core rules from convex/yourMonth.ts in isolation, in the
 * same shape as test/unit/memberProfiles.test.ts. The risks this locks down:
 *   1. AC #7 — never leak content authored by other users.
 *   2. AC #8 — strictly exclude circles the caller has left or been blocked from,
 *      on both queries.
 *   3. Cycle-id validation throws on malformed input.
 *   4. listYourMonthsAvailable sort + 36-cap.
 */
import { describe, it, expect } from 'vitest'

interface Membership {
  userId: string
  circleId: string
  leftAt?: number
  blocked?: boolean
}

interface Submission {
  _id: string
  userId: string
  circleId: string
  cycleId: string
  submittedAt?: number
  lockedAt?: number
}

interface Response {
  _id: string
  submissionId: string
  promptId: string
  text: string
}

interface Newsletter {
  _id: string
  circleId: string
  cycleId: string
  status: 'draft' | 'published' | 'skipped'
}

// ---------------------------------------------------------------------------
// Mirrored helpers from convex/yourMonth.ts
// ---------------------------------------------------------------------------

function validateCycleId(cycleId: string): void {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    throw new Error('Cycle ID must be in YYYY-MM format')
  }
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]!
  if (year < 2024 || year > 2099) throw new Error('Invalid year in cycle ID')
  if (month < 1 || month > 12) throw new Error('Invalid month in cycle ID')
}

/** Filter memberships to those that should appear in Your Month for the caller. */
function activeMembershipsForCaller(memberships: Membership[], callerId: string): Membership[] {
  return memberships.filter((m) => m.userId === callerId && !m.leftAt && !m.blocked)
}

/** Per-circle assembler. Returns null if circle is missing in store. */
function buildCircleEntry(
  callerId: string,
  circleId: string,
  cycleId: string,
  submissions: Submission[],
  responses: Response[],
  newsletters: Newsletter[]
): {
  circleId: string
  hasSubmission: boolean
  responseIds: string[]
  newsletterStatus: Newsletter['status'] | null
} {
  // CRITICAL — only the caller's submission for this circle+cycle is loaded.
  const submission = submissions.find(
    (s) => s.userId === callerId && s.circleId === circleId && s.cycleId === cycleId
  )
  const newsletter = newsletters.find((n) => n.circleId === circleId && n.cycleId === cycleId)

  let responseIds: string[] = []
  if (submission) {
    const subResponses = responses.filter((r) => r.submissionId === submission._id)
    // Drop empties (no text and no media — assume no media for tests).
    responseIds = subResponses.filter((r) => r.text.trim().length > 0).map((r) => r._id)
  }

  return {
    circleId,
    hasSubmission: !!submission,
    responseIds,
    newsletterStatus: newsletter?.status ?? null,
  }
}

/** Mirrors the listYourMonthsAvailable cycle-set computation + sort + cap. */
function computeAvailableMonths(
  callerId: string,
  memberships: Membership[],
  submissions: Submission[],
  newsletters: Newsletter[]
): Array<{ cycleId: string; hasPublishedNewsletter: boolean }> {
  const active = activeMembershipsForCaller(memberships, callerId)
  const activeCircles = new Set(active.map((m) => m.circleId))

  const cycleMap = new Map<string, boolean>()
  for (const s of submissions) {
    if (s.userId !== callerId) continue
    if (!activeCircles.has(s.circleId)) continue
    if (!cycleMap.has(s.cycleId)) cycleMap.set(s.cycleId, false)
  }
  for (const n of newsletters) {
    if (!activeCircles.has(n.circleId)) continue
    if (n.status !== 'published') continue
    if (cycleMap.has(n.cycleId)) cycleMap.set(n.cycleId, true)
  }

  const out = Array.from(cycleMap.entries()).map(([cycleId, hasPublishedNewsletter]) => ({
    cycleId,
    hasPublishedNewsletter,
  }))
  out.sort((a, b) => (a.cycleId < b.cycleId ? 1 : a.cycleId > b.cycleId ? -1 : 0))
  return out.slice(0, 36)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('yourMonth — cycleId validation', () => {
  it('accepts valid YYYY-MM', () => {
    expect(() => validateCycleId('2026-04')).not.toThrow()
  })

  it('rejects malformed format', () => {
    expect(() => validateCycleId('2026-4')).toThrow(/YYYY-MM/)
    expect(() => validateCycleId('apr-2026')).toThrow(/YYYY-MM/)
    expect(() => validateCycleId('')).toThrow(/YYYY-MM/)
  })

  it('rejects out-of-range month', () => {
    expect(() => validateCycleId('2026-13')).toThrow(/month/i)
    expect(() => validateCycleId('2026-00')).toThrow(/month/i)
  })

  it('rejects out-of-range year', () => {
    expect(() => validateCycleId('1999-04')).toThrow(/year/i)
    expect(() => validateCycleId('2100-04')).toThrow(/year/i)
  })
})

describe('yourMonth — getYourMonth circle gating (AC #8)', () => {
  const cycleId = '2026-04'

  it('includes only active, non-blocked memberships for the caller', () => {
    const memberships: Membership[] = [
      { userId: 'me', circleId: 'c1' },
      { userId: 'me', circleId: 'c2', leftAt: 100 },
      { userId: 'me', circleId: 'c3', blocked: true },
      { userId: 'other', circleId: 'c4' },
    ]
    const result = activeMembershipsForCaller(memberships, 'me')
    expect(result.map((m) => m.circleId).sort()).toEqual(['c1'])
  })

  it('excludes circles where the caller has been blocked, even with submissions', () => {
    const memberships: Membership[] = [{ userId: 'me', circleId: 'c1', blocked: true }]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId, submittedAt: 1 },
    ]
    const active = activeMembershipsForCaller(memberships, 'me')
    expect(active).toHaveLength(0)
    // Therefore no circle entries would be assembled.
    expect(active.map((m) => m.circleId)).not.toContain('c1')
    // Sanity: the submission still exists in the source data; gating is the
    // membership check, not deletion of historical content.
    expect(submissions[0]!.userId).toBe('me')
  })

  it('excludes circles where the caller has left, even with a historical submission this cycle', () => {
    const memberships: Membership[] = [{ userId: 'me', circleId: 'c1', leftAt: 999 }]
    const active = activeMembershipsForCaller(memberships, 'me')
    expect(active).toHaveLength(0)
  })

  it('user with no memberships → empty circles list', () => {
    expect(activeMembershipsForCaller([], 'me')).toEqual([])
  })
})

describe('yourMonth — buildCircleEntry response filtering (AC #7)', () => {
  const cycleId = '2026-04'

  it("returns ONLY caller's responses; never another user's", () => {
    const submissions: Submission[] = [
      { _id: 's-me', userId: 'me', circleId: 'c1', cycleId, submittedAt: 1 },
      { _id: 's-other', userId: 'other', circleId: 'c1', cycleId, submittedAt: 1 },
    ]
    const responses: Response[] = [
      { _id: 'r-mine', submissionId: 's-me', promptId: 'p1', text: 'mine' },
      { _id: 'r-theirs', submissionId: 's-other', promptId: 'p1', text: 'theirs' },
    ]
    const result = buildCircleEntry('me', 'c1', cycleId, submissions, responses, [])
    expect(result.responseIds).toEqual(['r-mine'])
    expect(result.responseIds).not.toContain('r-theirs')
  })

  it('returns submission: null when caller has no submission for this circle+cycle', () => {
    const result = buildCircleEntry('me', 'c1', cycleId, [], [], [])
    expect(result.hasSubmission).toBe(false)
    expect(result.responseIds).toEqual([])
  })

  it('drops responses with empty text (no media in this test stub)', () => {
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId, submittedAt: 1 },
    ]
    const responses: Response[] = [
      { _id: 'r1', submissionId: 's1', promptId: 'p1', text: '' },
      { _id: 'r2', submissionId: 's1', promptId: 'p2', text: 'hi' },
      { _id: 'r3', submissionId: 's1', promptId: 'p3', text: '   ' },
    ]
    const result = buildCircleEntry('me', 'c1', cycleId, submissions, responses, [])
    expect(result.responseIds).toEqual(['r2'])
  })

  it('still returns the circle row even when the caller has zero non-empty responses', () => {
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId, submittedAt: 1 },
    ]
    const responses: Response[] = [{ _id: 'r1', submissionId: 's1', promptId: 'p1', text: '' }]
    const result = buildCircleEntry('me', 'c1', cycleId, submissions, responses, [])
    expect(result.hasSubmission).toBe(true)
    expect(result.responseIds).toEqual([])
  })
})

describe('yourMonth — multi-circle scenarios', () => {
  const cycleId = '2026-04'

  it('user in 2 active circles, with submissions in both → 2 entries with responses', () => {
    const memberships: Membership[] = [
      { userId: 'me', circleId: 'c1' },
      { userId: 'me', circleId: 'c2' },
    ]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId, submittedAt: 1 },
      { _id: 's2', userId: 'me', circleId: 'c2', cycleId, submittedAt: 1 },
    ]
    const responses: Response[] = [
      { _id: 'r1', submissionId: 's1', promptId: 'p1', text: 'a' },
      { _id: 'r2', submissionId: 's2', promptId: 'p1', text: 'b' },
    ]
    const active = activeMembershipsForCaller(memberships, 'me')
    const entries = active.map((m) =>
      buildCircleEntry('me', m.circleId, cycleId, submissions, responses, [])
    )
    expect(entries).toHaveLength(2)
    expect(entries.every((e) => e.hasSubmission)).toBe(true)
    expect(entries.flatMap((e) => e.responseIds)).toEqual(['r1', 'r2'])
  })

  it('user in 3 circles, submitted in only 1 → 3 entries, 2 empty', () => {
    const memberships: Membership[] = [
      { userId: 'me', circleId: 'c1' },
      { userId: 'me', circleId: 'c2' },
      { userId: 'me', circleId: 'c3' },
    ]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c2', cycleId, submittedAt: 1 },
    ]
    const responses: Response[] = [
      { _id: 'r1', submissionId: 's1', promptId: 'p1', text: 'only one' },
    ]
    const active = activeMembershipsForCaller(memberships, 'me')
    const entries = active.map((m) =>
      buildCircleEntry('me', m.circleId, cycleId, submissions, responses, [])
    )
    expect(entries).toHaveLength(3)
    expect(entries.filter((e) => e.hasSubmission)).toHaveLength(1)
    expect(entries.filter((e) => !e.hasSubmission)).toHaveLength(2)
  })
})

describe('yourMonth — joinedAt cycle gating', () => {
  // Mirrors the per-membership filter in getYourMonth: hide cards when the
  // caller joined the circle AFTER the cycle's deadline.
  function joinedInTime(joinedAt: number, cycleDeadline: number): boolean {
    return joinedAt <= cycleDeadline
  }

  it('hides circle for cycles whose deadline predates joinedAt', () => {
    expect(joinedInTime(2_000_000, 1_000_000)).toBe(false)
  })

  it('shows circle when caller joined exactly on the deadline', () => {
    expect(joinedInTime(1_000_000, 1_000_000)).toBe(true)
  })

  it('shows circle for future cycles after joining', () => {
    expect(joinedInTime(1_000_000, 5_000_000)).toBe(true)
  })
})

describe('yourMonth — chip logic for locked-with-content', () => {
  // Mirrors the past-deadline branch in YourMonthView.deriveStatusChip:
  // newsletter compile includes locked-but-not-submitted submissions when
  // they have non-empty content, so the chip should say "Submitted".
  function chipForPastDeadlineDraft(responseCount: number): string {
    if (responseCount > 0) return 'Submitted'
    return 'Missed'
  }

  it('shows Submitted when caller has non-empty responses but never hit submit', () => {
    expect(chipForPastDeadlineDraft(2)).toBe('Submitted')
  })

  it('shows Missed when caller had a draft but no non-empty responses', () => {
    expect(chipForPastDeadlineDraft(0)).toBe('Missed')
  })
})

describe('yourMonth — listYourMonthsAvailable', () => {
  it('returns submitted cycles, newest first, with hasPublishedNewsletter flag', () => {
    const memberships: Membership[] = [{ userId: 'me', circleId: 'c1' }]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId: '2026-01', submittedAt: 1 },
      { _id: 's2', userId: 'me', circleId: 'c1', cycleId: '2026-04', submittedAt: 1 },
    ]
    const newsletters: Newsletter[] = [
      { _id: 'n1', circleId: 'c1', cycleId: '2026-01', status: 'published' },
    ]
    const result = computeAvailableMonths('me', memberships, submissions, newsletters)
    expect(result.map((r) => r.cycleId)).toEqual(['2026-04', '2026-01'])
    expect(result.find((r) => r.cycleId === '2026-01')!.hasPublishedNewsletter).toBe(true)
    expect(result.find((r) => r.cycleId === '2026-04')!.hasPublishedNewsletter).toBe(false)
  })

  it('caps result at 36 cycles', () => {
    const memberships: Membership[] = [{ userId: 'me', circleId: 'c1' }]
    const submissions: Submission[] = []
    for (let i = 1; i <= 40; i++) {
      const month = String(((i - 1) % 12) + 1).padStart(2, '0')
      const year = 2026 + Math.floor((i - 1) / 12)
      submissions.push({
        _id: `s${i}`,
        userId: 'me',
        circleId: 'c1',
        cycleId: `${year}-${month}`,
        submittedAt: 1,
      })
    }
    const result = computeAvailableMonths('me', memberships, submissions, [])
    expect(result).toHaveLength(36)
  })

  it('excludes cycles from circles the caller has left (strict mode)', () => {
    const memberships: Membership[] = [
      { userId: 'me', circleId: 'c1' },
      { userId: 'me', circleId: 'c2', leftAt: 999 },
    ]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'me', circleId: 'c1', cycleId: '2026-04', submittedAt: 1 },
      { _id: 's2', userId: 'me', circleId: 'c2', cycleId: '2026-03', submittedAt: 1 },
    ]
    const result = computeAvailableMonths('me', memberships, submissions, [])
    expect(result.map((r) => r.cycleId)).toEqual(['2026-04'])
  })
})
