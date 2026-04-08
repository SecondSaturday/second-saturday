/**
 * Integration tests for newsletter read tracking logic.
 *
 * Tests the rules from convex/newsletterReads.ts in isolation.
 */
import { describe, it, expect } from 'vitest'

// Replicate logic from convex/newsletterReads.ts

function isNewsletterInDateRange(
  publishedAt: number | undefined,
  startOfMonth: number,
  endOfMonth: number
): boolean {
  if (!publishedAt) return false
  return publishedAt >= startOfMonth && publishedAt <= endOfMonth
}

function getMonthRange(year: number, month: number) {
  const startOfMonth = new Date(year, month, 1).getTime()
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()
  return { startOfMonth, endOfMonth }
}

describe('markNewsletterRead logic', () => {
  it('is idempotent - second read returns existing record', () => {
    // Simulate: first call creates record, second finds existing
    const existingReads: Array<{ userId: string; newsletterId: string }> = []

    // First read
    const firstCheck = existingReads.find((r) => r.userId === 'u1' && r.newsletterId === 'n1')
    expect(firstCheck).toBeUndefined()
    existingReads.push({ userId: 'u1', newsletterId: 'n1' })

    // Second read - same user, same newsletter
    const secondCheck = existingReads.find((r) => r.userId === 'u1' && r.newsletterId === 'n1')
    expect(secondCheck).toBeDefined()
  })
})

describe('getNewslettersByDate logic', () => {
  it('filters newsletters by month correctly', () => {
    const { startOfMonth, endOfMonth } = getMonthRange(2026, 1) // February 2026

    const newsletters = [
      { title: 'Jan', publishedAt: new Date(2026, 0, 15).getTime() },
      { title: 'Feb', publishedAt: new Date(2026, 1, 14).getTime() },
      { title: 'Mar', publishedAt: new Date(2026, 2, 14).getTime() },
      { title: 'No date', publishedAt: undefined },
    ]

    const filtered = newsletters.filter((n) =>
      isNewsletterInDateRange(n.publishedAt, startOfMonth, endOfMonth)
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0]!.title).toBe('Feb')
  })

  it('includes newsletters at month boundaries', () => {
    const { startOfMonth, endOfMonth } = getMonthRange(2026, 0) // January 2026

    // First moment of January
    expect(isNewsletterInDateRange(startOfMonth, startOfMonth, endOfMonth)).toBe(true)
    // Last moment of January
    expect(isNewsletterInDateRange(endOfMonth, startOfMonth, endOfMonth)).toBe(true)
  })

  it('excludes newsletters without publishedAt', () => {
    const { startOfMonth, endOfMonth } = getMonthRange(2026, 0)
    expect(isNewsletterInDateRange(undefined, startOfMonth, endOfMonth)).toBe(false)
  })

  it('adds read status to filtered newsletters', () => {
    const newsletters = [
      { _id: 'n1', title: 'Feb Issue', publishedAt: new Date(2026, 1, 14).getTime() },
    ]
    const reads = [{ userId: 'u1', newsletterId: 'n1', readAt: Date.now() }]

    const withReadStatus = newsletters.map((n) => ({
      ...n,
      isRead: !!reads.find((r) => r.newsletterId === n._id),
    }))

    expect(withReadStatus[0]!.isRead).toBe(true)
  })

  it('marks unread when no read record', () => {
    const newsletters = [
      { _id: 'n1', title: 'Feb Issue', publishedAt: new Date(2026, 1, 14).getTime() },
    ]
    const reads: Array<{ userId: string; newsletterId: string }> = []

    const withReadStatus = newsletters.map((n) => ({
      ...n,
      isRead: !!reads.find((r) => r.newsletterId === n._id),
    }))

    expect(withReadStatus[0]!.isRead).toBe(false)
  })
})

describe('getMonthRange', () => {
  it('returns correct range for January', () => {
    const { startOfMonth, endOfMonth } = getMonthRange(2026, 0)
    const start = new Date(startOfMonth)
    const end = new Date(endOfMonth)
    expect(start.getMonth()).toBe(0)
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(0)
    expect(end.getDate()).toBe(31)
  })

  it('returns correct range for February (non-leap)', () => {
    const { endOfMonth } = getMonthRange(2026, 1)
    const end = new Date(endOfMonth)
    expect(end.getDate()).toBe(28) // 2026 is not a leap year
  })

  it('returns correct range for December', () => {
    const { startOfMonth, endOfMonth } = getMonthRange(2025, 11)
    const start = new Date(startOfMonth)
    const end = new Date(endOfMonth)
    expect(start.getMonth()).toBe(11)
    expect(end.getMonth()).toBe(11)
    expect(end.getDate()).toBe(31)
  })
})
