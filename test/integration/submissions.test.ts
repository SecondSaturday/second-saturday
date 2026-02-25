/**
 * Integration tests for submission business logic.
 *
 * These tests validate the end-to-end workflows and business rules
 * embedded in Convex submission functions by replicating the logic
 * in isolation. Tests cover:
 * - All mutations (createSubmission, updateResponse, lockSubmission, media operations)
 * - All queries (getSubmissionForCircle, getPromptsForCircle)
 * - Multi-user scenarios
 * - Constraint validation
 * - Error conditions
 */
import { describe, it, expect } from 'vitest'

// ============================================================================
// Helper Types
// ============================================================================

interface User {
  _id: string
  clerkId: string
  name: string
}

interface Circle {
  _id: string
  name: string
  adminId: string
}

interface Membership {
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
  lockedAt?: number
  createdAt: number
  updatedAt: number
}

interface Response {
  _id: string
  submissionId: string
  promptId: string
  text: string
  createdAt: number
  updatedAt: number
}

interface Media {
  _id: string
  responseId: string
  storageId?: string
  muxAssetId?: string
  type: 'image' | 'video'
  thumbnailUrl?: string
  order: number
  uploadedAt: number
  createdAt: number
}

interface Prompt {
  _id: string
  circleId: string
  text: string
  order: number
  active: boolean
  createdAt: number
}

// ============================================================================
// Validation Functions (mirrors convex/submissions.ts)
// ============================================================================

function validateCycleId(cycleId: string): { valid: boolean; error?: string } {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    return { valid: false, error: 'Cycle ID must be in YYYY-MM format' }
  }

  const [year, month] = cycleId.split('-').map(Number) as [number, number]
  if (year < 2024 || year > 2099) {
    return { valid: false, error: 'Invalid year in cycle ID' }
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month in cycle ID' }
  }

  return { valid: true }
}

function validateResponseText(text: string): { valid: boolean; error?: string } {
  if (text.length > 500) {
    return { valid: false, error: 'Response text must be 500 characters or less' }
  }
  return { valid: true }
}

function checkMembership(
  userId: string,
  circleId: string,
  memberships: Membership[]
): { valid: boolean; error?: string; membership?: Membership } {
  const membership = memberships.find((m) => m.userId === userId && m.circleId === circleId)

  if (!membership) {
    return { valid: false, error: 'Not a member of this circle' }
  }

  if (membership.leftAt) {
    return { valid: false, error: 'Not a member of this circle' }
  }

  return { valid: true, membership }
}

function checkSubmissionUniqueness(
  userId: string,
  circleId: string,
  cycleId: string,
  submissions: Submission[]
): { valid: boolean; error?: string } {
  const existing = submissions.find(
    (s) => s.userId === userId && s.circleId === circleId && s.cycleId === cycleId
  )

  if (existing) {
    return { valid: false, error: 'Only one submission per user per circle per cycle allowed' }
  }

  return { valid: true }
}

function checkResponseUniqueness(
  submissionId: string,
  promptId: string,
  responses: Response[]
): { existing?: Response } {
  const existing = responses.find((r) => r.submissionId === submissionId && r.promptId === promptId)

  return { existing }
}

function checkSubmissionLocked(submission: Submission): { valid: boolean; error?: string } {
  if (submission.lockedAt && submission.lockedAt > 0) {
    return { valid: false, error: 'Cannot modify locked submission' }
  }
  return { valid: true }
}

function checkMediaCount(
  responseId: string,
  mediaItems: Media[]
): { valid: boolean; error?: string; count?: number } {
  const count = mediaItems.filter((m) => m.responseId === responseId).length

  if (count >= 3) {
    return { valid: false, error: 'Response can have up to 3 media items' }
  }

  return { valid: true, count }
}

// ============================================================================
// Mutation Simulations
// ============================================================================

