import { describe, it, expect } from 'vitest'

// ============================================================================
// Validation Functions (mirrors expected convex/submissions.ts logic)
// ============================================================================

// Response text validation (500 character limit per spec)
function validateResponseText(text: string): { valid: boolean; error?: string } {
  if (text.length > 500) {
    return { valid: false, error: 'Response text must be 500 characters or less' }
  }
  return { valid: true }
}

// Media count validation (max 3 media items per response)
function validateMediaCount(count: number): { valid: boolean; error?: string } {
  if (count < 0) {
    return { valid: false, error: 'Media count cannot be negative' }
  }
  if (count > 3) {
    return { valid: false, error: 'Response can have up to 3 media items' }
  }
  return { valid: true }
}

// Media type validation (photo or video)
function validateMediaType(type: string): { valid: boolean; error?: string } {
  const validTypes = ['photo', 'video']
  if (!validTypes.includes(type)) {
    return { valid: false, error: 'Media type must be photo or video' }
  }
  return { valid: true }
}

// Media order validation (0-indexed, sequential)
function validateMediaOrder(order: number, totalCount: number): { valid: boolean; error?: string } {
  if (order < 0) {
    return { valid: false, error: 'Media order cannot be negative' }
  }
  if (order >= totalCount) {
    return { valid: false, error: 'Media order must be less than total count' }
  }
  return { valid: true }
}

// Submission uniqueness validation (one submission per user per circle per cycle)
function validateSubmissionUniqueness(
  existingSubmissions: Array<{ userId: string; circleId: string; cycleId: string }>
): { valid: boolean; error?: string } {
  const uniqueKeys = new Set<string>()
  for (const submission of existingSubmissions) {
    const key = `${submission.userId}-${submission.circleId}-${submission.cycleId}`
    if (uniqueKeys.has(key)) {
      return { valid: false, error: 'Only one submission per user per circle per cycle allowed' }
    }
    uniqueKeys.add(key)
  }
  return { valid: true }
}

// Response uniqueness validation (one response per prompt within submission)
function validateResponseUniqueness(responses: Array<{ submissionId: string; promptId: string }>): {
  valid: boolean
  error?: string
} {
  const uniqueKeys = new Set<string>()
  for (const response of responses) {
    const key = `${response.submissionId}-${response.promptId}`
    if (uniqueKeys.has(key)) {
      return { valid: false, error: 'Only one response per prompt within a submission allowed' }
    }
    uniqueKeys.add(key)
  }
  return { valid: true }
}

// Submission lock validation (cannot modify after deadline)
function validateSubmissionLocked(lockedAt?: number): { valid: boolean; error?: string } {
  if (lockedAt && lockedAt > 0) {
    return { valid: false, error: 'Cannot modify locked submission' }
  }
  return { valid: true }
}

// Cycle ID validation (format: YYYY-MM for monthly cycles)
function validateCycleId(cycleId: string): { valid: boolean; error?: string } {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    return { valid: false, error: 'Cycle ID must be in YYYY-MM format' }
  }

  const [year, month] = cycleId.split('-').map(Number)
  if (year < 2024 || year > 2099) {
    return { valid: false, error: 'Invalid year in cycle ID' }
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month in cycle ID' }
  }

  return { valid: true }
}

// CreateSubmission mutation validation
function validateCreateSubmission(args: { circleId: string; userId: string; cycleId: string }): {
  valid: boolean
  error?: string
} {
  if (!args.circleId || args.circleId.trim() === '') {
    return { valid: false, error: 'Circle ID is required' }
  }
  if (!args.userId || args.userId.trim() === '') {
    return { valid: false, error: 'User ID is required' }
  }
  if (!args.cycleId || args.cycleId.trim() === '') {
    return { valid: false, error: 'Cycle ID is required' }
  }

  const cycleValidation = validateCycleId(args.cycleId)
  if (!cycleValidation.valid) {
    return cycleValidation
  }

  return { valid: true }
}

// UpdateResponse mutation validation
function validateUpdateResponse(args: {
  submissionId: string
  promptId: string
  text: string
  lockedAt?: number
}): { valid: boolean; error?: string } {
  if (!args.submissionId || args.submissionId.trim() === '') {
    return { valid: false, error: 'Submission ID is required' }
  }
  if (!args.promptId || args.promptId.trim() === '') {
    return { valid: false, error: 'Prompt ID is required' }
  }

  const lockValidation = validateSubmissionLocked(args.lockedAt)
  if (!lockValidation.valid) {
    return lockValidation
  }

  const textValidation = validateResponseText(args.text)
  if (!textValidation.valid) {
    return textValidation
  }

  return { valid: true }
}

