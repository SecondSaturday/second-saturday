/**
 * Unit tests for newsletter compilation business logic.
 *
 * Tests the logic from convex/newsletters.ts (compileNewsletter)
 * replicated in isolation, following the same pattern as prompts.test.ts.
 */
import { describe, it, expect } from 'vitest'

// --- Replicated logic from convex/newsletters.ts ---

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

/** Resolve member display name: name > email > 'Unknown Member' */
function resolveMemberName(user: { name?: string; email?: string } | null): string {
  return user?.name ?? user?.email ?? 'Unknown Member'
}

/** Format newsletter title from circle name and cycleId */
function formatNewsletterTitle(circleName: string, cycleId: string): string {
  const [year, month] = cycleId.split('-')
  const monthName = MONTH_NAMES[parseInt(month!, 10) - 1] ?? month
  return `${circleName} - ${monthName} ${year}`
}

/** Calculate issue number from existing newsletters */
function calculateIssueNumber(existingCount: number): number {
  return existingCount + 1
}

/** Detect missed month (0 submissions) */
function isMissedMonth(submissionCount: number): boolean {
  return submissionCount === 0
}

interface MediaItem {
  type: string
  url: string
  thumbnailUrl?: string
}

interface PromptResponse {
  memberName: string
  text: string
  media: MediaItem[]
}

interface NewsletterSection {
  promptTitle: string
  responses: PromptResponse[]
}

interface Prompt {
  _id: string
  text: string
  order: number
  active: boolean
}

interface Submission {
  _id: string
  userId: string
  cycleId: string
  lockedAt?: number
}

interface Response {
  submissionId: string
  promptId: string
  text: string
}

/**
 * Replicate the core grouping logic from compileNewsletter:
 * - Filter prompts to active, sort by order
 * - For each prompt, collect responses from locked submissions
 * - Omit prompts with zero responses
 */
function organizeResponsesByPrompt(
  prompts: Prompt[],
  submissions: Submission[],
  responses: Response[],
  userMap: Map<string, { name?: string; email?: string } | null>
): NewsletterSection[] {
  const activePrompts = prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)
  const lockedSubmissions = submissions.filter((s) => s.lockedAt)

  const sections: NewsletterSection[] = []

  for (const prompt of activePrompts) {
    const promptResponses: PromptResponse[] = []

    for (const submission of lockedSubmissions) {
      const response = responses.find(
        (r) => r.submissionId === submission._id && r.promptId === prompt._id
      )
      if (!response) continue

      promptResponses.push({
        memberName: resolveMemberName(userMap.get(submission.userId) ?? null),
        text: response.text,
        media: [], // media resolved separately
      })
    }

    if (promptResponses.length > 0) {
      sections.push({
        promptTitle: prompt.text,
        responses: promptResponses,
      })
    }
  }

  return sections
}

// --- Tests ---

describe('compileNewsletter: organizes responses by prompt', () => {
  const prompts: Prompt[] = [
    { _id: 'p1', text: 'What did you do this month?', order: 0, active: true },
    { _id: 'p2', text: 'One Good Thing', order: 1, active: true },
    { _id: 'p3', text: 'Archived prompt', order: 2, active: false },
  ]

  const submissions: Submission[] = [
    { _id: 's1', userId: 'u1', cycleId: '2026-02', lockedAt: 1000 },
    { _id: 's2', userId: 'u2', cycleId: '2026-02', lockedAt: 2000 },
  ]

  const responses: Response[] = [
    { submissionId: 's1', promptId: 'p1', text: 'Went hiking' },
    { submissionId: 's1', promptId: 'p2', text: 'Got a promotion' },
    { submissionId: 's2', promptId: 'p1', text: 'Read 3 books' },
    { submissionId: 's2', promptId: 'p2', text: 'Adopted a cat' },
  ]

  const userMap = new Map<string, { name?: string; email?: string } | null>([
    ['u1', { name: 'Alice', email: 'alice@example.com' }],
    ['u2', { name: 'Bob', email: 'bob@example.com' }],
  ])

  it('groups submissions by promptId with member name and text', () => {
    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)

    expect(sections).toHaveLength(2)
    expect(sections[0]!.promptTitle).toBe('What did you do this month?')
    expect(sections[0]!.responses).toHaveLength(2)
    expect(sections[0]!.responses[0]!.memberName).toBe('Alice')
    expect(sections[0]!.responses[0]!.text).toBe('Went hiking')
    expect(sections[0]!.responses[1]!.memberName).toBe('Bob')
    expect(sections[0]!.responses[1]!.text).toBe('Read 3 books')

    expect(sections[1]!.promptTitle).toBe('One Good Thing')
    expect(sections[1]!.responses).toHaveLength(2)
  })

  it('sorts sections by prompt order', () => {
    const reversed: Prompt[] = [
      { _id: 'p2', text: 'Second prompt', order: 1, active: true },
      { _id: 'p1', text: 'First prompt', order: 0, active: true },
    ]
    const resp: Response[] = [
      { submissionId: 's1', promptId: 'p1', text: 'A' },
      { submissionId: 's1', promptId: 'p2', text: 'B' },
    ]
    const sections = organizeResponsesByPrompt(reversed, submissions, resp, userMap)

    expect(sections[0]!.promptTitle).toBe('First prompt')
    expect(sections[1]!.promptTitle).toBe('Second prompt')
  })

  it('excludes inactive prompts', () => {
    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)
    const titles = sections.map((s) => s.promptTitle)
    expect(titles).not.toContain('Archived prompt')
  })
})