function simulateCreateSubmission(
  userId: string,
  circleId: string,
  cycleId: string,
  memberships: Membership[],
  submissions: Submission[]
): { success: boolean; submissionId?: string; error?: string } {
  // Check membership
  const membershipCheck = checkMembership(userId, circleId, memberships)
  if (!membershipCheck.valid) {
    return { success: false, error: membershipCheck.error }
  }

  // Validate cycle ID
  const cycleCheck = validateCycleId(cycleId)
  if (!cycleCheck.valid) {
    return { success: false, error: cycleCheck.error }
  }

  // Check uniqueness
  const uniquenessCheck = checkSubmissionUniqueness(userId, circleId, cycleId, submissions)
  if (!uniquenessCheck.valid) {
    return { success: false, error: uniquenessCheck.error }
  }

  // Create submission
  const submissionId = `sub_${Date.now()}`
  return { success: true, submissionId }
}

function simulateUpdateResponse(
  userId: string,
  submissionId: string,
  promptId: string,
  text: string,
  submissions: Submission[],
  prompts: Prompt[],
  responses: Response[]
): { success: boolean; responseId?: string; error?: string; isUpdate?: boolean } {
  // Validate text
  const textCheck = validateResponseText(text)
  if (!textCheck.valid) {
    return { success: false, error: textCheck.error }
  }

  // Get submission and verify ownership
  const submission = submissions.find((s) => s._id === submissionId)
  if (!submission) {
    return { success: false, error: 'Submission not found' }
  }
  if (submission.userId !== userId) {
    return { success: false, error: 'Not authorized to modify this submission' }
  }

  // Check if locked
  const lockCheck = checkSubmissionLocked(submission)
  if (!lockCheck.valid) {
    return { success: false, error: lockCheck.error }
  }

  // Verify prompt belongs to same circle
  const prompt = prompts.find((p) => p._id === promptId)
  if (!prompt) {
    return { success: false, error: 'Prompt not found' }
  }
  if (prompt.circleId !== submission.circleId) {
    return { success: false, error: 'Prompt does not belong to this circle' }
  }

  // Check for existing response
  const { existing } = checkResponseUniqueness(submissionId, promptId, responses)

  if (existing) {
    return { success: true, responseId: existing._id, isUpdate: true }
  } else {
    const responseId = `resp_${Date.now()}`
    return { success: true, responseId, isUpdate: false }
  }
}

function simulateLockSubmission(
  userId: string,
  submissionId: string,
  submissions: Submission[]
): { success: boolean; error?: string } {
  // Get submission and verify ownership
  const submission = submissions.find((s) => s._id === submissionId)
  if (!submission) {
    return { success: false, error: 'Submission not found' }
  }
  if (submission.userId !== userId) {
    return { success: false, error: 'Not authorized to lock this submission' }
  }

  // Check if already locked
  if (submission.lockedAt && submission.lockedAt > 0) {
    return { success: false, error: 'Submission is already locked' }
  }

  return { success: true }
}

function simulateAddMedia(
  userId: string,
  responseId: string,
  type: 'image' | 'video',
  responses: Response[],
  submissions: Submission[],
  mediaItems: Media[]
): { success: boolean; mediaId?: string; order?: number; error?: string } {
  // Get response and verify ownership
  const response = responses.find((r) => r._id === responseId)
  if (!response) {
    return { success: false, error: 'Response not found' }
  }

  const submission = submissions.find((s) => s._id === response.submissionId)
  if (!submission) {
    return { success: false, error: 'Submission not found' }
  }
  if (submission.userId !== userId) {
    return { success: false, error: 'Not authorized to modify this response' }
  }

  // Check if locked
  const lockCheck = checkSubmissionLocked(submission)
  if (!lockCheck.valid) {
    return { success: false, error: lockCheck.error }
  }

  // Check media count
  const mediaCheck = checkMediaCount(responseId, mediaItems)
  if (!mediaCheck.valid) {
    return { success: false, error: mediaCheck.error }
  }

  const order = mediaCheck.count!
  const mediaId = `media_${Date.now()}`
  return { success: true, mediaId, order }
}

