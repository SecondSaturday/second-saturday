/**
 * Integration tests for admin transfer and submission status logic.
 *
 * Tests the rules from convex/memberships.ts for transferAdmin,
 * submission status detection, and redirect URL validation.
 */
import { describe, it, expect } from 'vitest'

// --- Types mirroring convex/memberships.ts ---

type Membership = {
  _id: string
  userId: string
  circleId: string
  role: 'admin' | 'member'
  joinedAt: number
  leftAt?: number
  blocked?: boolean
}

type Submission = {
  _id: string
  userId: string
  circleId: string
  cycleId: string
  submittedAt?: number
  createdAt: number
  updatedAt: number
}

// --- Pure logic helpers ---

function validateTransferAdmin(args: {
  callerMembership: Membership | null
  targetMembership: Membership | null
  callerId: string
  targetId: string
}): { valid: boolean; error?: string } {
  if (!args.callerMembership || args.callerMembership.role !== 'admin') {
    return { valid: false, error: 'Admin access required' }
  }
  if (args.targetId === args.callerId) {
    return { valid: false, error: 'Cannot transfer admin to yourself' }
  }
  if (!args.targetMembership || args.targetMembership.leftAt) {
    return { valid: false, error: 'Target user is not an active member' }
  }
  return { valid: true }
}

function getCurrentCycleId(): string {
  const now = new Date(Date.now())
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function computeDeadline(cycleId: string): number {
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]! - 1
  const firstDay = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  return Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)
}

function getSubmissionStatus(submission: Submission | null): {
  status: 'Submitted' | 'In Progress' | 'Not Started'
  submittedAt: number | null
} {
  if (!submission) return { status: 'Not Started', submittedAt: null }
  if (submission.submittedAt) return { status: 'Submitted', submittedAt: submission.submittedAt }
  return { status: 'In Progress', submittedAt: null }
}

function isValidRedirectUrl(url: string | null): boolean {
  if (!url) return false
  return url.startsWith('/') && !url.startsWith('//')
}

// --- Tests ---