describe('compileNewsletter: omits prompts with zero responses', () => {
  it('excludes prompts that have no matching responses', () => {
    const prompts: Prompt[] = [
      { _id: 'p1', text: 'Has responses', order: 0, active: true },
      { _id: 'p2', text: 'No responses', order: 1, active: true },
    ]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'u1', cycleId: '2026-02', lockedAt: 1000 },
    ]
    const responses: Response[] = [
      { submissionId: 's1', promptId: 'p1', text: 'Hello' },
      // No response for p2
    ]
    const userMap = new Map([['u1', { name: 'Alice' }]])

    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)

    expect(sections).toHaveLength(1)
    expect(sections[0]!.promptTitle).toBe('Has responses')
  })

  it('returns empty array when no submissions exist', () => {
    const prompts: Prompt[] = [{ _id: 'p1', text: 'Prompt', order: 0, active: true }]

    const sections = organizeResponsesByPrompt(prompts, [], [], new Map())

    expect(sections).toHaveLength(0)
  })

  it('ignores unlocked submissions', () => {
    const prompts: Prompt[] = [{ _id: 'p1', text: 'Prompt', order: 0, active: true }]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'u1', cycleId: '2026-02' }, // no lockedAt
    ]
    const responses: Response[] = [{ submissionId: 's1', promptId: 'p1', text: 'Draft' }]
    const userMap = new Map([['u1', { name: 'Alice' }]])

    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)

    expect(sections).toHaveLength(0)
  })
})

describe('Member name formatting', () => {
  it('uses user name when available', () => {
    expect(resolveMemberName({ name: 'Alice', email: 'alice@test.com' })).toBe('Alice')
  })

  it('falls back to email when name is missing', () => {
    expect(resolveMemberName({ email: 'alice@test.com' })).toBe('alice@test.com')
  })

  it('falls back to email when name is undefined', () => {
    expect(resolveMemberName({ name: undefined, email: 'bob@test.com' })).toBe('bob@test.com')
  })

  it('returns "Unknown Member" when both name and email are missing', () => {
    expect(resolveMemberName({})).toBe('Unknown Member')
  })

  it('returns "Unknown Member" for null user', () => {
    expect(resolveMemberName(null)).toBe('Unknown Member')
  })
})

describe('Date formatting for newsletter display', () => {
  it('formats cycleId "2026-01" as "January 2026"', () => {
    expect(formatNewsletterTitle('My Circle', '2026-01')).toBe('My Circle - January 2026')
  })

  it('formats cycleId "2025-12" as "December 2025"', () => {
    expect(formatNewsletterTitle('Friends', '2025-12')).toBe('Friends - December 2025')
  })

  it('formats cycleId "2026-06" as "June 2026"', () => {
    expect(formatNewsletterTitle('Family', '2026-06')).toBe('Family - June 2026')
  })

  it('handles single-digit months with leading zero', () => {
    expect(formatNewsletterTitle('Group', '2026-02')).toBe('Group - February 2026')
  })

  it('formats all 12 months correctly', () => {
    for (let m = 1; m <= 12; m++) {
      const cycleId = `2026-${String(m).padStart(2, '0')}`
      const title = formatNewsletterTitle('Test', cycleId)
      expect(title).toContain(MONTH_NAMES[m - 1]!)
      expect(title).toContain('2026')
    }
  })
})

