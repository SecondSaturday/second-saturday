/**
 * Unit tests for comment validation, authorization, and listing semantics.
 *
 * Replicates the core logic from convex/comments.ts in isolation, following
 * the same pattern as test/unit/reactions.test.ts.
 */
import { describe, it, expect } from 'vitest'

const MAX_COMMENT_TEXT_LENGTH = 500

interface CommentRow {
  _id: string
  responseId: string
  userId: string
  text: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

interface MembershipRow {
  userId: string
  circleId: string
  role: 'admin' | 'member'
  blocked?: boolean
  leftAt?: number
}

interface ResponseRow {
  _id: string
  submissionId: string
}

interface SubmissionRow {
  _id: string
  circleId: string
}

function validateCommentText(raw: string): string {
  const text = raw.trim()
  if (text.length === 0) throw new Error('empty')
  if (text.length > MAX_COMMENT_TEXT_LENGTH) throw new Error('too-long')
  return text
}

function getCircleIdForResponse(
  responseId: string,
  responses: ResponseRow[],
  submissions: SubmissionRow[]
): string {
  const r = responses.find((x) => x._id === responseId)
  if (!r) throw new Error('Response not found')
  const s = submissions.find((x) => x._id === r.submissionId)
  if (!s) throw new Error('Submission not found')
  return s.circleId
}

function getActiveMembership(
  userId: string,
  circleId: string,
  memberships: MembershipRow[]
): MembershipRow | null {
  const m = memberships.find((x) => x.userId === userId && x.circleId === circleId)
  if (!m || m.leftAt) return null
  return m
}

function requireMembership(
  userId: string,
  circleId: string,
  memberships: MembershipRow[]
): MembershipRow {
  const m = getActiveMembership(userId, circleId, memberships)
  if (!m) throw new Error('Not a member of this circle')
  return m
}

interface World {
  comments: CommentRow[]
  responses: ResponseRow[]
  submissions: SubmissionRow[]
  memberships: MembershipRow[]
  now: number
  idSeq: number
}

function nextId(world: World, prefix: string): string {
  world.idSeq += 1
  return `${prefix}_${world.idSeq}`
}

function addComment(
  world: World,
  args: { responseId: string; userId: string; text: string }
): { commentId: string; createdAt: number } {
  const text = validateCommentText(args.text)
  const circleId = getCircleIdForResponse(args.responseId, world.responses, world.submissions)
  requireMembership(args.userId, circleId, world.memberships)
  const _id = nextId(world, 'c')
  const now = world.now
  world.comments.push({
    _id,
    responseId: args.responseId,
    userId: args.userId,
    text,
    createdAt: now,
    updatedAt: now,
  })
  return { commentId: _id, createdAt: now }
}

function editComment(
  world: World,
  args: { commentId: string; userId: string; text: string }
): void {
  const text = validateCommentText(args.text)
  const c = world.comments.find((x) => x._id === args.commentId)
  if (!c) throw new Error('Comment not found')
  if (c.userId !== args.userId) throw new Error('Only the author can edit this comment')
  if (c.deletedAt) throw new Error('Cannot edit a deleted comment')
  const circleId = getCircleIdForResponse(c.responseId, world.responses, world.submissions)
  requireMembership(args.userId, circleId, world.memberships)
  c.text = text
  c.updatedAt = world.now + 1
}

function deleteComment(world: World, args: { commentId: string; userId: string }): void {
  const c = world.comments.find((x) => x._id === args.commentId)
  if (!c) throw new Error('Comment not found')
  if (c.deletedAt) return // idempotent
  const circleId = getCircleIdForResponse(c.responseId, world.responses, world.submissions)
  requireMembership(args.userId, circleId, world.memberships)
  const isAuthor = c.userId === args.userId
  const callerMembership = getActiveMembership(args.userId, circleId, world.memberships)
  const isAdmin =
    !!callerMembership && callerMembership.role === 'admin' && !callerMembership.blocked
  if (!isAuthor && !isAdmin) {
    throw new Error('Only the author or a circle admin can delete this comment')
  }
  c.deletedAt = world.now
}

interface ListedComment {
  commentId: string
  userId: string
  text: string
  isDeleted: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: number
}

function listCommentsForResponses(
  world: World,
  args: { responseIds: string[]; callerId: string }
): Record<string, ListedComment[]> {
  if (args.responseIds.length === 0) return {}
  if (args.responseIds.length > 200) throw new Error('Too many responseIds (max 200)')

  const result: Record<string, ListedComment[]> = {}
  for (const rid of args.responseIds) {
    let circleId: string
    try {
      circleId = getCircleIdForResponse(rid, world.responses, world.submissions)
    } catch {
      continue
    }
    const callerMembership = getActiveMembership(args.callerId, circleId, world.memberships)
    if (!callerMembership || callerMembership.blocked) continue // silently skip
    const callerIsAdmin = callerMembership.role === 'admin' && !callerMembership.blocked

    const rows = world.comments
      .filter((c) => c.responseId === rid)
      .sort((a, b) => a.createdAt - b.createdAt)

    result[rid] = rows.map((c) => {
      const isDeleted = c.deletedAt != null
      const isAuthor = c.userId === args.callerId
      return {
        commentId: c._id,
        userId: c.userId,
        text: isDeleted ? '' : c.text,
        isDeleted,
        canEdit: isAuthor && !isDeleted,
        canDelete: (isAuthor || callerIsAdmin) && !isDeleted,
        createdAt: c.createdAt,
      }
    })
  }
  return result
}

function makeWorld(): World {
  return {
    comments: [],
    responses: [
      { _id: 'r1', submissionId: 's1' },
      { _id: 'r2', submissionId: 's2' },
    ],
    submissions: [
      { _id: 's1', circleId: 'c1' },
      { _id: 's2', circleId: 'c2' },
    ],
    memberships: [
      { userId: 'u1', circleId: 'c1', role: 'member' },
      { userId: 'u2', circleId: 'c1', role: 'admin' },
      { userId: 'u3', circleId: 'c1', role: 'member' },
      // u4 is in a different circle (c2)
      { userId: 'u4', circleId: 'c2', role: 'member' },
    ],
    now: 1_000_000,
    idSeq: 0,
  }
}

describe('comment text validation', () => {
  it('accepts a normal comment', () => {
    expect(validateCommentText('hello')).toBe('hello')
  })

  it('rejects empty text', () => {
    expect(() => validateCommentText('')).toThrow()
  })

  it('rejects whitespace-only text', () => {
    expect(() => validateCommentText('   \n\t  ')).toThrow()
  })

  it('accepts exactly 500 characters', () => {
    const s = 'x'.repeat(500)
    expect(validateCommentText(s)).toBe(s)
  })

  it('rejects 501 characters', () => {
    const s = 'x'.repeat(501)
    expect(() => validateCommentText(s)).toThrow()
  })
})

describe('addComment', () => {
  it('inserts a row with correct fields', () => {
    const w = makeWorld()
    const { commentId, createdAt } = addComment(w, {
      responseId: 'r1',
      userId: 'u1',
      text: 'nice update',
    })
    expect(w.comments).toHaveLength(1)
    const row = w.comments[0]!
    expect(row._id).toBe(commentId)
    expect(row.responseId).toBe('r1')
    expect(row.userId).toBe('u1')
    expect(row.text).toBe('nice update')
    expect(row.createdAt).toBe(createdAt)
    expect(row.updatedAt).toBe(createdAt)
    expect(row.deletedAt).toBeUndefined()
  })

  it("throws when caller is not a member of the response's circle", () => {
    const w = makeWorld()
    expect(() => addComment(w, { responseId: 'r1', userId: 'u4', text: 'sneaky' })).toThrow(
      /not a member/i
    )
  })

  it('throws on whitespace-only text', () => {
    const w = makeWorld()
    expect(() => addComment(w, { responseId: 'r1', userId: 'u1', text: '   ' })).toThrow()
  })

  it('throws on >500 chars; accepts exactly 500', () => {
    const w = makeWorld()
    const long = 'x'.repeat(501)
    expect(() => addComment(w, { responseId: 'r1', userId: 'u1', text: long })).toThrow()
    const ok = 'y'.repeat(500)
    addComment(w, { responseId: 'r1', userId: 'u1', text: ok })
    expect(w.comments).toHaveLength(1)
    expect(w.comments[0]!.text.length).toBe(500)
  })
})

describe('editComment', () => {
  it('author can edit; updatedAt bumps; createdAt preserved', () => {
    const w = makeWorld()
    const { commentId, createdAt } = addComment(w, {
      responseId: 'r1',
      userId: 'u1',
      text: 'first',
    })
    editComment(w, { commentId, userId: 'u1', text: 'second' })
    const row = w.comments[0]!
    expect(row.text).toBe('second')
    expect(row.createdAt).toBe(createdAt)
    expect(row.updatedAt).toBeGreaterThan(createdAt)
  })

  it('admin (not author) cannot edit — moderation is delete-only', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    expect(() => editComment(w, { commentId, userId: 'u2', text: 'rewritten' })).toThrow(/author/i)
  })

  it('non-author non-admin cannot edit', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    expect(() => editComment(w, { commentId, userId: 'u3', text: 'rewritten' })).toThrow()
  })

