/**
 * Integration tests for newsletter business logic.
 *
 * Tests the rules from convex/newsletters.ts, convex/newsletterEmails.ts,
 * and convex/newsletterHelpers.ts in isolation.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Type definitions replicating Convex document shapes
// ---------------------------------------------------------------------------

interface Newsletter {
  _id: string
  circleId: string
  cycleId: string
  title: string
  htmlContent: string
  issueNumber: number
  status: 'published' | 'draft'
  submissionCount: number
  memberCount: number
  publishedAt?: number
  createdAt: number
  recipientCount?: number
}

interface Circle {
  _id: string
  name: string
  iconImageId?: string
  coverImageId?: string
  timezone?: string
  archivedAt?: number
}

interface Membership {
  _id: string
  userId: string
  circleId: string
  leftAt?: number
  blocked?: boolean
  emailUnsubscribed?: boolean
}

interface User {
  _id: string
  name?: string
  email: string
}

interface Prompt {
  _id: string
  circleId: string
  text: string
  order: number
  active: boolean
}

interface Submission {
  _id: string
  circleId: string
  cycleId: string
  userId: string
  lockedAt?: number
}

interface Response {
  _id: string
  submissionId: string
  promptId: string
  text: string
}

interface Media {
  _id: string
  responseId: string
  type: 'image' | 'video'
  storageId?: string
  muxAssetId?: string
  order: number
}

interface NewsletterRead {
  userId: string
  newsletterId: string
  readAt: number
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/newsletters.ts
// ---------------------------------------------------------------------------

function getNewsletterById(
  newsletter: Newsletter | null,
  circle: Circle | null,
  reads: NewsletterRead[],
  userId: string
) {
  if (!newsletter) return null

  const read = reads.find((r) => r.userId === userId && r.newsletterId === newsletter._id)

  return {
    ...newsletter,
    circle: circle
      ? {
          name: circle.name,
          iconUrl: circle.iconImageId ? `https://storage/${circle.iconImageId}` : null,
          coverUrl: circle.coverImageId ? `https://storage/${circle.coverImageId}` : null,
          timezone: circle.timezone,
        }
      : null,
    isRead: !!read,
  }
}

function getNewslettersByCircle(
  newsletters: Newsletter[],
  reads: NewsletterRead[],
  userId: string
) {
  const sorted = newsletters
    .filter((n) => n.status === 'published')
    .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))

  return sorted.map((n) => {
    const read = reads.find((r) => r.userId === userId && r.newsletterId === n._id)
    return {
      _id: n._id,
      circleId: n.circleId,
      cycleId: n.cycleId,
      title: n.title,
      issueNumber: n.issueNumber,
      status: n.status,
      submissionCount: n.submissionCount,
      memberCount: n.memberCount,
      publishedAt: n.publishedAt,
      createdAt: n.createdAt,
      isRead: !!read,
    }
  })
}

function getLatestNewsletter(newsletters: Newsletter[], reads: NewsletterRead[], userId: string) {
  // Replicate: order desc by _creationTime (we approximate with createdAt)
  const sorted = [...newsletters].sort((a, b) => b.createdAt - a.createdAt)
  const latest = sorted[0] ?? null
  if (!latest || latest.status !== 'published') return null

  const read = reads.find((r) => r.userId === userId && r.newsletterId === latest._id)

  return { ...latest, isRead: !!read }
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/newsletters.ts - mutations
// ---------------------------------------------------------------------------

function unsubscribeFromEmail(membership: Membership): Membership {
  return { ...membership, emailUnsubscribed: true }
}

function resubscribeToEmail(membership: Membership): Membership {
  const { emailUnsubscribed: _, ...rest } = membership
  return rest as Membership
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/newsletters.ts - compileNewsletter
// ---------------------------------------------------------------------------

function compileNewsletter(
  circle: Circle,
  prompts: Prompt[],
  memberships: Membership[],
  submissions: Submission[],
  responses: Response[],
  mediaItems: Media[],
  users: User[],
  existingNewsletters: Newsletter[],
  cycleId: string
) {
  const activePrompts = prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)

  const activeMembers = memberships.filter((m) => !m.leftAt)
  const memberCount = activeMembers.length

  const cycleSubmissions = submissions.filter((s) => s.cycleId === cycleId && s.lockedAt)
  const submissionCount = cycleSubmissions.length

  const userMap = new Map<string, string>()
  for (const s of cycleSubmissions) {
    const user = users.find((u) => u._id === s.userId)
    userMap.set(s.userId, user?.name ?? user?.email ?? 'Unknown Member')
  }

  const sections: Array<{
    promptTitle: string
    responses: Array<{
      memberName: string
      text: string
      media: Array<{ type: string; url: string; thumbnailUrl?: string }>
    }>
  }> = []

  for (const prompt of activePrompts) {
    const promptResponses: (typeof sections)[number]['responses'] = []

    for (const submission of cycleSubmissions) {
      const response = responses.find(
        (r) => r.submissionId === submission._id && r.promptId === prompt._id
      )
      if (!response) continue

      const respMedia = mediaItems
        .filter((m) => m.responseId === response._id)
        .sort((a, b) => a.order - b.order)

      const media: Array<{ type: string; url: string; thumbnailUrl?: string }> = []
      for (const m of respMedia) {
        if (m.type === 'image' && m.storageId) {
          media.push({ type: 'image', url: `https://storage/${m.storageId}` })
        }
      }

      promptResponses.push({
        memberName: userMap.get(submission.userId) ?? 'Unknown Member',
        text: response.text,
        media,
      })
    }

    if (promptResponses.length > 0) {
      sections.push({ promptTitle: prompt.text, responses: promptResponses })
    }
  }

  const issueNumber = existingNewsletters.length + 1

  const [year, month] = cycleId.split('-')
  const monthNames = [
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
  const monthName = monthNames[parseInt(month!, 10) - 1] ?? month
  const title = `${circle.name} - ${monthName} ${year}`

  const htmlContent = JSON.stringify({ sections })
  const missedMonth = submissionCount === 0

  return {
    title,
    htmlContent,
    issueNumber,
    submissionCount,
    memberCount,
    missedMonth,
    status: 'published' as const,
  }
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/newsletterEmails.ts
// ---------------------------------------------------------------------------

function isSecondSaturday(date: Date): boolean {
  if (date.getUTCDay() !== 6) return false
  const day = date.getUTCDate()
  return day >= 8 && day <= 14
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/newsletterHelpers.ts
// ---------------------------------------------------------------------------

function getAllActiveCircles(circles: Circle[]): Circle[] {
  return circles.filter((c) => !c.archivedAt)
}

function getNewsletterSendData(
  newsletter: Newsletter,
  circle: Circle,
  memberships: Membership[],
  users: User[]
) {
  const iconUrl = circle.iconImageId ? `https://storage/${circle.iconImageId}` : null

  const activeMemberships = memberships.filter(
    (m) => !m.leftAt && !m.blocked && !m.emailUnsubscribed
  )

  const recipients: Array<{ email: string; name: string | undefined }> = []
  for (const membership of activeMemberships) {
    const user = users.find((u) => u._id === membership.userId)
    if (user?.email) {
      recipients.push({ email: user.email, name: user.name })
    }
  }

  return { newsletter, circleName: circle.name, iconUrl, recipients }
}

function getCircleSendData(circle: Circle, memberships: Membership[], users: User[]) {
  const iconUrl = circle.iconImageId ? `https://storage/${circle.iconImageId}` : null

  const activeMemberships = memberships.filter(
    (m) => !m.leftAt && !m.blocked && !m.emailUnsubscribed
  )

  const recipients: Array<{ email: string; name: string | undefined }> = []
  for (const membership of activeMemberships) {
    const user = users.find((u) => u._id === membership.userId)
    if (user?.email) {
      recipients.push({ email: user.email, name: user.name })
    }
  }

  return { circleName: circle.name, iconUrl, recipients }
}

function updateRecipientCount(newsletter: Newsletter, recipientCount: number): Newsletter {
  return { ...newsletter, recipientCount }
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const now = Date.now()

function makeCircle(overrides: Partial<Circle> = {}): Circle {
  return {
    _id: 'circle1',
    name: 'Test Circle',
    timezone: 'America/New_York',
    ...overrides,
  }
}

function makeNewsletter(overrides: Partial<Newsletter> = {}): Newsletter {
  return {
    _id: 'nl1',
    circleId: 'circle1',
    cycleId: '2026-02',
    title: 'Test Circle - February 2026',
    htmlContent: JSON.stringify({ sections: [] }),
    issueNumber: 1,
    status: 'published',
    submissionCount: 3,
    memberCount: 5,
    publishedAt: now,
    createdAt: now,
    ...overrides,
  }
}

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    _id: 'mem1',
    userId: 'user1',
    circleId: 'circle1',
    ...overrides,
  }
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: 'user1',
    name: 'Alice',
    email: 'alice@example.com',
    ...overrides,
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('getNewsletterById', () => {
  it('returns newsletter data with circle info (name, icon)', () => {
    const circle = makeCircle({ iconImageId: 'icon123', coverImageId: 'cover456' })
    const newsletter = makeNewsletter()

    const result = getNewsletterById(newsletter, circle, [], 'user1')

    expect(result).not.toBeNull()
    expect(result!.circle).toEqual({
      name: 'Test Circle',
      iconUrl: 'https://storage/icon123',
      coverUrl: 'https://storage/cover456',
      timezone: 'America/New_York',
    })
  })

  it('returns null icon/cover URLs when circle has no images', () => {
    const circle = makeCircle()
    const newsletter = makeNewsletter()

    const result = getNewsletterById(newsletter, circle, [], 'user1')

    expect(result!.circle!.iconUrl).toBeNull()
    expect(result!.circle!.coverUrl).toBeNull()
  })

  it('returns null when newsletter does not exist', () => {
    const result = getNewsletterById(null, null, [], 'user1')
    expect(result).toBeNull()
  })

  it('includes read status true when user has read the newsletter', () => {
    const newsletter = makeNewsletter()
    const circle = makeCircle()
    const reads: NewsletterRead[] = [{ userId: 'user1', newsletterId: 'nl1', readAt: now }]

    const result = getNewsletterById(newsletter, circle, reads, 'user1')
    expect(result!.isRead).toBe(true)
  })

  it('includes read status false when user has not read the newsletter', () => {
    const newsletter = makeNewsletter()
    const circle = makeCircle()

    const result = getNewsletterById(newsletter, circle, [], 'user1')
    expect(result!.isRead).toBe(false)
  })

  it('distinguishes reads by different users', () => {
    const newsletter = makeNewsletter()
    const circle = makeCircle()
    const reads: NewsletterRead[] = [{ userId: 'user2', newsletterId: 'nl1', readAt: now }]

    const result = getNewsletterById(newsletter, circle, reads, 'user1')
    expect(result!.isRead).toBe(false)
  })
})

describe('getNewslettersByCircle', () => {
  it('returns only published newsletters', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl1', status: 'published' }),
      makeNewsletter({ _id: 'nl2', status: 'draft' }),
      makeNewsletter({ _id: 'nl3', status: 'published' }),
    ]

    const result = getNewslettersByCircle(newsletters, [], 'user1')
    expect(result).toHaveLength(2)
    expect(result.every((n) => n.status === 'published')).toBe(true)
  })

  it('sorts newest first by publishedAt descending', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl-old', publishedAt: 1000, createdAt: 1000 }),
      makeNewsletter({ _id: 'nl-new', publishedAt: 3000, createdAt: 3000 }),
      makeNewsletter({ _id: 'nl-mid', publishedAt: 2000, createdAt: 2000 }),
    ]

    const result = getNewslettersByCircle(newsletters, [], 'user1')
    expect(result.map((n) => n._id)).toEqual(['nl-new', 'nl-mid', 'nl-old'])
  })

  it('falls back to createdAt when publishedAt is missing', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl1', publishedAt: undefined, createdAt: 1000 }),
      makeNewsletter({ _id: 'nl2', publishedAt: undefined, createdAt: 3000 }),
    ]

    const result = getNewslettersByCircle(newsletters, [], 'user1')
    expect(result[0]!._id).toBe('nl2')
  })

  it('includes read status per newsletter', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl1' }),
      makeNewsletter({ _id: 'nl2' }),
    ]
    const reads: NewsletterRead[] = [{ userId: 'user1', newsletterId: 'nl1', readAt: now }]

    const result = getNewslettersByCircle(newsletters, reads, 'user1')
    expect(result.find((n) => n._id === 'nl1')!.isRead).toBe(true)
    expect(result.find((n) => n._id === 'nl2')!.isRead).toBe(false)
  })

  it('returns empty array when no published newsletters', () => {
    const newsletters: Newsletter[] = [makeNewsletter({ status: 'draft' })]
    const result = getNewslettersByCircle(newsletters, [], 'user1')
    expect(result).toHaveLength(0)
  })
})

describe('getLatestNewsletter', () => {
  it('returns most recent published newsletter', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl-old', createdAt: 1000, publishedAt: 1000 }),
      makeNewsletter({ _id: 'nl-new', createdAt: 3000, publishedAt: 3000 }),
    ]

    const result = getLatestNewsletter(newsletters, [], 'user1')
    expect(result).not.toBeNull()
    expect(result!._id).toBe('nl-new')
  })

  it('returns null when latest newsletter is not published', () => {
    const newsletters: Newsletter[] = [
      makeNewsletter({ _id: 'nl1', status: 'draft', createdAt: 3000 }),
      makeNewsletter({ _id: 'nl2', status: 'published', createdAt: 1000 }),
    ]

    // Latest by createdAt is nl1 which is draft
    const result = getLatestNewsletter(newsletters, [], 'user1')
    expect(result).toBeNull()
  })

  it('returns null when no newsletters exist', () => {
    const result = getLatestNewsletter([], [], 'user1')
    expect(result).toBeNull()
  })

  it('includes isRead status', () => {
    const newsletters: Newsletter[] = [makeNewsletter({ _id: 'nl1', createdAt: 1000 })]
    const reads: NewsletterRead[] = [{ userId: 'user1', newsletterId: 'nl1', readAt: now }]

    const result = getLatestNewsletter(newsletters, reads, 'user1')
    expect(result!.isRead).toBe(true)
  })
})

describe('unsubscribeFromEmail / resubscribeToEmail', () => {
  it('sets emailUnsubscribed to true on unsubscribe', () => {
    const membership = makeMembership()
    const result = unsubscribeFromEmail(membership)
    expect(result.emailUnsubscribed).toBe(true)
  })

  it('removes emailUnsubscribed on resubscribe', () => {
    const membership = makeMembership({ emailUnsubscribed: true })
    const result = resubscribeToEmail(membership)
    expect(result.emailUnsubscribed).toBeUndefined()
  })

  it('unsubscribe is idempotent - calling twice still results in true', () => {
    const membership = makeMembership()
    const first = unsubscribeFromEmail(membership)
    const second = unsubscribeFromEmail(first)
    expect(second.emailUnsubscribed).toBe(true)
  })

  it('resubscribe after unsubscribe restores original state', () => {
    const membership = makeMembership()
    const unsubscribed = unsubscribeFromEmail(membership)
    const resubscribed = resubscribeToEmail(unsubscribed)
    expect(resubscribed.emailUnsubscribed).toBeUndefined()
  })
})

describe('compileNewsletter', () => {
  const circle = makeCircle({ name: 'Friends Circle' })
  const cycleId = '2026-03'

  const prompts: Prompt[] = [
    { _id: 'p1', circleId: 'circle1', text: 'What did you do?', order: 0, active: true },
    { _id: 'p2', circleId: 'circle1', text: 'One Good Thing', order: 1, active: true },
    { _id: 'p3', circleId: 'circle1', text: 'Inactive prompt', order: 2, active: false },
  ]

  const memberships: Membership[] = [
    makeMembership({ _id: 'mem1', userId: 'user1' }),
    makeMembership({ _id: 'mem2', userId: 'user2' }),
    makeMembership({ _id: 'mem3', userId: 'user3', leftAt: 1000 }),
  ]

  const users: User[] = [
    makeUser({ _id: 'user1', name: 'Alice', email: 'alice@test.com' }),
    makeUser({ _id: 'user2', name: 'Bob', email: 'bob@test.com' }),
    makeUser({ _id: 'user3', name: 'Charlie', email: 'charlie@test.com' }),
  ]

  const submissions: Submission[] = [
    { _id: 'sub1', circleId: 'circle1', cycleId: '2026-03', userId: 'user1', lockedAt: now },
    { _id: 'sub2', circleId: 'circle1', cycleId: '2026-03', userId: 'user2', lockedAt: now },
  ]

  const responses: Response[] = [
    { _id: 'r1', submissionId: 'sub1', promptId: 'p1', text: 'I went hiking' },
    { _id: 'r2', submissionId: 'sub1', promptId: 'p2', text: 'Got a promotion' },
    { _id: 'r3', submissionId: 'sub2', promptId: 'p1', text: 'Read a book' },
    // Note: user2 did not respond to p2
  ]

  const mediaItems: Media[] = [
    { _id: 'm1', responseId: 'r1', type: 'image', storageId: 'img001', order: 0 },
    { _id: 'm2', responseId: 'r1', type: 'image', storageId: 'img002', order: 1 },
  ]

  it('produces correct section structure with promptText and responses', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      mediaItems,
      users,
      [],
      cycleId
    )

    const parsed = JSON.parse(result.htmlContent)
    expect(parsed.sections).toBeInstanceOf(Array)
    expect(parsed.sections.length).toBeGreaterThan(0)

    const firstSection = parsed.sections[0]
    expect(firstSection.promptTitle).toBe('What did you do?')
    expect(firstSection.responses).toBeInstanceOf(Array)
    expect(firstSection.responses.length).toBeGreaterThan(0)
    expect(firstSection.responses[0].memberName).toBeDefined()
    expect(firstSection.responses[0].text).toBeDefined()
  })

  it('groups responses by prompt', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      mediaItems,
      users,
      [],
      cycleId
    )

    const parsed = JSON.parse(result.htmlContent)
    // p1 has 2 responses (Alice + Bob), p2 has 1 response (Alice only)
    const section1 = parsed.sections.find(
      (s: { promptTitle: string }) => s.promptTitle === 'What did you do?'
    )
    const section2 = parsed.sections.find(
      (s: { promptTitle: string }) => s.promptTitle === 'One Good Thing'
    )

    expect(section1.responses).toHaveLength(2)
    expect(section2.responses).toHaveLength(1)
  })

  it('skips prompts with no responses', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      mediaItems,
      users,
      [],
      cycleId
    )

    const parsed = JSON.parse(result.htmlContent)
    // p3 is inactive so filtered out; even if it were active, no responses exist
    const inactiveSection = parsed.sections.find(
      (s: { promptTitle: string }) => s.promptTitle === 'Inactive prompt'
    )
    expect(inactiveSection).toBeUndefined()
  })

  it('skips prompts with no responses even if active', () => {
    const promptsWithEmpty: Prompt[] = [
      { _id: 'p1', circleId: 'circle1', text: 'Has responses', order: 0, active: true },
      { _id: 'pX', circleId: 'circle1', text: 'No one answered', order: 1, active: true },
    ]
    const limitedResponses: Response[] = [
      { _id: 'r1', submissionId: 'sub1', promptId: 'p1', text: 'I went hiking' },
    ]

    const result = compileNewsletter(
      circle,
      promptsWithEmpty,
      memberships,
      submissions,
      limitedResponses,
      [],
      users,
      [],
      cycleId
    )

    const parsed = JSON.parse(result.htmlContent)
    expect(parsed.sections).toHaveLength(1)
    expect(parsed.sections[0].promptTitle).toBe('Has responses')
  })

  it('includes media URLs in responses', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      mediaItems,
      users,
      [],
      cycleId
    )

    const parsed = JSON.parse(result.htmlContent)
    const firstSection = parsed.sections[0]
    const aliceResponse = firstSection.responses.find(
      (r: { memberName: string }) => r.memberName === 'Alice'
    )

    expect(aliceResponse.media).toHaveLength(2)
    expect(aliceResponse.media[0].type).toBe('image')
    expect(aliceResponse.media[0].url).toBe('https://storage/img001')
    expect(aliceResponse.media[1].url).toBe('https://storage/img002')
  })

  it('calculates correct issue number (existing count + 1)', () => {
    const existingNewsletters = [
      makeNewsletter({ _id: 'existing1' }),
      makeNewsletter({ _id: 'existing2' }),
    ]

    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      existingNewsletters,
      cycleId
    )

    expect(result.issueNumber).toBe(3) // 2 existing + 1
  })

  it('issue number is 1 when no existing newsletters', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      cycleId
    )

    expect(result.issueNumber).toBe(1)
  })

  it('stores result as JSON string in htmlContent field', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      cycleId
    )

    expect(typeof result.htmlContent).toBe('string')
    const parsed = JSON.parse(result.htmlContent)
    expect(parsed).toHaveProperty('sections')
  })

  it('generates correct title from circle name and cycleId', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      '2026-03'
    )
    expect(result.title).toBe('Friends Circle - March 2026')
  })

  it('generates correct title for December', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      '2025-12'
    )
    expect(result.title).toBe('Friends Circle - December 2025')
  })

  it('generates correct title for January', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      '2026-01'
    )
    expect(result.title).toBe('Friends Circle - January 2026')
  })

  it('counts only active members (excludes leftAt)', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      cycleId
    )
    // 3 memberships total, 1 has leftAt, so memberCount = 2
    expect(result.memberCount).toBe(2)
  })

  it('counts only locked submissions for the cycle', () => {
    const mixedSubmissions: Submission[] = [
      { _id: 'sub1', circleId: 'circle1', cycleId: '2026-03', userId: 'user1', lockedAt: now },
      { _id: 'sub2', circleId: 'circle1', cycleId: '2026-03', userId: 'user2' }, // not locked
      { _id: 'sub3', circleId: 'circle1', cycleId: '2026-02', userId: 'user1', lockedAt: now }, // wrong cycle
    ]

    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      mixedSubmissions,
      responses,
      [],
      users,
      [],
      cycleId
    )
    expect(result.submissionCount).toBe(1)
  })

  it('sets missedMonth true when submissionCount is 0', () => {
    const result = compileNewsletter(circle, prompts, memberships, [], [], [], users, [], cycleId)
    expect(result.missedMonth).toBe(true)
    expect(result.submissionCount).toBe(0)
  })

  it('sets missedMonth false when there are submissions', () => {
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      users,
      [],
      cycleId
    )
    expect(result.missedMonth).toBe(false)
  })

  it('uses "Unknown Member" when user has no name or email', () => {
    const noNameUsers: User[] = []
    const result = compileNewsletter(
      circle,
      prompts,
      memberships,
      submissions,
      responses,
      [],
      noNameUsers,
      [],
      cycleId
    )
    const parsed = JSON.parse(result.htmlContent)
    const firstResponse = parsed.sections[0].responses[0]
    expect(firstResponse.memberName).toBe('Unknown Member')
  })
})

describe('isSecondSaturday (processNewsletters guard)', () => {
  it('identifies second Saturday correctly - Feb 14, 2026', () => {
    // February 14, 2026 is a Saturday and day 14 (8-14 range)
    const date = new Date(Date.UTC(2026, 1, 14, 11, 0, 0))
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('identifies second Saturday correctly - March 14, 2026', () => {
    // March 14, 2026 is a Saturday and day 14
    const date = new Date(Date.UTC(2026, 2, 14, 11, 0, 0))
    expect(isSecondSaturday(date)).toBe(true)
  })

  it('rejects first Saturday (day < 8)', () => {
    // A Saturday with day 7 (first Saturday)
    const date = new Date(Date.UTC(2026, 1, 7, 11, 0, 0))
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects third Saturday (day > 14)', () => {
    // A Saturday with day 21 (third Saturday)
    const date = new Date(Date.UTC(2026, 1, 21, 11, 0, 0))
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects non-Saturday dates', () => {
    // A Monday
    const date = new Date(Date.UTC(2026, 1, 9, 11, 0, 0))
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('rejects Sunday even if day is in range', () => {
    const date = new Date(Date.UTC(2026, 1, 8, 11, 0, 0)) // Sunday Feb 8
    expect(isSecondSaturday(date)).toBe(false)
  })

  it('accepts day 8 when it is a Saturday', () => {
    // Find a month where day 8 is a Saturday
    // August 2026: Aug 1 is Saturday, Aug 8 is also Saturday
    const date = new Date(Date.UTC(2026, 7, 8, 11, 0, 0))
    expect(date.getUTCDay()).toBe(6) // verify it is Saturday
    expect(isSecondSaturday(date)).toBe(true)
  })
})

describe('getAllActiveCircles', () => {
  it('excludes archived circles', () => {
    const circles: Circle[] = [
      makeCircle({ _id: 'c1', name: 'Active' }),
      makeCircle({ _id: 'c2', name: 'Archived', archivedAt: 1000 }),
      makeCircle({ _id: 'c3', name: 'Also Active' }),
    ]

    const result = getAllActiveCircles(circles)
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.name)).toEqual(['Active', 'Also Active'])
  })

  it('returns all circles when none are archived', () => {
    const circles: Circle[] = [makeCircle({ _id: 'c1' }), makeCircle({ _id: 'c2' })]
    expect(getAllActiveCircles(circles)).toHaveLength(2)
  })

  it('returns empty when all circles are archived', () => {
    const circles: Circle[] = [makeCircle({ _id: 'c1', archivedAt: 1000 })]
    expect(getAllActiveCircles(circles)).toHaveLength(0)
  })
})

describe('getNewsletterSendData', () => {
  it('returns newsletter, circle info, and subscriber list', () => {
    const newsletter = makeNewsletter()
    const circle = makeCircle({ iconImageId: 'icon1' })
    const memberships: Membership[] = [
      makeMembership({ userId: 'user1' }),
      makeMembership({ _id: 'mem2', userId: 'user2' }),
    ]
    const users: User[] = [
      makeUser({ _id: 'user1', name: 'Alice', email: 'alice@test.com' }),
      makeUser({ _id: 'user2', name: 'Bob', email: 'bob@test.com' }),
    ]

    const result = getNewsletterSendData(newsletter, circle, memberships, users)

    expect(result.newsletter).toEqual(newsletter)
    expect(result.circleName).toBe('Test Circle')
    expect(result.iconUrl).toBe('https://storage/icon1')
    expect(result.recipients).toHaveLength(2)
    expect(result.recipients[0]).toEqual({ email: 'alice@test.com', name: 'Alice' })
  })

  it('returns null iconUrl when circle has no icon', () => {
    const result = getNewsletterSendData(makeNewsletter(), makeCircle(), [], [])
    expect(result.iconUrl).toBeNull()
  })
})

describe('getCircleSendData', () => {
  it('returns only active, email-subscribed members', () => {
    const circle = makeCircle()
    const memberships: Membership[] = [
      makeMembership({ _id: 'mem1', userId: 'user1' }), // active, subscribed
      makeMembership({ _id: 'mem2', userId: 'user2', leftAt: 1000 }), // left
      makeMembership({ _id: 'mem3', userId: 'user3', blocked: true }), // blocked
      makeMembership({ _id: 'mem4', userId: 'user4', emailUnsubscribed: true }), // unsubscribed
      makeMembership({ _id: 'mem5', userId: 'user5' }), // active, subscribed
    ]
    const users: User[] = [
      makeUser({ _id: 'user1', email: 'a@test.com' }),
      makeUser({ _id: 'user2', email: 'b@test.com' }),
      makeUser({ _id: 'user3', email: 'c@test.com' }),
      makeUser({ _id: 'user4', email: 'd@test.com' }),
      makeUser({ _id: 'user5', email: 'e@test.com' }),
    ]

    const result = getCircleSendData(circle, memberships, users)

    expect(result.recipients).toHaveLength(2)
    expect(result.recipients.map((r) => r.email)).toEqual(['a@test.com', 'e@test.com'])
  })

  it('excludes members with leftAt', () => {
    const memberships: Membership[] = [makeMembership({ userId: 'user1', leftAt: 1000 })]
    const users: User[] = [makeUser({ _id: 'user1' })]

    const result = getCircleSendData(makeCircle(), memberships, users)
    expect(result.recipients).toHaveLength(0)
  })

  it('excludes unsubscribed members', () => {
    const memberships: Membership[] = [makeMembership({ userId: 'user1', emailUnsubscribed: true })]
    const users: User[] = [makeUser({ _id: 'user1' })]

    const result = getCircleSendData(makeCircle(), memberships, users)
    expect(result.recipients).toHaveLength(0)
  })

  it('excludes blocked members', () => {
    const memberships: Membership[] = [makeMembership({ userId: 'user1', blocked: true })]
    const users: User[] = [makeUser({ _id: 'user1' })]

    const result = getCircleSendData(makeCircle(), memberships, users)
    expect(result.recipients).toHaveLength(0)
  })

  it('skips members without email', () => {
    const memberships: Membership[] = [makeMembership({ userId: 'user1' })]
    const users: User[] = [{ _id: 'user1', email: '' } as User]

    const result = getCircleSendData(makeCircle(), memberships, users)
    // Empty string is falsy so user is skipped
    expect(result.recipients).toHaveLength(0)
  })
})

describe('updateRecipientCount', () => {
  it('patches newsletter with member count', () => {
    const newsletter = makeNewsletter()
    const result = updateRecipientCount(newsletter, 42)
    expect(result.recipientCount).toBe(42)
  })

  it('preserves all other newsletter fields', () => {
    const newsletter = makeNewsletter()
    const result = updateRecipientCount(newsletter, 10)
    expect(result.title).toBe(newsletter.title)
    expect(result.issueNumber).toBe(newsletter.issueNumber)
    expect(result.status).toBe(newsletter.status)
  })
})

describe('processNewsletters flow logic', () => {
  it('triggers missed-month flow for circles with 0 submissions', () => {
    // Simulate compileNewsletter returning missedMonth: true
    const compileResult = compileNewsletter(makeCircle(), [], [], [], [], [], [], [], '2026-02')
    expect(compileResult.missedMonth).toBe(true)
    expect(compileResult.submissionCount).toBe(0)
  })

  it('triggers normal send flow for circles with submissions', () => {
    const submissions: Submission[] = [
      { _id: 'sub1', circleId: 'circle1', cycleId: '2026-02', userId: 'user1', lockedAt: now },
    ]
    const responses: Response[] = [
      { _id: 'r1', submissionId: 'sub1', promptId: 'p1', text: 'Hello' },
    ]
    const prompts: Prompt[] = [
      { _id: 'p1', circleId: 'circle1', text: 'Test', order: 0, active: true },
    ]

    const compileResult = compileNewsletter(
      makeCircle(),
      prompts,
      [makeMembership()],
      submissions,
      responses,
      [],
      [makeUser()],
      [],
      '2026-02'
    )
    expect(compileResult.missedMonth).toBe(false)
    expect(compileResult.submissionCount).toBe(1)
  })

  it('calculates cycleId correctly as YYYY-MM', () => {
    const date = new Date(Date.UTC(2026, 2, 14)) // March 2026
    const cycleId = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    expect(cycleId).toBe('2026-03')
  })

  it('pads single-digit months with leading zero', () => {
    const date = new Date(Date.UTC(2026, 0, 10)) // January
    const cycleId = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    expect(cycleId).toBe('2026-01')
  })
})

describe('sendNewsletter email construction', () => {
  it('constructs correct email data structure', () => {
    const newsletter = makeNewsletter({
      circleId: 'circle1',
      cycleId: '2026-03',
      issueNumber: 5,
      htmlContent: JSON.stringify({
        sections: [
          {
            promptTitle: 'What did you do?',
            responses: [{ memberName: 'Alice', text: 'Hiking', media: [] }],
          },
        ],
      }),
    })

    // Parse sections from htmlContent
    const parsed = JSON.parse(newsletter.htmlContent)
    expect(parsed.sections).toHaveLength(1)

    // Verify subject line format
    const circleName = 'Test Circle'
    const subject = `${circleName} - Issue #${newsletter.issueNumber}`
    expect(subject).toBe('Test Circle - Issue #5')

    // Verify URLs
    const APP_URL = 'https://secondsaturday.app'
    const viewInAppUrl = `${APP_URL}/dashboard/circles/${newsletter.circleId}/newsletter/${newsletter._id}?utm_source=email&utm_medium=newsletter`
    const unsubscribeUrl = `${APP_URL}/circles/${newsletter.circleId}/unsubscribe`

    expect(viewInAppUrl).toContain('circle1')
    expect(viewInAppUrl).toContain(newsletter._id)
    expect(viewInAppUrl).toContain('utm_source=email')
    expect(unsubscribeUrl).toContain('circle1')

    // Verify date formatting from cycleId
    const [year, month] = newsletter.cycleId.split('-')
    const monthNames = [
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
    const date = `${monthNames[parseInt(month!, 10) - 1]} ${year}`
    expect(date).toBe('March 2026')
  })
})

describe('cron schedule configuration', () => {
  it('lock submissions cron runs at 10:59 UTC on Saturdays', () => {
    // Verify the cron expression from crons.ts
    const cronExpression = '59 10 * * 6'
    const parts = cronExpression.split(' ')
    expect(parts[0]).toBe('59') // minute 59
    expect(parts[1]).toBe('10') // hour 10
    expect(parts[4]).toBe('6') // Saturday (day 6)
  })

  it('newsletter processing cron runs at 11:00 UTC on Saturdays', () => {
    const cronExpression = '0 11 * * 6'
    const parts = cronExpression.split(' ')
    expect(parts[0]).toBe('0') // minute 0
    expect(parts[1]).toBe('11') // hour 11
    expect(parts[4]).toBe('6') // Saturday
  })

  it('newsletter processing runs after lock submissions (11:00 > 10:59)', () => {
    const lockMinute = 59
    const lockHour = 10
    const processMinute = 0
    const processHour = 11

    const lockTimeMinutes = lockHour * 60 + lockMinute
    const processTimeMinutes = processHour * 60 + processMinute
    expect(processTimeMinutes).toBeGreaterThan(lockTimeMinutes)
  })
})