function simulateRemoveMedia(
  userId: string,
  mediaId: string,
  mediaItems: Media[],
  responses: Response[],
  submissions: Submission[]
): { success: boolean; error?: string; reordered?: Media[] } {
  // Get media and verify ownership
  const media = mediaItems.find((m) => m._id === mediaId)
  if (!media) {
    return { success: false, error: 'Media not found' }
  }

  const response = responses.find((r) => r._id === media.responseId)
  if (!response) {
    return { success: false, error: 'Response not found' }
  }

  const submission = submissions.find((s) => s._id === response.submissionId)
  if (!submission) {
    return { success: false, error: 'Submission not found' }
  }
  if (submission.userId !== userId) {
    return { success: false, error: 'Not authorized to remove this media' }
  }

  // Check if locked
  const lockCheck = checkSubmissionLocked(submission)
  if (!lockCheck.valid) {
    return { success: false, error: lockCheck.error }
  }

  // Simulate reordering remaining media
  const remaining = mediaItems
    .filter((m) => m.responseId === media.responseId && m._id !== mediaId)
    .sort((a, b) => a.order - b.order)
    .map((m, i) => ({ ...m, order: i }))

  return { success: true, reordered: remaining }
}

// ============================================================================
// Query Simulations
// ============================================================================

function simulateGetSubmissionForCircle(
  userId: string,
  circleId: string,
  cycleId: string,
  memberships: Membership[],
  submissions: Submission[],
  responses: Response[],
  prompts: Prompt[],
  mediaItems: Media[]
) {
  // Check membership
  const membershipCheck = checkMembership(userId, circleId, memberships)
  if (!membershipCheck.valid) {
    return { success: false, error: membershipCheck.error }
  }

  // Find submission
  const submission = submissions.find(
    (s) => s.userId === userId && s.circleId === circleId && s.cycleId === cycleId
  )

  if (!submission) {
    return { success: true, submission: null }
  }

  // Get all responses with prompts and media
  const submissionResponses = responses
    .filter((r) => r.submissionId === submission._id)
    .map((response) => {
      const prompt = prompts.find((p) => p._id === response.promptId)
      const media = mediaItems
        .filter((m) => m.responseId === response._id)
        .sort((a, b) => a.order - b.order)

      return {
        ...response,
        prompt,
        media,
      }
    })

  return {
    success: true,
    submission: {
      ...submission,
      responses: submissionResponses,
    },
  }
}

function simulateGetPromptsForCircle(
  userId: string,
  circleId: string,
  memberships: Membership[],
  prompts: Prompt[]
) {
  // Check membership
  const membershipCheck = checkMembership(userId, circleId, memberships)
  if (!membershipCheck.valid) {
    return { success: false, error: membershipCheck.error }
  }

  // Get active prompts for circle
  const circlePrompts = prompts
    .filter((p) => p.circleId === circleId && p.active)
    .sort((a, b) => a.order - b.order)

  return { success: true, prompts: circlePrompts }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('createSubmission mutation', () => {
  it('creates submission successfully for valid member', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []

    const result = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(true)
    expect(result.submissionId).toBeDefined()
  })

  it('rejects submission for non-member', () => {
    const memberships: Membership[] = [{ userId: 'user2', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []

    const result = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })

  it('rejects submission for user who left circle', () => {
    const memberships: Membership[] = [
      { userId: 'user1', circleId: 'circle1', role: 'member', leftAt: Date.now() },
    ]
    const submissions: Submission[] = []

    const result = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })

  it('rejects invalid cycle ID format', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []

    const result = simulateCreateSubmission('user1', 'circle1', '2024-1', memberships, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cycle ID must be in YYYY-MM format')
  })

  it('rejects duplicate submission (same user, circle, cycle)', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Only one submission per user per circle per cycle allowed')
  })

  it('allows same user to submit in different cycles', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-01',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(true)
    expect(result.submissionId).toBeDefined()
  })

  it('allows same user to submit in different circles', () => {
    const memberships: Membership[] = [
      { userId: 'user1', circleId: 'circle1', role: 'member' },
      { userId: 'user1', circleId: 'circle2', role: 'member' },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateCreateSubmission('user1', 'circle2', '2024-02', memberships, submissions)

    expect(result.success).toBe(true)
    expect(result.submissionId).toBeDefined()
  })

  it('allows different users to submit in same circle and cycle', () => {
    const memberships: Membership[] = [
      { userId: 'user1', circleId: 'circle1', role: 'member' },
      { userId: 'user2', circleId: 'circle1', role: 'member' },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateCreateSubmission('user2', 'circle1', '2024-02', memberships, submissions)

    expect(result.success).toBe(true)
    expect(result.submissionId).toBeDefined()
  })
})

describe('updateResponse mutation', () => {
  it('creates new response successfully', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'Had a great month!',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(true)
    expect(result.responseId).toBeDefined()
    expect(result.isUpdate).toBe(false)
  })

  it('updates existing response', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'Original text',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'Updated text',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(true)
    expect(result.responseId).toBe('resp1')
    expect(result.isUpdate).toBe(true)
  })

  it('rejects response longer than 500 characters', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'A'.repeat(501),
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Response text must be 500 characters or less')
  })

  it('rejects update from non-owner', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user2',
      'sub1',
      'prompt1',
      'Unauthorized update',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authorized to modify this submission')
  })

  it('rejects update to locked submission', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'After deadline',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot modify locked submission')
  })

  it('rejects prompt from different circle', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle2', // Different circle!
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'Valid text',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Prompt does not belong to this circle')
  })

  it('accepts empty text (allows clearing)', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    const result = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      '',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(true)
  })
})