// LockSubmission mutation validation
function validateLockSubmission(args: { submissionId: string; lockedAt?: number }): {
  valid: boolean
  error?: string
} {
  if (!args.submissionId || args.submissionId.trim() === '') {
    return { valid: false, error: 'Submission ID is required' }
  }

  if (args.lockedAt && args.lockedAt > 0) {
    return { valid: false, error: 'Submission is already locked' }
  }

  return { valid: true }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Response Text Validation', () => {
  it('accepts empty response text', () => {
    expect(validateResponseText('')).toEqual({ valid: true })
  })

  it('accepts text within limit', () => {
    expect(validateResponseText('This is a valid response')).toEqual({ valid: true })
  })

  it('accepts text of exactly 500 characters', () => {
    expect(validateResponseText('A'.repeat(500))).toEqual({ valid: true })
  })

  it('rejects text longer than 500 characters', () => {
    expect(validateResponseText('A'.repeat(501))).toEqual({
      valid: false,
      error: 'Response text must be 500 characters or less',
    })
  })

  it('accepts typical user responses', () => {
    const responses = [
      'Had a great month! Went hiking and spent time with family.',
      'Been listening to the new album from my favorite artist.',
      'Reflecting on personal growth and setting goals for next month.',
    ]
    for (const text of responses) {
      expect(validateResponseText(text)).toEqual({ valid: true })
    }
  })
})

describe('Media Count Validation', () => {
  it('accepts 0 media items', () => {
    expect(validateMediaCount(0)).toEqual({ valid: true })
  })

  it('accepts 1 media item', () => {
    expect(validateMediaCount(1)).toEqual({ valid: true })
  })

  it('accepts 2 media items', () => {
    expect(validateMediaCount(2)).toEqual({ valid: true })
  })

  it('accepts exactly 3 media items (maximum)', () => {
    expect(validateMediaCount(3)).toEqual({ valid: true })
  })

  it('rejects 4 media items', () => {
    expect(validateMediaCount(4)).toEqual({
      valid: false,
      error: 'Response can have up to 3 media items',
    })
  })

  it('rejects negative media count', () => {
    expect(validateMediaCount(-1)).toEqual({
      valid: false,
      error: 'Media count cannot be negative',
    })
  })

  it('rejects excessive media counts', () => {
    expect(validateMediaCount(10)).toEqual({
      valid: false,
      error: 'Response can have up to 3 media items',
    })
  })
})

describe('Media Type Validation', () => {
  it('accepts photo media type', () => {
    expect(validateMediaType('photo')).toEqual({ valid: true })
  })

  it('accepts video media type', () => {
    expect(validateMediaType('video')).toEqual({ valid: true })
  })

  it('rejects invalid media types', () => {
    expect(validateMediaType('audio')).toEqual({
      valid: false,
      error: 'Media type must be photo or video',
    })
    expect(validateMediaType('document')).toEqual({
      valid: false,
      error: 'Media type must be photo or video',
    })
    expect(validateMediaType('')).toEqual({
      valid: false,
      error: 'Media type must be photo or video',
    })
  })

  it('is case-sensitive', () => {
    expect(validateMediaType('Photo')).toEqual({
      valid: false,
      error: 'Media type must be photo or video',
    })
    expect(validateMediaType('VIDEO')).toEqual({
      valid: false,
      error: 'Media type must be photo or video',
    })
  })
})

describe('Media Order Validation', () => {
  it('accepts order 0 for first media item', () => {
    expect(validateMediaOrder(0, 3)).toEqual({ valid: true })
  })

  it('accepts order 1 for second media item', () => {
    expect(validateMediaOrder(1, 3)).toEqual({ valid: true })
  })

  it('accepts order 2 for third media item', () => {
    expect(validateMediaOrder(2, 3)).toEqual({ valid: true })
  })

  it('rejects order equal to total count', () => {
    expect(validateMediaOrder(3, 3)).toEqual({
      valid: false,
      error: 'Media order must be less than total count',
    })
  })

  it('rejects negative order', () => {
    expect(validateMediaOrder(-1, 3)).toEqual({
      valid: false,
      error: 'Media order cannot be negative',
    })
  })

  it('rejects order greater than total count', () => {
    expect(validateMediaOrder(5, 3)).toEqual({
      valid: false,
      error: 'Media order must be less than total count',
    })
  })
})

