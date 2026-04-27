import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUser, requireMembership, getActiveMembership } from './authHelpers'
import { MAX_COMMENT_TEXT_LENGTH } from './lib/constants'
import type { Doc, Id } from './_generated/dataModel'

function validateCommentText(raw: string): string {
  const text = raw.trim()
  if (text.length === 0) throw new Error('Comment text cannot be empty')
  if (text.length > MAX_COMMENT_TEXT_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_COMMENT_TEXT_LENGTH} characters`)
  }
  return text
}

async function getCircleIdForResponse(
  ctx: QueryCtx | MutationCtx,
  responseId: Id<'responses'>
): Promise<Id<'circles'>> {
  const response = await ctx.db.get(responseId)
  if (!response) throw new Error('Response not found')
  const submission = await ctx.db.get(response.submissionId)
  if (!submission) throw new Error('Submission not found')
  return submission.circleId
}

async function loadCommentOrThrow(
  ctx: QueryCtx | MutationCtx,
  commentId: Id<'comments'>
): Promise<Doc<'comments'>> {
  const comment = await ctx.db.get(commentId)
  if (!comment) throw new Error('Comment not found')
  return comment
}

async function isCallerAdminOfCircle(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<boolean> {
  const membership = await getActiveMembership(ctx, userId, circleId)
  return !!membership && membership.role === 'admin' && !membership.blocked
}

export const addComment = mutation({
  args: {
    responseId: v.id('responses'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const text = validateCommentText(args.text)
    const user = await getAuthUser(ctx)
    const circleId = await getCircleIdForResponse(ctx, args.responseId)
    await requireMembership(ctx, user._id, circleId)

    const now = Date.now()
    const commentId = await ctx.db.insert('comments', {
      responseId: args.responseId,
      userId: user._id,
      text,
      createdAt: now,
      updatedAt: now,
    })
    return { commentId, createdAt: now }
  },
})

export const editComment = mutation({
  args: {
    commentId: v.id('comments'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const text = validateCommentText(args.text)
    const user = await getAuthUser(ctx)
    const comment = await loadCommentOrThrow(ctx, args.commentId)

    // Author-only: admins cannot edit other users' comments.
    if (comment.userId !== user._id) throw new Error('Only the author can edit this comment')
    if (comment.deletedAt) throw new Error('Cannot edit a deleted comment')

    // Verify caller is still a member of the parent circle.
    const circleId = await getCircleIdForResponse(ctx, comment.responseId)
    await requireMembership(ctx, user._id, circleId)

    await ctx.db.patch(args.commentId, { text, updatedAt: Date.now() })
    return { updated: true }
  },
})

export const deleteComment = mutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const comment = await loadCommentOrThrow(ctx, args.commentId)

    // Idempotent — already soft-deleted is a no-op.
    if (comment.deletedAt) return { deleted: true }

    const circleId = await getCircleIdForResponse(ctx, comment.responseId)
    // Caller must be a member; admins can delete any, authors can delete their own.
    await requireMembership(ctx, user._id, circleId)

    const isAuthor = comment.userId === user._id
    const isAdmin = isAuthor ? false : await isCallerAdminOfCircle(ctx, user._id, circleId)

    if (!isAuthor && !isAdmin) {
      throw new Error('Only the author or a circle admin can delete this comment')
    }

    await ctx.db.patch(args.commentId, { deletedAt: Date.now() })
    return { deleted: true }
  },
})

export const listCommentsForResponses = query({
  args: {
    responseIds: v.array(v.id('responses')),
  },
  handler: async (ctx, args) => {
    if (args.responseIds.length === 0) return {}
    if (args.responseIds.length > 200) throw new Error('Too many responseIds (max 200)')

    const user = await getAuthUser(ctx)

    // Resolve responseId → circleId via batched fetches.
    const responses = await Promise.all(args.responseIds.map((id) => ctx.db.get(id)))
    const submissionIds = Array.from(
      new Set(responses.filter((r): r is NonNullable<typeof r> => !!r).map((r) => r.submissionId))
    )
    const submissions = await Promise.all(submissionIds.map((id) => ctx.db.get(id)))
    const submissionCircle = new Map<string, Id<'circles'>>()
    for (const sub of submissions) {
      if (sub) submissionCircle.set(sub._id as string, sub.circleId)
    }

    const responseCircle = new Map<string, Id<'circles'>>()
    for (const resp of responses) {
      if (!resp) continue
      const circleId = submissionCircle.get(resp.submissionId as string)
      if (circleId) responseCircle.set(resp._id as string, circleId)
    }

    // Per-circle membership cache (Map keyed by circleId).
    const uniqueCircleIds = Array.from(new Set(responseCircle.values()))
    const membershipResults = await Promise.all(
      uniqueCircleIds.map((cid) => getActiveMembership(ctx, user._id, cid))
    )
    const membershipByCircle = new Map<string, Doc<'memberships'> | null>()
    uniqueCircleIds.forEach((cid, i) => {
      membershipByCircle.set(cid as string, membershipResults[i] ?? null)
    })

    const allowedResponseIds: Id<'responses'>[] = args.responseIds.filter((rid) => {
      const cid = responseCircle.get(rid as string)
      if (!cid) return false
      const m = membershipByCircle.get(cid as string)
      return !!m && !m.blocked
    })

    const commentsPerResponse = await Promise.all(
      allowedResponseIds.map((rid) =>
        ctx.db
          .query('comments')
          .withIndex('by_response_created', (q) => q.eq('responseId', rid))
          .order('asc')
          .collect()
      )
    )

    // Resolve unique authors in one batch.
    const authorIds = new Set<string>()
    for (const rows of commentsPerResponse) {
      for (const c of rows) authorIds.add(c.userId as string)
    }
    const authorUsers = await Promise.all(
      Array.from(authorIds).map((uid) => ctx.db.get(uid as Id<'users'>))
    )
    const authorById = new Map<string, Doc<'users'> | null>()
    Array.from(authorIds).forEach((uid, i) => {
      authorById.set(uid, authorUsers[i] ?? null)
    })

    const result: Record<
      string,
      Array<{
        commentId: Id<'comments'>
        userId: Id<'users'>
        authorName: string
        authorAvatarUrl: string | null
        text: string
        createdAt: number
        updatedAt: number
        isDeleted: boolean
        canEdit: boolean
        canDelete: boolean
      }>
    > = {}

    allowedResponseIds.forEach((responseId, i) => {
      const rows = commentsPerResponse[i] ?? []
      const cid = responseCircle.get(responseId as string)
      const callerMembership = cid ? membershipByCircle.get(cid as string) : null
      const callerIsAdmin =
        !!callerMembership && callerMembership.role === 'admin' && !callerMembership.blocked

      result[responseId as string] = rows.map((c) => {
        const isDeleted = c.deletedAt != null
        const author = authorById.get(c.userId as string) ?? null
        const isAuthor = c.userId === user._id
        return {
          commentId: c._id,
          userId: c.userId,
          authorName: author ? (author.name ?? author.email ?? 'Former member') : 'Former member',
          authorAvatarUrl: author?.imageUrl ?? null,
          text: isDeleted ? '' : c.text,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          isDeleted,
          canEdit: isAuthor && !isDeleted,
          canDelete: (isAuthor || callerIsAdmin) && !isDeleted,
        }
      })
    })

    return result
  },
})