describe('lockSubmission mutation', () => {
  it('locks submission successfully', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateLockSubmission('user1', 'sub1', submissions)

    expect(result.success).toBe(true)
  })

  it('rejects lock from non-owner', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateLockSubmission('user2', 'sub1', submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authorized to lock this submission')
  })

  it('rejects double-locking', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const result = simulateLockSubmission('user1', 'sub1', submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Submission is already locked')
  })

  it('returns error for non-existent submission', () => {
    const submissions: Submission[] = []

    const result = simulateLockSubmission('user1', 'sub1', submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Submission not found')
  })
})

describe('addMediaToResponse mutation', () => {
  it('adds media successfully (order 0)', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    const result = simulateAddMedia('user1', 'resp1', 'image', responses, submissions, mediaItems)

    expect(result.success).toBe(true)
    expect(result.mediaId).toBeDefined()
    expect(result.order).toBe(0)
  })

  it('adds second media item (order 1)', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateAddMedia('user1', 'resp1', 'video', responses, submissions, mediaItems)

    expect(result.success).toBe(true)
    expect(result.order).toBe(1)
  })

  it('adds third media item (order 2, max)', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media2',
        responseId: 'resp1',
        type: 'video',
        order: 1,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateAddMedia('user1', 'resp1', 'image', responses, submissions, mediaItems)

    expect(result.success).toBe(true)
    expect(result.order).toBe(2)
  })

  it('rejects fourth media item (exceeds max of 3)', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media2',
        responseId: 'resp1',
        type: 'video',
        order: 1,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media3',
        responseId: 'resp1',
        type: 'image',
        order: 2,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateAddMedia('user1', 'resp1', 'image', responses, submissions, mediaItems)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Response can have up to 3 media items')
  })

  it('rejects media upload from non-owner', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    const result = simulateAddMedia('user2', 'resp1', 'image', responses, submissions, mediaItems)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authorized to modify this response')
  })

  it('rejects media upload to locked submission', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    const result = simulateAddMedia('user1', 'resp1', 'image', responses, submissions, mediaItems)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot modify locked submission')
  })
})

describe('removeMediaFromResponse mutation', () => {
  it('removes media successfully', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateRemoveMedia('user1', 'media1', mediaItems, responses, submissions)

    expect(result.success).toBe(true)
  })

  it('reorders remaining media after removal', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media2',
        responseId: 'resp1',
        type: 'video',
        order: 1,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media3',
        responseId: 'resp1',
        type: 'image',
        order: 2,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    // Remove media2 (order 1)
    const result = simulateRemoveMedia('user1', 'media2', mediaItems, responses, submissions)

    expect(result.success).toBe(true)
    expect(result.reordered).toHaveLength(2)
    expect(result.reordered![0]!._id).toBe('media1')
    expect(result.reordered![0]!.order).toBe(0)
    expect(result.reordered![1]!._id).toBe('media3')
    expect(result.reordered![1]!.order).toBe(1) // Reordered from 2 to 1
  })

  it('rejects removal from non-owner', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateRemoveMedia('user2', 'media1', mediaItems, responses, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authorized to remove this media')
  })

  it('rejects removal from locked submission', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateRemoveMedia('user1', 'media1', mediaItems, responses, submissions)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot modify locked submission')
  })
})

