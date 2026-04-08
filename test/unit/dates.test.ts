import { describe, it, expect } from 'vitest'
import {
  getSecondSaturday,
  getNextSecondSaturday,
  getLastSecondSaturday,
  formatShortDate,
} from '@/lib/dates'

describe('getSecondSaturday', () => {
  it('returns the second Saturday of January 2026', () => {
    // Jan 2026: 1st is Thursday, first Saturday = 3rd, second Saturday = 10th
    const result = getSecondSaturday(2026, 0)
    expect(result.getDate()).toBe(10)
    expect(result.getDay()).toBe(6) // Saturday
  })

  it('returns the second Saturday of February 2026', () => {
    // Feb 2026: 1st is Sunday, first Saturday = 7th, second Saturday = 14th
    const result = getSecondSaturday(2026, 1)
    expect(result.getDate()).toBe(14)
    expect(result.getDay()).toBe(6)
  })

  it('returns the second Saturday of March 2026', () => {
    // Mar 2026: 1st is Sunday, first Saturday = 7th, second Saturday = 14th
    const result = getSecondSaturday(2026, 2)
    expect(result.getDate()).toBe(14)
    expect(result.getDay()).toBe(6)
  })

  it('returns the second Saturday of October 2025', () => {
    // Oct 2025: 1st is Wednesday, first Saturday = 4th, second Saturday = 11th
    const result = getSecondSaturday(2025, 9)
    expect(result.getDate()).toBe(11)
    expect(result.getDay()).toBe(6)
  })

  it('always returns a Saturday', () => {
    for (let month = 0; month < 12; month++) {
      const result = getSecondSaturday(2026, month)
      expect(result.getDay()).toBe(6)
    }
  })

  it('always returns a date between 8 and 14', () => {
    for (let month = 0; month < 12; month++) {
      const result = getSecondSaturday(2026, month)
      expect(result.getDate()).toBeGreaterThanOrEqual(8)
      expect(result.getDate()).toBeLessThanOrEqual(14)
    }
  })
})

describe('getNextSecondSaturday', () => {
  it('returns this months second Saturday if before it', () => {
    // Jan 1, 2026 → second Saturday is Jan 10
    const from = new Date(2026, 0, 1)
    const result = getNextSecondSaturday(from)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(10)
  })

  it('returns this months second Saturday on the day itself', () => {
    // Jan 10, 2026 IS the second Saturday
    const from = new Date(2026, 0, 10)
    const result = getNextSecondSaturday(from)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(10)
  })

  it('returns next months second Saturday if past this months', () => {
    // Jan 11, 2026 (day after second Saturday) → Feb 14
    const from = new Date(2026, 0, 11)
    const result = getNextSecondSaturday(from)
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(14)
  })

  it('handles December → January rollover', () => {
    // Dec 20, 2025 (past second Saturday of Dec) → Jan 10, 2026
    const from = new Date(2025, 11, 20)
    const result = getNextSecondSaturday(from)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(10)
  })
})

describe('getLastSecondSaturday', () => {
  it('returns this months second Saturday if on or after it', () => {
    // Feb 14, 2026 IS the second Saturday
    const from = new Date(2026, 1, 14)
    const result = getLastSecondSaturday(from)
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(14)
  })

  it('returns this months second Saturday if after it', () => {
    // Feb 20, 2026 (after second Saturday) → Feb 14
    const from = new Date(2026, 1, 20)
    const result = getLastSecondSaturday(from)
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(14)
  })

  it('returns last months second Saturday if before this months', () => {
    // Feb 1, 2026 (before Feb 14) → Jan 10
    const from = new Date(2026, 1, 1)
    const result = getLastSecondSaturday(from)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(10)
  })

  it('handles January → December rollback', () => {
    // Jan 5, 2026 (before Jan 10) → Dec 13, 2025
    const from = new Date(2026, 0, 5)
    const result = getLastSecondSaturday(from)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(11)
    expect(result.getDate()).toBe(13)
  })
})

describe('formatShortDate', () => {
  it('formats as "Mon DD"', () => {
    const date = new Date(2025, 9, 11) // Oct 11
    expect(formatShortDate(date)).toBe('Oct 11')
  })

  it('formats January correctly', () => {
    const date = new Date(2026, 0, 10) // Jan 10
    expect(formatShortDate(date)).toBe('Jan 10')
  })
})
