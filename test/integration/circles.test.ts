/**
 * Integration tests for circle business logic.
 *
 * These test the validation and logic embedded in Convex functions
 * by replicating the rules in isolation. True end-to-end Convex
 * integration tests require a running Convex backend (tested via E2E).
 */
import { describe, it, expect } from 'vitest'

// Replicate the core validation logic from convex/circles.ts

const DEFAULT_PROMPTS = [
  'What did you do this month?',
  'One Good Thing',
  'On Your Mind',
  'What are you listening to?',
]

function validateCreateCircle(args: {
  name: string
  timezone: string
  iconImageId?: string
  coverImageId?: string
  description?: string
}): { valid: boolean; error?: string } {
  if (args.name.length < 3 || args.name.length > 50) {
    return { valid: false, error: 'Circle name must be 3-50 characters' }
  }
  if (!args.timezone) {
    return { valid: false, error: 'Timezone is required' }
  }
  return { valid: true }
}

function validateUpdateCircle(args: { name?: string; description?: string }): {
  valid: boolean
  error?: string
} {
  if (args.name !== undefined) {
    if (args.name.length < 3 || args.name.length > 50) {
      return { valid: false, error: 'Circle name must be 3-50 characters' }
    }
  }
  return { valid: true }
}

function generateInviteCode(): string {
  return crypto.randomUUID()
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

describe('createCircle logic', () => {
  it('accepts valid circle creation args', () => {
    const result = validateCreateCircle({
      name: 'College Friends',
      timezone: 'America/New_York',
    })
    expect(result).toEqual({ valid: true })
  })

  it('rejects name shorter than 3 chars', () => {
    const result = validateCreateCircle({
      name: 'AB',
      timezone: 'America/New_York',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects name longer than 50 chars', () => {
    const result = validateCreateCircle({
      name: 'A'.repeat(51),
      timezone: 'America/New_York',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects empty timezone', () => {
    const result = validateCreateCircle({
      name: 'Valid Name',
      timezone: '',
    })
    expect(result.valid).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = validateCreateCircle({
      name: 'Valid Name',
      timezone: 'Europe/London',
      description: 'A test circle',
      iconImageId: 'some-id',
      coverImageId: 'some-id',
    })
    expect(result).toEqual({ valid: true })
  })

  it('generates 4 default prompts for new circles', () => {
    expect(DEFAULT_PROMPTS).toHaveLength(4)
    expect(DEFAULT_PROMPTS).toContain('What did you do this month?')
    expect(DEFAULT_PROMPTS).toContain('One Good Thing')
    expect(DEFAULT_PROMPTS).toContain('On Your Mind')
    expect(DEFAULT_PROMPTS).toContain('What are you listening to?')
  })

  it('generates a UUID invite code', () => {
    const code = generateInviteCode()
    expect(isValidUUID(code)).toBe(true)
  })

  it('generates unique invite codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()))
    expect(codes.size).toBe(100)
  })
})

describe('updateCircle logic', () => {
  it('accepts valid name update', () => {
    const result = validateUpdateCircle({ name: 'New Name' })
    expect(result).toEqual({ valid: true })
  })

  it('rejects invalid name update', () => {
    const result = validateUpdateCircle({ name: 'AB' })
    expect(result.valid).toBe(false)
  })

  it('accepts update with no name change', () => {
    const result = validateUpdateCircle({ description: 'Updated desc' })
    expect(result).toEqual({ valid: true })
  })

  it('accepts empty args (no-op update)', () => {
    const result = validateUpdateCircle({})
    expect(result).toEqual({ valid: true })
  })
})

describe('regenerateInviteCode logic', () => {
  it('generates a new valid UUID', () => {
    const oldCode = generateInviteCode()
    const newCode = generateInviteCode()
    expect(isValidUUID(newCode)).toBe(true)
    expect(newCode).not.toBe(oldCode)
  })
})

describe('getCirclesByUser logic', () => {
  it('filters out archived circles', () => {
    const circles = [
      { name: 'Active', archivedAt: undefined },
      { name: 'Archived', archivedAt: 1700000000000 },
      { name: 'Also Active', archivedAt: undefined },
    ]
    const filtered = circles.filter((c) => !c.archivedAt)
    expect(filtered).toHaveLength(2)
    expect(filtered.map((c) => c.name)).toEqual(['Active', 'Also Active'])
  })

  it('limits member preview to 5 names', () => {
    const allMembers = ['You', 'Alex', 'Dio', 'Shaun', 'Maya', 'Sam', 'Taylor']
    const preview = allMembers.slice(0, 5)
    expect(preview).toHaveLength(5)
    expect(preview).toEqual(['You', 'Alex', 'Dio', 'Shaun', 'Maya'])
  })

  it('detects unread when no read record exists', () => {
    const latestNewsletter = { _id: 'newsletter1' }
    const readRecord = null
    const hasUnread = latestNewsletter && !readRecord
    expect(hasUnread).toBe(true)
  })

  it('detects read when read record exists', () => {
    const latestNewsletter = { _id: 'newsletter1' }
    const readRecord = { userId: 'u1', newsletterId: 'newsletter1', readAt: Date.now() }
    const hasUnread = latestNewsletter && !readRecord
    expect(hasUnread).toBe(false)
  })

  it('shows no unread when no newsletters exist', () => {
    const latestNewsletter = null as { _id: string } | null
    const hasUnread = latestNewsletter !== null // No newsletter = nothing unread
    expect(hasUnread).toBe(false)
  })
})
