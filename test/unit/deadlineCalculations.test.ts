import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSecondSaturdayDeadline, getTimeRemaining } from '@/lib/dates'

describe('getSecondSaturdayDeadline', () => {
  it('returns Feb 14 2026 at 10:59 UTC (Feb 1 = Sunday)', () => {
    const result = getSecondSaturdayDeadline(new Date('2026-02-15T00:00:00Z'))
    expect(result.getUTCFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(1) // February (0-indexed)
    expect(result.getUTCDate()).toBe(14)
    expect(result.getUTCHours()).toBe(10)
    expect(result.getUTCMinutes()).toBe(59)
    expect(result.getUTCSeconds()).toBe(0)
  })

  it('returns Jan 10 2026 at 10:59 UTC (Jan 1 = Thursday)', () => {
    const result = getSecondSaturdayDeadline(new Date('2026-01-01T00:00:00Z'))
    expect(result.getUTCFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(0) // January
    expect(result.getUTCDate()).toBe(10)
    expect(result.getUTCHours()).toBe(10)
    expect(result.getUTCMinutes()).toBe(59)
  })

  it('returns Mar 8 2025 at 10:59 UTC (Mar 1 = Saturday — first Sat is Mar 1)', () => {
    const result = getSecondSaturdayDeadline(new Date('2025-03-01T00:00:00Z'))
    expect(result.getUTCFullYear()).toBe(2025)
    expect(result.getUTCMonth()).toBe(2) // March
    expect(result.getUTCDate()).toBe(8)
    expect(result.getUTCHours()).toBe(10)
    expect(result.getUTCMinutes()).toBe(59)
  })

  it('returns Mar 14 2026 at 10:59 UTC (Mar 1 = Sunday)', () => {
    const result = getSecondSaturdayDeadline(new Date('2026-03-01T00:00:00Z'))
    expect(result.getUTCMonth()).toBe(2)
    expect(result.getUTCDate()).toBe(14)
  })

  it('result day is always a Saturday', () => {
    const months = [
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-02-01T00:00:00Z'),
      new Date('2026-04-01T00:00:00Z'),
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-12-01T00:00:00Z'),
    ]
    for (const d of months) {
      const result = getSecondSaturdayDeadline(d)
      expect(result.getUTCDay()).toBe(6) // Saturday
    }
  })
})

describe('getTimeRemaining', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns all zeros with isPast=true when deadline has passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-14T11:00:00Z'))

    const deadline = new Date('2026-02-14T10:59:00Z')
    const result = getTimeRemaining(deadline)

    expect(result.isPast).toBe(true)
    expect(result.days).toBe(0)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
  })

  it('returns correct breakdown for a future deadline', () => {
    vi.useFakeTimers()
    // Now = Feb 12 00:00:00 UTC, deadline = Feb 14 10:59:00 UTC
    // Diff = 2d 10h 59m 0s = 2*86400 + 10*3600 + 59*60 = 259140s
    vi.setSystemTime(new Date('2026-02-12T00:00:00Z'))

    const deadline = new Date('2026-02-14T10:59:00Z')
    const result = getTimeRemaining(deadline)

    expect(result.isPast).toBe(false)
    expect(result.days).toBe(2)
    expect(result.hours).toBe(10)
    expect(result.minutes).toBe(59)
    expect(result.seconds).toBe(0)
  })

  it('returns correct seconds component', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-14T10:58:45Z')) // 15 seconds before deadline

    const deadline = new Date('2026-02-14T10:59:00Z')
    const result = getTimeRemaining(deadline)

    expect(result.isPast).toBe(false)
    expect(result.days).toBe(0)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(15)
  })

  it('returns isPast=false when exactly at deadline boundary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-14T10:58:59Z')) // 1 second before

    const deadline = new Date('2026-02-14T10:59:00Z')
    const result = getTimeRemaining(deadline)

    expect(result.isPast).toBe(false)
    expect(result.seconds).toBe(1)
  })
})