  it('cannot edit a soft-deleted comment', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    deleteComment(w, { commentId, userId: 'u1' })
    expect(() => editComment(w, { commentId, userId: 'u1', text: 'reborn' })).toThrow(/deleted/i)
  })
})

describe('deleteComment', () => {
  it('author can soft-delete', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    deleteComment(w, { commentId, userId: 'u1' })
    expect(w.comments[0]!.deletedAt).toBeDefined()
  })

  it('admin (not author) can soft-delete', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    deleteComment(w, { commentId, userId: 'u2' })
    expect(w.comments[0]!.deletedAt).toBeDefined()
  })

  it('non-author non-admin cannot delete', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    expect(() => deleteComment(w, { commentId, userId: 'u3' })).toThrow()
  })

  it('is idempotent — second call is a no-op', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })
    deleteComment(w, { commentId, userId: 'u1' })
    const firstDeletedAt = w.comments[0]!.deletedAt
    w.now += 100
    deleteComment(w, { commentId, userId: 'u1' })
    expect(w.comments[0]!.deletedAt).toBe(firstDeletedAt)
  })
})

describe('listCommentsForResponses', () => {
  it('returns rows ordered ascending by createdAt; deleted shows empty text and isDeleted=true', () => {
    const w = makeWorld()
    addComment(w, { responseId: 'r1', userId: 'u1', text: 'first' })
    w.now += 10
    addComment(w, { responseId: 'r1', userId: 'u3', text: 'second' })
    w.now += 10
    const { commentId: c3 } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'third' })
    deleteComment(w, { commentId: c3, userId: 'u1' })

    const out = listCommentsForResponses(w, { responseIds: ['r1'], callerId: 'u3' })
    expect(out['r1']).toHaveLength(3)
    const list = out['r1']!
    expect(list[0]!.text).toBe('first')
    expect(list[1]!.text).toBe('second')
    expect(list[2]!.isDeleted).toBe(true)
    expect(list[2]!.text).toBe('')
  })

  it('canEdit/canDelete computed per caller (author / admin / other)', () => {
    const w = makeWorld()
    const { commentId } = addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine' })

    const asAuthor = listCommentsForResponses(w, { responseIds: ['r1'], callerId: 'u1' })['r1']!
    expect(asAuthor[0]!.canEdit).toBe(true)
    expect(asAuthor[0]!.canDelete).toBe(true)

    const asAdmin = listCommentsForResponses(w, { responseIds: ['r1'], callerId: 'u2' })['r1']!
    expect(asAdmin[0]!.canEdit).toBe(false)
    expect(asAdmin[0]!.canDelete).toBe(true)

    const asOther = listCommentsForResponses(w, { responseIds: ['r1'], callerId: 'u3' })['r1']!
    expect(asOther[0]!.canEdit).toBe(false)
    expect(asOther[0]!.canDelete).toBe(false)

    expect(commentId).toBeTruthy()
  })

  it("silently skips responseIds the caller can't see (no throw on whole batch)", () => {
    const w = makeWorld()
    addComment(w, { responseId: 'r1', userId: 'u1', text: 'in c1' })
    addComment(w, { responseId: 'r2', userId: 'u4', text: 'in c2' })

    // u1 is in c1 only. r2 (in c2) should be silently skipped.
    const out = listCommentsForResponses(w, { responseIds: ['r1', 'r2'], callerId: 'u1' })
    expect(out['r1']).toBeDefined()
    expect(out['r1']).toHaveLength(1)
    expect(out['r2']).toBeUndefined()
  })

  it('throws when batch exceeds 200 ids', () => {
    const w = makeWorld()
    const ids = Array.from({ length: 201 }, (_, i) => `r${i}`)
    expect(() => listCommentsForResponses(w, { responseIds: ids, callerId: 'u1' })).toThrow(
      /max 200/i
    )
  })
})

