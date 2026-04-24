/**
 * Unit tests for the memberProfile server query's gating + resolution logic.
 *
 * Replicates the core rules from convex/memberProfiles.ts in isolation, in
 * the same shape as test/unit/reactions.test.ts. The risk this locks down is
 * the privacy rule: other members must not see unpublished-cycle entries.
 */
import { describe, it, expect } from 'vitest'

interface Submission {
  userId: string
  circleId: string
  cycleId: string
  submittedAt?: number
}

interface Response {
  submissionId: string
  promptId: string
  text: string
}

interface Newsletter {
  circleId: string
  cycleId: string
  status: 'draft' | 'published' | 'skipped'
}

/** Mirrors the "include this submission at all" predicate in memberProfiles.ts */
function hasContent(submission: Submission, responses: Response[]): boolean {
  if (submission.submittedAt) return true
  return responses.some((r) => r.text.trim().length > 0)
}

/** Mirrors the privacy-rule gate in memberProfiles.ts */
function isEntryVisible(
  submission: Submission,
  viewerId: string,
  newsletters: Newsletter[]
): boolean {
  const published = newsletters.find(
    (n) =>
      n.circleId === submission.circleId &&
      n.cycleId === submission.cycleId &&
      n.status === 'published'
  )
  if (published) return true
  return viewerId === submission.userId
}

/** Mirrors sort newest-first by cycleId (YYYY-MM). */
function sortEntriesDesc<T extends { cycleId: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => (a.cycleId < b.cycleId ? 1 : a.cycleId > b.cycleId ? -1 : 0))
}

/** Mirrors prompt-text resolver with deleted-prompt fallback. */
function resolvePromptText(promptId: string, promptMap: Map<string, string>): string {
  return promptMap.get(promptId) ?? '[Prompt removed]'
}

describe('memberProfile — content filter', () => {
  it('includes a submission with submittedAt set', () => {
    const s: Submission = { userId: 'u1', circleId: 'c1', cycleId: '2026-03', submittedAt: 100 }
    expect(hasContent(s, [])).toBe(true)
  })

  it('includes a never-submitted submission if at least one response has non-empty text', () => {
    const s: Submission = { userId: 'u1', circleId: 'c1', cycleId: '2026-03' }
    const responses: Response[] = [{ submissionId: 's1', promptId: 'p1', text: 'hello' }]
    expect(hasContent(s, responses)).toBe(true)
  })

  it('excludes an empty draft (no submittedAt, only whitespace)', () => {
    const s: Submission = { userId: 'u1', circleId: 'c1', cycleId: '2026-03' }
    const responses: Response[] = [{ submissionId: 's1', promptId: 'p1', text: '   ' }]
    expect(hasContent(s, responses)).toBe(false)
  })
})

describe('memberProfile — privacy gate (AC #7)', () => {
  const baseSub: Submission = {
    userId: 'target',
    circleId: 'c1',
    cycleId: '2026-03',
    submittedAt: 100,
  }

  it('other viewer + published newsletter = visible', () => {
    const newsletters: Newsletter[] = [{ circleId: 'c1', cycleId: '2026-03', status: 'published' }]
    expect(isEntryVisible(baseSub, 'other', newsletters)).toBe(true)
  })

  it('other viewer + draft newsletter = HIDDEN', () => {
    const newsletters: Newsletter[] = [{ circleId: 'c1', cycleId: '2026-03', status: 'draft' }]
    expect(isEntryVisible(baseSub, 'other', newsletters)).toBe(false)
  })

  it('other viewer + no newsletter (in-flight cycle) = HIDDEN', () => {
    expect(isEntryVisible(baseSub, 'other', [])).toBe(false)
  })

  it('target viewer + no newsletter = visible (can always see own drafts)', () => {
    expect(isEntryVisible(baseSub, 'target', [])).toBe(true)
  })

  it('target viewer + draft newsletter = visible', () => {
    const newsletters: Newsletter[] = [{ circleId: 'c1', cycleId: '2026-03', status: 'draft' }]
    expect(isEntryVisible(baseSub, 'target', newsletters)).toBe(true)
  })

  it('other viewer + skipped newsletter (status not published) = HIDDEN', () => {
    const newsletters: Newsletter[] = [{ circleId: 'c1', cycleId: '2026-03', status: 'skipped' }]
    expect(isEntryVisible(baseSub, 'other', newsletters)).toBe(false)
  })
})

describe('memberProfile — entry sort', () => {
  it('sorts cycleIds newest-first (descending string sort of YYYY-MM)', () => {
    const entries = [
      { cycleId: '2026-01' },
      { cycleId: '2026-03' },
      { cycleId: '2025-12' },
      { cycleId: '2026-02' },
    ]
    expect(sortEntriesDesc(entries).map((e) => e.cycleId)).toEqual([
      '2026-03',
      '2026-02',
      '2026-01',
      '2025-12',
    ])
  })
})

describe('memberProfile — prompt text resolver', () => {
  it('returns the known prompt text', () => {
    const map = new Map<string, string>([['p1', 'What did you do this month?']])
    expect(resolvePromptText('p1', map)).toBe('What did you do this month?')
  })

  it('returns [Prompt removed] when the prompt id is unknown', () => {
    const map = new Map<string, string>()
    expect(resolvePromptText('p-deleted', map)).toBe('[Prompt removed]')
  })
})

describe('memberProfile — end-to-end scenario', () => {
  const target = 'target'
  const other = 'other'
  const circleId = 'c1'

  const subs: Submission[] = [
    { userId: target, circleId, cycleId: '2026-01', submittedAt: 1000 },
    { userId: target, circleId, cycleId: '2026-02', submittedAt: 2000 },
    { userId: target, circleId, cycleId: '2026-03' }, // current, in-progress
  ]
  const responses: Response[] = [
    { submissionId: 's1', promptId: 'p1', text: 'jan update' },
    { submissionId: 's2', promptId: 'p1', text: 'feb update' },
    { submissionId: 's3', promptId: 'p1', text: 'in-flight draft' },
  ]
  const newsletters: Newsletter[] = [
    { circleId, cycleId: '2026-01', status: 'published' },
    { circleId, cycleId: '2026-02', status: 'draft' }, // not yet published
  ]

  function simulate(viewerId: string) {
    return subs
      .map((s, i) => ({ sub: s, responseList: [responses[i]!] }))
      .filter(({ sub, responseList }) => hasContent(sub, responseList))
      .filter(({ sub }) => isEntryVisible(sub, viewerId, newsletters))
      .map(({ sub }) => sub.cycleId)
  }

  it('non-target sees only published entries (2 entries, Jan only — Feb is draft, Mar is in-flight)', () => {
    expect(simulate(other)).toEqual(['2026-01'])
  })

  it('target sees everything (Jan, Feb, Mar) including the in-flight draft', () => {
    const result = simulate(target)
    expect(result.sort()).toEqual(['2026-01', '2026-02', '2026-03'])
  })
})