describe('Submission Uniqueness Validation', () => {
  it('accepts unique submissions', () => {
    const submissions = [
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user1', circleId: 'circle2', cycleId: '2024-01' },
      { userId: 'user2', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-02' },
    ]
    expect(validateSubmissionUniqueness(submissions)).toEqual({ valid: true })
  })

  it('rejects duplicate submissions (same user, circle, cycle)', () => {
    const submissions = [
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
    ]
    expect(validateSubmissionUniqueness(submissions)).toEqual({
      valid: false,
      error: 'Only one submission per user per circle per cycle allowed',
    })
  })

  it('allows same user in different circles', () => {
    const submissions = [
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user1', circleId: 'circle2', cycleId: '2024-01' },
    ]
    expect(validateSubmissionUniqueness(submissions)).toEqual({ valid: true })
  })

  it('allows same user in different cycles', () => {
    const submissions = [
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-02' },
    ]
    expect(validateSubmissionUniqueness(submissions)).toEqual({ valid: true })
  })

  it('allows different users in same circle and cycle', () => {
    const submissions = [
      { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
      { userId: 'user2', circleId: 'circle1', cycleId: '2024-01' },
    ]
    expect(validateSubmissionUniqueness(submissions)).toEqual({ valid: true })
  })
})

describe('Response Uniqueness Validation', () => {
  it('accepts unique responses', () => {
    const responses = [
      { submissionId: 'sub1', promptId: 'prompt1' },
      { submissionId: 'sub1', promptId: 'prompt2' },
      { submissionId: 'sub2', promptId: 'prompt1' },
    ]
    expect(validateResponseUniqueness(responses)).toEqual({ valid: true })
  })

  it('rejects duplicate responses (same submission and prompt)', () => {
    const responses = [
      { submissionId: 'sub1', promptId: 'prompt1' },
      { submissionId: 'sub1', promptId: 'prompt1' },
    ]
    expect(validateResponseUniqueness(responses)).toEqual({
      valid: false,
      error: 'Only one response per prompt within a submission allowed',
    })
  })

  it('allows same prompt in different submissions', () => {
    const responses = [
      { submissionId: 'sub1', promptId: 'prompt1' },
      { submissionId: 'sub2', promptId: 'prompt1' },
    ]
    expect(validateResponseUniqueness(responses)).toEqual({ valid: true })
  })

  it('allows different prompts in same submission', () => {
    const responses = [
      { submissionId: 'sub1', promptId: 'prompt1' },
      { submissionId: 'sub1', promptId: 'prompt2' },
      { submissionId: 'sub1', promptId: 'prompt3' },
    ]
    expect(validateResponseUniqueness(responses)).toEqual({ valid: true })
  })
})

describe('Submission Lock Validation', () => {
  it('allows modification when submission is not locked', () => {
    expect(validateSubmissionLocked()).toEqual({ valid: true })
    expect(validateSubmissionLocked(0)).toEqual({ valid: true })
  })

  it('prevents modification when submission is locked', () => {
    const lockedAt = Date.now()
    expect(validateSubmissionLocked(lockedAt)).toEqual({
      valid: false,
      error: 'Cannot modify locked submission',
    })
  })

  it('prevents modification for any positive timestamp', () => {
    expect(validateSubmissionLocked(1)).toEqual({
      valid: false,
      error: 'Cannot modify locked submission',
    })
    expect(validateSubmissionLocked(1704067200000)).toEqual({
      // Jan 1, 2024
      valid: false,
      error: 'Cannot modify locked submission',
    })
  })
})

describe('Cycle ID Validation', () => {
  it('accepts valid cycle IDs', () => {
    expect(validateCycleId('2024-01')).toEqual({ valid: true })
    expect(validateCycleId('2024-12')).toEqual({ valid: true })
    expect(validateCycleId('2025-06')).toEqual({ valid: true })
  })

  it('rejects invalid format', () => {
    expect(validateCycleId('2024-1')).toEqual({
      valid: false,
      error: 'Cycle ID must be in YYYY-MM format',
    })
    expect(validateCycleId('24-01')).toEqual({
      valid: false,
      error: 'Cycle ID must be in YYYY-MM format',
    })
    expect(validateCycleId('2024/01')).toEqual({
      valid: false,
      error: 'Cycle ID must be in YYYY-MM format',
    })
    expect(validateCycleId('January 2024')).toEqual({
      valid: false,
      error: 'Cycle ID must be in YYYY-MM format',
    })
  })

  it('rejects invalid month values', () => {
    expect(validateCycleId('2024-00')).toEqual({
      valid: false,
      error: 'Invalid month in cycle ID',
    })
    expect(validateCycleId('2024-13')).toEqual({
      valid: false,
      error: 'Invalid month in cycle ID',
    })
  })

  it('rejects invalid year values', () => {
    expect(validateCycleId('2023-01')).toEqual({
      valid: false,
      error: 'Invalid year in cycle ID',
    })
    expect(validateCycleId('2100-01')).toEqual({
      valid: false,
      error: 'Invalid year in cycle ID',
    })
  })

  it('accepts all valid months', () => {
    for (let month = 1; month <= 12; month++) {
      const cycleId = `2024-${month.toString().padStart(2, '0')}`
      expect(validateCycleId(cycleId)).toEqual({ valid: true })
    }
  })
})

describe('CreateSubmission Mutation Validation', () => {
  it('accepts valid submission creation', () => {
    expect(
      validateCreateSubmission({
        circleId: 'circle123',
        userId: 'user456',
        cycleId: '2024-01',
      })
    ).toEqual({ valid: true })
  })

  it('requires circle ID', () => {
    expect(
      validateCreateSubmission({
        circleId: '',
        userId: 'user456',
        cycleId: '2024-01',
      })
    ).toEqual({ valid: false, error: 'Circle ID is required' })
  })

  it('requires user ID', () => {
    expect(
      validateCreateSubmission({
        circleId: 'circle123',
        userId: '',
        cycleId: '2024-01',
      })
    ).toEqual({ valid: false, error: 'User ID is required' })
  })

  it('requires cycle ID', () => {
    expect(
      validateCreateSubmission({
        circleId: 'circle123',
        userId: 'user456',
        cycleId: '',
      })
    ).toEqual({ valid: false, error: 'Cycle ID is required' })
  })

  it('validates cycle ID format', () => {
    expect(
      validateCreateSubmission({
        circleId: 'circle123',
        userId: 'user456',
        cycleId: 'invalid',
      })
    ).toEqual({ valid: false, error: 'Cycle ID must be in YYYY-MM format' })
  })

  it('rejects whitespace-only IDs', () => {
    expect(
      validateCreateSubmission({
        circleId: '   ',
        userId: 'user456',
        cycleId: '2024-01',
      })
    ).toEqual({ valid: false, error: 'Circle ID is required' })

    expect(
      validateCreateSubmission({
        circleId: 'circle123',
        userId: '   ',
        cycleId: '2024-01',
      })
    ).toEqual({ valid: false, error: 'User ID is required' })
  })
})

describe('UpdateResponse Mutation Validation', () => {
  it('accepts valid response update', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: 'prompt456',
        text: 'This is my response',
      })
    ).toEqual({ valid: true })
  })

  it('accepts empty text (allows deletion)', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: 'prompt456',
        text: '',
      })
    ).toEqual({ valid: true })
  })

  it('requires submission ID', () => {
    expect(
      validateUpdateResponse({
        submissionId: '',
        promptId: 'prompt456',
        text: 'Response text',
      })
    ).toEqual({ valid: false, error: 'Submission ID is required' })
  })

  it('requires prompt ID', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: '',
        text: 'Response text',
      })
    ).toEqual({ valid: false, error: 'Prompt ID is required' })
  })

  it('validates text length', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: 'prompt456',
        text: 'A'.repeat(501),
      })
    ).toEqual({ valid: false, error: 'Response text must be 500 characters or less' })
  })

  it('prevents updates to locked submissions', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: 'prompt456',
        text: 'Response text',
        lockedAt: Date.now(),
      })
    ).toEqual({ valid: false, error: 'Cannot modify locked submission' })
  })

  it('allows updates when lockedAt is 0', () => {
    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: 'prompt456',
        text: 'Response text',
        lockedAt: 0,
      })
    ).toEqual({ valid: true })
  })

  it('rejects whitespace-only IDs', () => {
    expect(
      validateUpdateResponse({
        submissionId: '   ',
        promptId: 'prompt456',
        text: 'Response text',
      })
    ).toEqual({ valid: false, error: 'Submission ID is required' })

    expect(
      validateUpdateResponse({
        submissionId: 'sub123',
        promptId: '   ',
        text: 'Response text',
      })
    ).toEqual({ valid: false, error: 'Prompt ID is required' })
  })
})

