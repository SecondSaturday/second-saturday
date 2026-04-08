import { describe, it, expect } from 'vitest'

// Circle name validation (mirrors convex/circles.ts createCircle logic)
function validateCircleName(name: string): { valid: boolean; error?: string } {
  if (name.length < 3) return { valid: false, error: 'Circle name must be 3-50 characters' }
  if (name.length > 50) return { valid: false, error: 'Circle name must be 3-50 characters' }
  return { valid: true }
}

// Prompt text validation (mirrors convex/prompts.ts updatePrompts logic)
function validatePromptText(text: string): { valid: boolean; error?: string } {
  if (text.length > 200)
    return { valid: false, error: 'Prompt text must be 200 characters or less' }
  return { valid: true }
}

// Prompt count validation
function validatePromptCount(count: number): { valid: boolean; error?: string } {
  if (count < 1) return { valid: false, error: 'Must have 1-8 prompts' }
  if (count > 8) return { valid: false, error: 'Must have 1-8 prompts' }
  return { valid: true }
}

// Invite code validation (UUID format)
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

// Image file type validation (mirrors src/lib/image.ts)
function isImageFile(type: string): boolean {
  return type.startsWith('image/')
}

// 3-member minimum check
function hasMinimumMembers(memberCount: number): boolean {
  return memberCount >= 3
}

describe('Circle Name Validation', () => {
  it('rejects names shorter than 3 characters', () => {
    expect(validateCircleName('')).toEqual({
      valid: false,
      error: 'Circle name must be 3-50 characters',
    })
    expect(validateCircleName('AB')).toEqual({
      valid: false,
      error: 'Circle name must be 3-50 characters',
    })
  })

  it('accepts names of exactly 3 characters', () => {
    expect(validateCircleName('ABC')).toEqual({ valid: true })
  })

  it('accepts names of exactly 50 characters', () => {
    expect(validateCircleName('A'.repeat(50))).toEqual({ valid: true })
  })

  it('rejects names longer than 50 characters', () => {
    expect(validateCircleName('A'.repeat(51))).toEqual({
      valid: false,
      error: 'Circle name must be 3-50 characters',
    })
  })

  it('accepts typical circle names', () => {
    expect(validateCircleName('College Friends')).toEqual({ valid: true })
    expect(validateCircleName('Fake Frems')).toEqual({ valid: true })
    expect(validateCircleName('Work Buddies')).toEqual({ valid: true })
  })
})

describe('Prompt Text Validation', () => {
  it('accepts empty prompt text', () => {
    expect(validatePromptText('')).toEqual({ valid: true })
  })

  it('accepts text of exactly 200 characters', () => {
    expect(validatePromptText('A'.repeat(200))).toEqual({ valid: true })
  })

  it('rejects text longer than 200 characters', () => {
    expect(validatePromptText('A'.repeat(201))).toEqual({
      valid: false,
      error: 'Prompt text must be 200 characters or less',
    })
  })

  it('accepts default prompts', () => {
    const defaults = [
      'What did you do this month?',
      'One Good Thing',
      'On Your Mind',
      'What are you listening to?',
    ]
    for (const text of defaults) {
      expect(validatePromptText(text)).toEqual({ valid: true })
    }
  })
})

describe('Prompt Count Validation', () => {
  it('rejects 0 prompts', () => {
    expect(validatePromptCount(0)).toEqual({ valid: false, error: 'Must have 1-8 prompts' })
  })

  it('accepts 1 prompt (minimum)', () => {
    expect(validatePromptCount(1)).toEqual({ valid: true })
  })

  it('accepts 8 prompts (maximum)', () => {
    expect(validatePromptCount(8)).toEqual({ valid: true })
  })

  it('rejects 9 prompts', () => {
    expect(validatePromptCount(9)).toEqual({ valid: false, error: 'Must have 1-8 prompts' })
  })

  it('accepts 4 prompts (default count)', () => {
    expect(validatePromptCount(4)).toEqual({ valid: true })
  })
})

describe('Invite Code Validation (UUID format)', () => {
  it('validates a proper UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('validates crypto.randomUUID() output format', () => {
    // crypto.randomUUID generates v4 UUIDs
    const uuid = crypto.randomUUID()
    expect(isValidUUID(uuid)).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false)
  })

  it('rejects non-UUID strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('12345')).toBe(false)
  })

  it('rejects UUIDs with wrong length segments', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
  })
})

describe('Image File Type Validation', () => {
  it('accepts JPEG images', () => {
    expect(isImageFile('image/jpeg')).toBe(true)
  })

  it('accepts PNG images', () => {
    expect(isImageFile('image/png')).toBe(true)
  })

  it('accepts HEIC images', () => {
    expect(isImageFile('image/heic')).toBe(true)
  })

  it('accepts WebP images', () => {
    expect(isImageFile('image/webp')).toBe(true)
  })

  it('rejects video files', () => {
    expect(isImageFile('video/mp4')).toBe(false)
  })

  it('rejects text files', () => {
    expect(isImageFile('text/plain')).toBe(false)
  })

  it('rejects application files', () => {
    expect(isImageFile('application/pdf')).toBe(false)
  })
})

describe('3-Member Minimum Check', () => {
  it('returns false for 0 members', () => {
    expect(hasMinimumMembers(0)).toBe(false)
  })

  it('returns false for 1 member (admin only)', () => {
    expect(hasMinimumMembers(1)).toBe(false)
  })

  it('returns false for 2 members', () => {
    expect(hasMinimumMembers(2)).toBe(false)
  })

  it('returns true for exactly 3 members', () => {
    expect(hasMinimumMembers(3)).toBe(true)
  })

  it('returns true for more than 3 members', () => {
    expect(hasMinimumMembers(5)).toBe(true)
    expect(hasMinimumMembers(10)).toBe(true)
  })
})