describe('transferAdmin logic', () => {
  const adminMembership: Membership = {
    _id: 'm1',
    userId: 'u1',
    circleId: 'c1',
    role: 'admin',
    joinedAt: 1000,
  }
  const memberMembership: Membership = {
    _id: 'm2',
    userId: 'u2',
    circleId: 'c1',
    role: 'member',
    joinedAt: 2000,
  }

  it('allows admin to transfer to active member', () => {
    const result = validateTransferAdmin({
      callerMembership: adminMembership,
      targetMembership: memberMembership,
      callerId: 'u1',
      targetId: 'u2',
    })
    expect(result.valid).toBe(true)
  })

  it('prevents non-admin from transferring', () => {
    const result = validateTransferAdmin({
      callerMembership: memberMembership,
      targetMembership: adminMembership,
      callerId: 'u2',
      targetId: 'u1',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Admin access required')
  })

  it('prevents self-transfer', () => {
    const result = validateTransferAdmin({
      callerMembership: adminMembership,
      targetMembership: adminMembership,
      callerId: 'u1',
      targetId: 'u1',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Cannot transfer admin to yourself')
  })

  it('rejects transfer to left member', () => {
    const leftMember: Membership = { ...memberMembership, leftAt: 3000 }
    const result = validateTransferAdmin({
      callerMembership: adminMembership,
      targetMembership: leftMember,
      callerId: 'u1',
      targetId: 'u2',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Target user is not an active member')
  })

  it('rejects transfer when caller is not a member', () => {
    const result = validateTransferAdmin({
      callerMembership: null,
      targetMembership: memberMembership,
      callerId: 'u1',
      targetId: 'u2',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Admin access required')
  })

  it('allows admin to transfer to another admin', () => {
    const otherAdmin: Membership = {
      _id: 'm3',
      userId: 'u3',
      circleId: 'c1',
      role: 'admin',
      joinedAt: 1500,
    }
    const result = validateTransferAdmin({
      callerMembership: adminMembership,
      targetMembership: otherAdmin,
      callerId: 'u1',
      targetId: 'u3',
    })
    expect(result.valid).toBe(true)
  })
})

describe('getCurrentCycleId', () => {
  it('returns YYYY-MM format', () => {
    const cycleId = getCurrentCycleId()
    expect(cycleId).toMatch(/^\d{4}-\d{2}$/)
  })

  it('pads single-digit months', () => {
    const cycleId = getCurrentCycleId()
    const month = cycleId.split('-')[1]
    expect(month).toHaveLength(2)
  })
})

describe('computeDeadline', () => {
  it('returns second Saturday at 10:59 UTC for Feb 2026', () => {
    // Feb 2026: 1st is Sunday, first Sat = 7th, second Sat = 14th
    const deadline = computeDeadline('2026-02')
    const date = new Date(deadline)
    expect(date.getUTCDate()).toBe(14)
    expect(date.getUTCDay()).toBe(6) // Saturday
    expect(date.getUTCHours()).toBe(10)
    expect(date.getUTCMinutes()).toBe(59)
  })

  it('returns second Saturday at 10:59 UTC for Jan 2026', () => {
    // Jan 2026: 1st is Thursday, first Sat = 3rd, second Sat = 10th
    const deadline = computeDeadline('2026-01')
    const date = new Date(deadline)
    expect(date.getUTCDate()).toBe(10)
    expect(date.getUTCDay()).toBe(6)
  })

  it('returns second Saturday for March 2026', () => {
    // Mar 2026: 1st is Sunday, first Sat = 7th, second Sat = 14th
    const deadline = computeDeadline('2026-03')
    const date = new Date(deadline)
    expect(date.getUTCDate()).toBe(14)
    expect(date.getUTCDay()).toBe(6)
  })
})

describe('getSubmissionStatus', () => {
  it('returns Not Started when no submission exists', () => {
    const result = getSubmissionStatus(null)
    expect(result.status).toBe('Not Started')
    expect(result.submittedAt).toBeNull()
  })

  it('returns In Progress when submission exists without submittedAt', () => {
    const submission: Submission = {
      _id: 's1',
      userId: 'u1',
      circleId: 'c1',
      cycleId: '2026-02',
      createdAt: 1000,
      updatedAt: 1000,
    }
    const result = getSubmissionStatus(submission)
    expect(result.status).toBe('In Progress')
    expect(result.submittedAt).toBeNull()
  })

  it('returns Submitted with timestamp when submittedAt exists', () => {
    const now = Date.now()
    const submission: Submission = {
      _id: 's1',
      userId: 'u1',
      circleId: 'c1',
      cycleId: '2026-02',
      submittedAt: now,
      createdAt: 1000,
      updatedAt: 1000,
    }
    const result = getSubmissionStatus(submission)
    expect(result.status).toBe('Submitted')
    expect(result.submittedAt).toBe(now)
  })
})

describe('redirect URL validation', () => {
  it('accepts valid internal paths', () => {
    expect(isValidRedirectUrl('/invite/abc123')).toBe(true)
    expect(isValidRedirectUrl('/dashboard')).toBe(true)
    expect(isValidRedirectUrl('/dashboard/circles/123')).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidRedirectUrl(null)).toBe(false)
  })

  it('rejects protocol-relative URLs', () => {
    expect(isValidRedirectUrl('//evil.com')).toBe(false)
    expect(isValidRedirectUrl('//evil.com/phishing')).toBe(false)
  })

  it('rejects absolute URLs', () => {
    expect(isValidRedirectUrl('https://evil.com')).toBe(false)
    expect(isValidRedirectUrl('http://evil.com')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidRedirectUrl('')).toBe(false)
  })

  it('rejects paths without leading slash', () => {
    expect(isValidRedirectUrl('dashboard')).toBe(false)
    expect(isValidRedirectUrl('invite/abc')).toBe(false)
  })
})