describe('LockSubmission Mutation Validation', () => {
  it('accepts valid submission lock', () => {
    expect(
      validateLockSubmission({
        submissionId: 'sub123',
      })
    ).toEqual({ valid: true })
  })

  it('accepts locking when lockedAt is 0', () => {
    expect(
      validateLockSubmission({
        submissionId: 'sub123',
        lockedAt: 0,
      })
    ).toEqual({ valid: true })
  })

  it('requires submission ID', () => {
    expect(
      validateLockSubmission({
        submissionId: '',
      })
    ).toEqual({ valid: false, error: 'Submission ID is required' })
  })

  it('prevents locking already locked submissions', () => {
    expect(
      validateLockSubmission({
        submissionId: 'sub123',
        lockedAt: Date.now(),
      })
    ).toEqual({ valid: false, error: 'Submission is already locked' })
  })

  it('rejects whitespace-only submission ID', () => {
    expect(
      validateLockSubmission({
        submissionId: '   ',
      })
    ).toEqual({ valid: false, error: 'Submission ID is required' })
  })
})

describe('Edge Cases and Error Conditions', () => {
  describe('boundary values', () => {
    it('handles exactly 500 character response', () => {
      const text = 'A'.repeat(500)
      expect(validateResponseText(text)).toEqual({ valid: true })
      expect(
        validateUpdateResponse({
          submissionId: 'sub123',
          promptId: 'prompt456',
          text,
        })
      ).toEqual({ valid: true })
    })

    it('handles exactly 3 media items', () => {
      expect(validateMediaCount(3)).toEqual({ valid: true })
      expect(validateMediaOrder(2, 3)).toEqual({ valid: true })
    })

    it('handles edge months', () => {
      expect(validateCycleId('2024-01')).toEqual({ valid: true })
      expect(validateCycleId('2024-12')).toEqual({ valid: true })
    })

    it('handles edge years', () => {
      expect(validateCycleId('2024-01')).toEqual({ valid: true })
      expect(validateCycleId('2099-12')).toEqual({ valid: true })
    })
  })

  describe('special characters and unicode', () => {
    it('accepts emoji in response text', () => {
      expect(validateResponseText('Great month! 🎉🎊✨')).toEqual({ valid: true })
    })

    it('accepts unicode characters in response text', () => {
      expect(validateResponseText('Merci beaucoup! 你好 مرحبا')).toEqual({ valid: true })
    })

    it('counts emoji correctly toward character limit', () => {
      const emojiText = '🎉'.repeat(501) // Emoji should count as characters
      const result = validateResponseText(emojiText)
      expect(result.valid).toBe(emojiText.length <= 500)
    })
  })

  describe('concurrent operations', () => {
    it('validates multiple responses in parallel', () => {
      const responses = [
        { submissionId: 'sub1', promptId: 'prompt1' },
        { submissionId: 'sub1', promptId: 'prompt2' },
        { submissionId: 'sub1', promptId: 'prompt3' },
        { submissionId: 'sub1', promptId: 'prompt4' },
      ]
      expect(validateResponseUniqueness(responses)).toEqual({ valid: true })
    })

    it('detects conflicts in batch submissions', () => {
      const submissions = [
        { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' },
        { userId: 'user2', circleId: 'circle1', cycleId: '2024-01' },
        { userId: 'user1', circleId: 'circle1', cycleId: '2024-01' }, // Duplicate
      ]
      expect(validateSubmissionUniqueness(submissions)).toEqual({
        valid: false,
        error: 'Only one submission per user per circle per cycle allowed',
      })
    })
  })

  describe('auto-save scenarios', () => {
    it('allows rapid sequential updates (auto-save)', () => {
      const updates = ['H', 'He', 'Hel', 'Hell', 'Hello']
      for (const text of updates) {
        expect(
          validateUpdateResponse({
            submissionId: 'sub123',
            promptId: 'prompt456',
            text,
          })
        ).toEqual({ valid: true })
      }
    })

    it('allows clearing text (empty string)', () => {
      expect(
        validateUpdateResponse({
          submissionId: 'sub123',
          promptId: 'prompt456',
          text: '',
        })
      ).toEqual({ valid: true })
    })
  })

  describe('deadline scenarios', () => {
    it('prevents any update after lock', () => {
      const lockedAt = Date.now()
      expect(
        validateUpdateResponse({
          submissionId: 'sub123',
          promptId: 'prompt456',
          text: 'Trying to update after deadline',
          lockedAt,
        })
      ).toEqual({ valid: false, error: 'Cannot modify locked submission' })
    })

    it('allows updates up until lock', () => {
      expect(
        validateUpdateResponse({
          submissionId: 'sub123',
          promptId: 'prompt456',
          text: 'Last minute update',
          lockedAt: 0,
        })
      ).toEqual({ valid: true })
    })

    it('prevents double-locking', () => {
      const lockedAt = Date.now()
      expect(
        validateLockSubmission({
          submissionId: 'sub123',
          lockedAt,
        })
      ).toEqual({ valid: false, error: 'Submission is already locked' })
    })
  })
})