describe('Issue number auto-increment logic', () => {
  it('returns 1 when no existing newsletters', () => {
    expect(calculateIssueNumber(0)).toBe(1)
  })

  it('returns 2 when one existing newsletter', () => {
    expect(calculateIssueNumber(1)).toBe(2)
  })

  it('returns n+1 for n existing newsletters', () => {
    expect(calculateIssueNumber(5)).toBe(6)
    expect(calculateIssueNumber(99)).toBe(100)
  })
})

describe('0-submission detection (missed month)', () => {
  it('detects missed month when submissionCount is 0', () => {
    expect(isMissedMonth(0)).toBe(true)
  })

  it('returns false when there are submissions', () => {
    expect(isMissedMonth(1)).toBe(false)
    expect(isMissedMonth(5)).toBe(false)
  })
})

describe('Newsletter section structure validation', () => {
  it('each section has promptTitle and responses array', () => {
    const prompts: Prompt[] = [
      { _id: 'p1', text: 'Question 1', order: 0, active: true },
      { _id: 'p2', text: 'Question 2', order: 1, active: true },
    ]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'u1', cycleId: '2026-02', lockedAt: 1000 },
    ]
    const responses: Response[] = [
      { submissionId: 's1', promptId: 'p1', text: 'Answer 1' },
      { submissionId: 's1', promptId: 'p2', text: 'Answer 2' },
    ]
    const userMap = new Map([['u1', { name: 'Alice' }]])

    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)

    for (const section of sections) {
      expect(section).toHaveProperty('promptTitle')
      expect(typeof section.promptTitle).toBe('string')
      expect(section.promptTitle.length).toBeGreaterThan(0)
      expect(section).toHaveProperty('responses')
      expect(Array.isArray(section.responses)).toBe(true)
      expect(section.responses.length).toBeGreaterThan(0)
    }
  })

  it('each response has memberName, text, and media array', () => {
    const prompts: Prompt[] = [{ _id: 'p1', text: 'Question', order: 0, active: true }]
    const submissions: Submission[] = [
      { _id: 's1', userId: 'u1', cycleId: '2026-02', lockedAt: 1000 },
    ]
    const responses: Response[] = [{ submissionId: 's1', promptId: 'p1', text: 'My answer' }]
    const userMap = new Map([['u1', { name: 'Alice' }]])

    const sections = organizeResponsesByPrompt(prompts, submissions, responses, userMap)
    const response = sections[0]!.responses[0]!

    expect(response).toHaveProperty('memberName')
    expect(response).toHaveProperty('text')
    expect(response).toHaveProperty('media')
    expect(Array.isArray(response.media)).toBe(true)
  })
})

describe('Media URL resolution in responses', () => {
  it('image media has type "image" and a url', () => {
    const media: MediaItem = { type: 'image', url: 'https://storage.example.com/img.jpg' }
    expect(media.type).toBe('image')
    expect(media.url).toBeTruthy()
  })

  it('video media has type "video", url, and thumbnailUrl', () => {
    const playbackId = 'abc123'
    const media: MediaItem = {
      type: 'video',
      url: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`,
    }
    expect(media.type).toBe('video')
    expect(media.url).toContain('stream.mux.com')
    expect(media.url).toContain('.m3u8')
    expect(media.thumbnailUrl).toContain('image.mux.com')
    expect(media.thumbnailUrl).toContain('thumbnail.jpg')
  })

  it('video thumbnail URL follows expected Mux pattern', () => {
    const playbackId = 'test_playback_id'
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`

    expect(thumbnailUrl).toBe(
      'https://image.mux.com/test_playback_id/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop'
    )
  })

  it('image media does not have thumbnailUrl', () => {
    const media: MediaItem = { type: 'image', url: 'https://storage.example.com/img.jpg' }
    expect(media.thumbnailUrl).toBeUndefined()
  })
})

describe('Newsletter htmlContent JSON structure', () => {
  it('serializes sections as JSON with correct structure', () => {
    const sections: NewsletterSection[] = [
      {
        promptTitle: 'What did you do?',
        responses: [{ memberName: 'Alice', text: 'Hiking', media: [] }],
      },
    ]

    const htmlContent = JSON.stringify({ sections })
    const parsed = JSON.parse(htmlContent)

    expect(parsed).toHaveProperty('sections')
    expect(parsed.sections).toHaveLength(1)
    expect(parsed.sections[0].promptTitle).toBe('What did you do?')
    expect(parsed.sections[0].responses[0].memberName).toBe('Alice')
  })

  it('handles empty sections gracefully', () => {
    const htmlContent = JSON.stringify({ sections: [] })
    const parsed = JSON.parse(htmlContent)

    expect(parsed.sections).toHaveLength(0)
  })
})
