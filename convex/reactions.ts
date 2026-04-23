import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUser, requireMembership, getActiveMembership } from './authHelpers'
import type { Id } from './_generated/dataModel'

const MAX_EMOJI_LENGTH = 16

function validateEmoji(emoji: string): void {
  if (emoji.length === 0 || emoji.length > MAX_EMOJI_LENGTH) {
    throw new Error('Invalid emoji')
  }
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

export const addReaction = mutation({
  args: {
    responseId: v.id('responses'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    validateEmoji(args.emoji)
    const user = await getAuthUser(ctx)
    const circleId = await getCircleIdForResponse(ctx, args.responseId)
    await requireMembership(ctx, user._id, circleId)

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_response_user_emoji', (q) =>
        q.eq('responseId', args.responseId).eq('userId', user._id).eq('emoji', args.emoji)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { added: false }
    }

    await ctx.db.insert('reactions', {
      responseId: args.responseId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: Date.now(),
    })
    return { added: true }
  },
})

export const removeReaction = mutation({
  args: {
    responseId: v.id('responses'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    validateEmoji(args.emoji)
    const user = await getAuthUser(ctx)
    const circleId = await getCircleIdForResponse(ctx, args.responseId)
    await requireMembership(ctx, user._id, circleId)

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_response_user_emoji', (q) =>
        q.eq('responseId', args.responseId).eq('userId', user._id).eq('emoji', args.emoji)
      )
      .first()

    if (!existing) return { removed: false }
    await ctx.db.delete(existing._id)
    return { removed: true }
  },
})

export const listReactionsForResponses = query({
  args: {
    responseIds: v.array(v.id('responses')),
  },
  handler: async (ctx, args) => {
    if (args.responseIds.length === 0) return {}
    if (args.responseIds.length > 200) throw new Error('Too many responseIds (max 200)')

    const user = await getAuthUser(ctx)

    // Batch: fetch all responses in parallel, then all their submissions in parallel.
    const responses = await Promise.all(args.responseIds.map((id) => ctx.db.get(id)))
    const submissionIds = Array.from(
      new Set(responses.filter((r): r is NonNullable<typeof r> => !!r).map((r) => r.submissionId))
    )
    const submissions = await Promise.all(submissionIds.map((id) => ctx.db.get(id)))
    const submissionCircle = new Map<string, Id<'circles'>>()
    for (const sub of submissions) {
      if (sub) submissionCircle.set(sub._id as string, sub.circleId)
    }

    // Resolve circleId per response via the submissions map.
    const responseCircle = new Map<string, Id<'circles'>>()
    for (const resp of responses) {
      if (!resp) continue
      const circleId = submissionCircle.get(resp.submissionId as string)
      if (circleId) responseCircle.set(resp._id as string, circleId)
    }

    // Batch: resolve membership for each unique circle in parallel.
    const uniqueCircleIds = Array.from(new Set(responseCircle.values()))
    const membershipResults = await Promise.all(
      uniqueCircleIds.map((cid) => getActiveMembership(ctx, user._id, cid))
    )
    const isMemberByCircle = new Map<string, boolean>()
    uniqueCircleIds.forEach((cid, i) => {
      isMemberByCircle.set(cid as string, !!membershipResults[i])
    })

    // Batch: fetch reactions for each allowed response in parallel.
    const allowedResponseIds: Id<'responses'>[] = args.responseIds.filter((rid) => {
      const cid = responseCircle.get(rid as string)
      return !!cid && !!isMemberByCircle.get(cid as string)
    })
    const reactionsPerResponse = await Promise.all(
      allowedResponseIds.map((rid) =>
        ctx.db
          .query('reactions')
          .withIndex('by_response', (q) => q.eq('responseId', rid))
          .collect()
      )
    )

    // Batch: resolve display names for every reactor referenced across responses.
    const reactorIds = new Set<string>()
    for (const rows of reactionsPerResponse) {
      for (const r of rows) reactorIds.add(r.userId as string)
    }
    const reactorUsers = await Promise.all(
      Array.from(reactorIds).map((uid) => ctx.db.get(uid as Id<'users'>))
    )
    const nameByUserId = new Map<string, string>()
    Array.from(reactorIds).forEach((uid, i) => {
      const u = reactorUsers[i]
      nameByUserId.set(uid, u?.name ?? u?.email ?? 'Unknown Member')
    })

    const result: Record<
      string,
      Array<{ emoji: string; count: number; reactedByMe: boolean; reactorNames: string[] }>
    > = {}
    allowedResponseIds.forEach((responseId, i) => {
      const rows = reactionsPerResponse[i] ?? []
      const byEmoji = new Map<
        string,
        { count: number; reactedByMe: boolean; reactorNames: string[] }
      >()
      for (const r of rows) {
        const agg = byEmoji.get(r.emoji) ?? { count: 0, reactedByMe: false, reactorNames: [] }
        agg.count += 1
        if (r.userId === user._id) {
          agg.reactedByMe = true
          agg.reactorNames.unshift('You')
        } else {
          agg.reactorNames.push(nameByUserId.get(r.userId as string) ?? 'Unknown Member')
        }
        byEmoji.set(r.emoji, agg)
      }
      result[responseId as string] = Array.from(byEmoji.entries()).map(([emoji, agg]) => ({
        emoji,
        count: agg.count,
        reactedByMe: agg.reactedByMe,
        reactorNames: agg.reactorNames,
      }))
    })

    return result
  },
})