describe('cascade and removeMember soft-delete (modeled)', () => {
  function cascadeDeleteCircle(world: World, circleId: string): void {
    // Mirror the production sweep: delete every comment for every response in the circle.
    const subs = world.submissions.filter((s) => s.circleId === circleId)
    const subIds = new Set(subs.map((s) => s._id))
    const respIds = new Set(
      world.responses.filter((r) => subIds.has(r.submissionId)).map((r) => r._id)
    )
    world.comments = world.comments.filter((c) => !respIds.has(c.responseId))
  }

  function removeMemberRedact(world: World, userId: string, circleId: string): void {
    // Soft-delete that user's comments anywhere in the circle.
    const subs = world.submissions.filter((s) => s.circleId === circleId)
    const subIds = new Set(subs.map((s) => s._id))
    const respIds = new Set(
      world.responses.filter((r) => subIds.has(r.submissionId)).map((r) => r._id)
    )
    for (const c of world.comments) {
      if (c.userId === userId && respIds.has(c.responseId) && !c.deletedAt) {
        c.deletedAt = world.now
      }
    }
  }

  it("cascadeDeleteCircle removes all comments for the circle's responses", () => {
    const w = makeWorld()
    addComment(w, { responseId: 'r1', userId: 'u1', text: 'in c1 #1' })
    addComment(w, { responseId: 'r1', userId: 'u3', text: 'in c1 #2' })
    addComment(w, { responseId: 'r2', userId: 'u4', text: 'in c2' })

    cascadeDeleteCircle(w, 'c1')
    expect(w.comments).toHaveLength(1)
    expect(w.comments[0]!.responseId).toBe('r2')
  })

  it("removeMember(keepContributions=false) soft-deletes that user's comments in the circle", () => {
    const w = makeWorld()
    addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine A' })
    addComment(w, { responseId: 'r1', userId: 'u1', text: 'mine B' })
    addComment(w, { responseId: 'r1', userId: 'u3', text: 'others — should remain' })

    removeMemberRedact(w, 'u1', 'c1')

    const u1Comments = w.comments.filter((c) => c.userId === 'u1')
    expect(u1Comments.every((c) => c.deletedAt != null)).toBe(true)
    const u3Comments = w.comments.filter((c) => c.userId === 'u3')
    expect(u3Comments.every((c) => c.deletedAt == null)).toBe(true)
  })
})
