/**
 * Unit tests for reaction aggregation + toggle semantics.
 *
 * Replicates the core logic from convex/reactions.ts in isolation, following
 * the same pattern as test/unit/newsletter.test.ts.
 */
import { describe, it, expect } from 'vitest'

interface ReactionRow {
  responseId: string
  userId: string
  emoji: string
}

/** Returns { added: boolean } and the mutated rows list. */
function toggle(rows: ReactionRow[], row: ReactionRow): { rows: ReactionRow[]; added: boolean } {
  const idx = rows.findIndex(
    (r) => r.responseId === row.responseId && r.userId === row.userId && r.emoji === row.emoji
  )
  if (idx >= 0) {
    const next = rows.slice()
    next.splice(idx, 1)
    return { rows: next, added: false }
  }
  return { rows: [...rows, row], added: true }
}

/** Remove semantics: delete if exists, no-op otherwise. */
function removeRow(
  rows: ReactionRow[],
  row: ReactionRow
): { rows: ReactionRow[]; removed: boolean } {
  const idx = rows.findIndex(
    (r) => r.responseId === row.responseId && r.userId === row.userId && r.emoji === row.emoji
  )
  if (idx < 0) return { rows, removed: false }
  const next = rows.slice()
  next.splice(idx, 1)
  return { rows: next, removed: true }
}

function aggregateForResponse(
  rows: ReactionRow[],
  responseId: string,
  currentUserId: string
): Array<{ emoji: string; count: number; reactedByMe: boolean }> {
  const byEmoji = new Map<string, { count: number; reactedByMe: boolean }>()
  for (const r of rows) {
    if (r.responseId !== responseId) continue
    const agg = byEmoji.get(r.emoji) ?? { count: 0, reactedByMe: false }
    agg.count += 1
    if (r.userId === currentUserId) agg.reactedByMe = true
    byEmoji.set(r.emoji, agg)
  }
  return Array.from(byEmoji.entries()).map(([emoji, agg]) => ({ emoji, ...agg }))
}

describe('reactions toggle semantics', () => {
  it('adds a reaction when not present', () => {
    const result = toggle([], { responseId: 'r1', userId: 'u1', emoji: '❤️' })
    expect(result.added).toBe(true)
    expect(result.rows).toHaveLength(1)
  })

  it('removes the reaction when tapped a second time by the same user', () => {
    const start: ReactionRow[] = [{ responseId: 'r1', userId: 'u1', emoji: '❤️' }]
    const result = toggle(start, { responseId: 'r1', userId: 'u1', emoji: '❤️' })
    expect(result.added).toBe(false)
    expect(result.rows).toHaveLength(0)
  })

  it('is per-(response,user,emoji) triple — different emoji from same user does not toggle off', () => {
    const start: ReactionRow[] = [{ responseId: 'r1', userId: 'u1', emoji: '❤️' }]
    const result = toggle(start, { responseId: 'r1', userId: 'u1', emoji: '🔥' })
    expect(result.added).toBe(true)
    expect(result.rows).toHaveLength(2)
  })

  it('removeReaction is a no-op when nothing exists', () => {
    const result = removeRow([], { responseId: 'r1', userId: 'u1', emoji: '❤️' })
    expect(result.removed).toBe(false)
    expect(result.rows).toHaveLength(0)
  })

  it('removeReaction deletes the matching row', () => {
    const start: ReactionRow[] = [
      { responseId: 'r1', userId: 'u1', emoji: '❤️' },
      { responseId: 'r1', userId: 'u2', emoji: '❤️' },
    ]
    const result = removeRow(start, { responseId: 'r1', userId: 'u1', emoji: '❤️' })
    expect(result.removed).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.userId).toBe('u2')
  })
})

describe('reactions aggregation', () => {
  it('groups rows by emoji, counts and flags reactedByMe for current user', () => {
    const rows: ReactionRow[] = [
      { responseId: 'r1', userId: 'u1', emoji: '❤️' },
      { responseId: 'r1', userId: 'u2', emoji: '❤️' },
      { responseId: 'r1', userId: 'u1', emoji: '🔥' },
      { responseId: 'r2', userId: 'u3', emoji: '🙌' },
    ]
    const out = aggregateForResponse(rows, 'r1', 'u1').sort((a, b) =>
      a.emoji.localeCompare(b.emoji)
    )
    expect(out).toHaveLength(2)
    const heart = out.find((x) => x.emoji === '❤️')!
    expect(heart.count).toBe(2)
    expect(heart.reactedByMe).toBe(true)
    const fire = out.find((x) => x.emoji === '🔥')!
    expect(fire.count).toBe(1)
    expect(fire.reactedByMe).toBe(true)
  })

  it('reactedByMe is false when only other users reacted', () => {
    const rows: ReactionRow[] = [
      { responseId: 'r1', userId: 'u2', emoji: '❤️' },
      { responseId: 'r1', userId: 'u3', emoji: '❤️' },
    ]
    const out = aggregateForResponse(rows, 'r1', 'u1')
    expect(out).toHaveLength(1)
    expect(out[0]!.count).toBe(2)
    expect(out[0]!.reactedByMe).toBe(false)
  })

  it('returns empty when there are no rows for the response', () => {
    expect(aggregateForResponse([], 'r1', 'u1')).toEqual([])
  })
})