describe('getSubmissionForCircle query', () => {
  it('returns null when no submission exists', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []
    const responses: Response[] = []
    const prompts: Prompt[] = []
    const mediaItems: Media[] = []

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(true)
    expect(result.submission).toBeNull()
  })

  it('returns submission with empty responses', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const responses: Response[] = []
    const prompts: Prompt[] = []
    const mediaItems: Media[] = []

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(true)
    expect(result.submission).toBeDefined()
    expect(result.submission!._id).toBe('sub1')
    expect(result.submission!.responses).toHaveLength(0)
  })

  it('returns submission with responses and prompts', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
      {
        _id: 'prompt2',
        circleId: 'circle1',
        text: 'One Good Thing',
        order: 1,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'Had a great month!',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        _id: 'resp2',
        submissionId: 'sub1',
        promptId: 'prompt2',
        text: 'Spent time with family',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(true)
    expect(result.submission!.responses).toHaveLength(2)
    expect(result.submission!.responses[0]!.prompt!.text).toBe('What did you do this month?')
    expect(result.submission!.responses[1]!.prompt!.text).toBe('One Good Thing')
  })

  it('returns submission with responses and media', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'Had a great month!',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media2',
        responseId: 'resp1',
        type: 'video',
        order: 1,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(true)
    expect(result.submission!.responses[0]!.media).toHaveLength(2)
    expect(result.submission!.responses[0]!.media[0]!.order).toBe(0)
    expect(result.submission!.responses[0]!.media[1]!.order).toBe(1)
  })

  it('sorts media by order', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'Had a great month!',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = [
      {
        _id: 'media2',
        responseId: 'resp1',
        type: 'video',
        order: 2,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media1',
        responseId: 'resp1',
        type: 'image',
        order: 0,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
      {
        _id: 'media3',
        responseId: 'resp1',
        type: 'image',
        order: 1,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      },
    ]

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(true)
    const media = result.submission!.responses[0]!.media
    expect(media[0]!._id).toBe('media1')
    expect(media[1]!._id).toBe('media3')
    expect(media[2]!._id).toBe('media2')
  })

  it('rejects query from non-member', () => {
    const memberships: Membership[] = [{ userId: 'user2', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []
    const responses: Response[] = []
    const prompts: Prompt[] = []
    const mediaItems: Media[] = []

    const result = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })
})

describe('getPromptsForCircle query', () => {
  it('returns all active prompts sorted by order', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const prompts: Prompt[] = [
      {
        _id: 'prompt3',
        circleId: 'circle1',
        text: 'Third prompt',
        order: 2,
        active: true,
        createdAt: Date.now(),
      },
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'First prompt',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
      {
        _id: 'prompt2',
        circleId: 'circle1',
        text: 'Second prompt',
        order: 1,
        active: true,
        createdAt: Date.now(),
      },
    ]

    const result = simulateGetPromptsForCircle('user1', 'circle1', memberships, prompts)

    expect(result.success).toBe(true)
    expect(result.prompts).toHaveLength(3)
    expect(result.prompts![0]!.text).toBe('First prompt')
    expect(result.prompts![1]!.text).toBe('Second prompt')
    expect(result.prompts![2]!.text).toBe('Third prompt')
  })

  it('filters out inactive prompts', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'Active prompt',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
      {
        _id: 'prompt2',
        circleId: 'circle1',
        text: 'Inactive prompt',
        order: 1,
        active: false,
        createdAt: Date.now(),
      },
    ]

    const result = simulateGetPromptsForCircle('user1', 'circle1', memberships, prompts)

    expect(result.success).toBe(true)
    expect(result.prompts).toHaveLength(1)
    expect(result.prompts![0]!.text).toBe('Active prompt')
  })

  it('returns empty array when no active prompts', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'Inactive prompt',
        order: 0,
        active: false,
        createdAt: Date.now(),
      },
    ]

    const result = simulateGetPromptsForCircle('user1', 'circle1', memberships, prompts)

    expect(result.success).toBe(true)
    expect(result.prompts).toHaveLength(0)
  })

  it('rejects query from non-member', () => {
    const memberships: Membership[] = [{ userId: 'user2', circleId: 'circle1', role: 'member' }]
    const prompts: Prompt[] = []

    const result = simulateGetPromptsForCircle('user1', 'circle1', memberships, prompts)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })
})

describe('End-to-end submission workflow', () => {
  it('completes full submission lifecycle', () => {
    // Setup
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []
    const responses: Response[] = []
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
      {
        _id: 'prompt2',
        circleId: 'circle1',
        text: 'One Good Thing',
        order: 1,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    // Step 1: Create submission
    const createResult = simulateCreateSubmission(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions
    )
    expect(createResult.success).toBe(true)
    submissions.push({
      _id: createResult.submissionId!,
      userId: 'user1',
      circleId: 'circle1',
      cycleId: '2024-02',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Step 2: Add first response
    const resp1Result = simulateUpdateResponse(
      'user1',
      createResult.submissionId!,
      'prompt1',
      'Had a great month!',
      submissions,
      prompts,
      responses
    )
    expect(resp1Result.success).toBe(true)
    responses.push({
      _id: resp1Result.responseId!,
      submissionId: createResult.submissionId!,
      promptId: 'prompt1',
      text: 'Had a great month!',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Step 3: Add second response
    const resp2Result = simulateUpdateResponse(
      'user1',
      createResult.submissionId!,
      'prompt2',
      'Spent time with family',
      submissions,
      prompts,
      responses
    )
    expect(resp2Result.success).toBe(true)
    responses.push({
      _id: resp2Result.responseId!,
      submissionId: createResult.submissionId!,
      promptId: 'prompt2',
      text: 'Spent time with family',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Step 4: Add media to first response
    const mediaResult = simulateAddMedia(
      'user1',
      resp1Result.responseId!,
      'image',
      responses,
      submissions,
      mediaItems
    )
    expect(mediaResult.success).toBe(true)
    mediaItems.push({
      _id: mediaResult.mediaId!,
      responseId: resp1Result.responseId!,
      type: 'image',
      order: mediaResult.order!,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
    })

    // Step 5: Update first response (auto-save)
    const updateResult = simulateUpdateResponse(
      'user1',
      createResult.submissionId!,
      'prompt1',
      'Had a REALLY great month!',
      submissions,
      prompts,
      responses
    )
    expect(updateResult.success).toBe(true)
    expect(updateResult.isUpdate).toBe(true)

    // Step 6: Lock submission
    const lockResult = simulateLockSubmission('user1', createResult.submissionId!, submissions)
    expect(lockResult.success).toBe(true)
    submissions[0]!.lockedAt = Date.now()

    // Step 7: Verify cannot modify after lock
    const afterLockResult = simulateUpdateResponse(
      'user1',
      createResult.submissionId!,
      'prompt1',
      'Trying to update after lock',
      submissions,
      prompts,
      responses
    )
    expect(afterLockResult.success).toBe(false)
    expect(afterLockResult.error).toBe('Cannot modify locked submission')

    // Step 8: Query submission
    const queryResult = simulateGetSubmissionForCircle(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions,
      responses,
      prompts,
      mediaItems
    )
    expect(queryResult.success).toBe(true)
    expect(queryResult.submission!.responses).toHaveLength(2)
    expect(queryResult.submission!.responses[0]!.media).toHaveLength(1)
  })
})

describe('Multi-user scenarios', () => {
  it('allows multiple users to submit to same circle in same cycle', () => {
    const memberships: Membership[] = [
      { userId: 'user1', circleId: 'circle1', role: 'member' },
      { userId: 'user2', circleId: 'circle1', role: 'member' },
      { userId: 'user3', circleId: 'circle1', role: 'admin' },
    ]
    const submissions: Submission[] = []

    // User 1 creates submission
    const result1 = simulateCreateSubmission(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions
    )
    expect(result1.success).toBe(true)

    // User 2 creates submission
    const result2 = simulateCreateSubmission(
      'user2',
      'circle1',
      '2024-02',
      memberships,
      submissions
    )
    expect(result2.success).toBe(true)

    // User 3 (admin) creates submission
    const result3 = simulateCreateSubmission(
      'user3',
      'circle1',
      '2024-02',
      memberships,
      submissions
    )
    expect(result3.success).toBe(true)
  })

  it('prevents users from modifying each others submissions', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    // User 2 tries to update user 1's submission
    const result = simulateUpdateResponse(
      'user2',
      'sub1',
      'prompt1',
      'Unauthorized update',
      submissions,
      prompts,
      responses
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authorized to modify this submission')
  })

  it('isolates submissions between different circles', () => {
    const memberships: Membership[] = [
      { userId: 'user1', circleId: 'circle1', role: 'member' },
      { userId: 'user1', circleId: 'circle2', role: 'member' },
    ]
    const submissions: Submission[] = []

    // User submits to circle1
    const result1 = simulateCreateSubmission(
      'user1',
      'circle1',
      '2024-02',
      memberships,
      submissions
    )
    expect(result1.success).toBe(true)
    submissions.push({
      _id: result1.submissionId!,
      userId: 'user1',
      circleId: 'circle1',
      cycleId: '2024-02',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // User can also submit to circle2 in same cycle
    const result2 = simulateCreateSubmission(
      'user1',
      'circle2',
      '2024-02',
      memberships,
      submissions
    )
    expect(result2.success).toBe(true)
  })
})

describe('Constraint validation in realistic scenarios', () => {
  it('enforces one submission per user per circle per cycle across months', () => {
    const memberships: Membership[] = [{ userId: 'user1', circleId: 'circle1', role: 'member' }]
    const submissions: Submission[] = []

    // January submission
    const jan = simulateCreateSubmission('user1', 'circle1', '2024-01', memberships, submissions)
    expect(jan.success).toBe(true)
    submissions.push({
      _id: jan.submissionId!,
      userId: 'user1',
      circleId: 'circle1',
      cycleId: '2024-01',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // February submission (should succeed)
    const feb = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)
    expect(feb.success).toBe(true)
    submissions.push({
      _id: feb.submissionId!,
      userId: 'user1',
      circleId: 'circle1',
      cycleId: '2024-02',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Duplicate February submission (should fail)
    const febDup = simulateCreateSubmission('user1', 'circle1', '2024-02', memberships, submissions)
    expect(febDup.success).toBe(false)
  })

  it('enforces one response per prompt within submission', () => {
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const prompts: Prompt[] = [
      {
        _id: 'prompt1',
        circleId: 'circle1',
        text: 'What did you do this month?',
        order: 0,
        active: true,
        createdAt: Date.now(),
      },
    ]
    const responses: Response[] = []

    // First response
    const first = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'First response',
      submissions,
      prompts,
      responses
    )
    expect(first.success).toBe(true)
    responses.push({
      _id: first.responseId!,
      submissionId: 'sub1',
      promptId: 'prompt1',
      text: 'First response',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Second attempt (should update, not create)
    const second = simulateUpdateResponse(
      'user1',
      'sub1',
      'prompt1',
      'Updated response',
      submissions,
      prompts,
      responses
    )
    expect(second.success).toBe(true)
    expect(second.isUpdate).toBe(true)
    expect(second.responseId).toBe(first.responseId)
  })

  it('enforces max 3 media items per response', () => {
    const responses: Response[] = [
      {
        _id: 'resp1',
        submissionId: 'sub1',
        promptId: 'prompt1',
        text: 'My response',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const submissions: Submission[] = [
      {
        _id: 'sub1',
        userId: 'user1',
        circleId: 'circle1',
        cycleId: '2024-02',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    const mediaItems: Media[] = []

    // Add 3 media items
    for (let i = 0; i < 3; i++) {
      const result = simulateAddMedia(
        'user1',
        'resp1',
        i % 2 === 0 ? 'image' : 'video',
        responses,
        submissions,
        mediaItems
      )
      expect(result.success).toBe(true)
      mediaItems.push({
        _id: `media${i + 1}`,
        responseId: 'resp1',
        type: i % 2 === 0 ? 'image' : 'video',
        order: result.order!,
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      })
    }

    // 4th should fail
    const fourth = simulateAddMedia('user1', 'resp1', 'image', responses, submissions, mediaItems)
    expect(fourth.success).toBe(false)
  })
})
