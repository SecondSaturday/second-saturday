import { query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUser } from './authHelpers'
import { resolveResponseMedia } from './newsletterHelpers'
import type { Doc, Id } from './_generated/dataModel'

interface ProfileEntry {
  cycleId: string
  newsletterId?: Id<'newsletters'>
  issueNumber?: number
  publishedAt?: number
  submittedAt: number | null
  responses: Array<{
    responseId: Id<'responses'>
    promptText: string
    text: string
    media: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }>
  }>
}

export const getMemberProfile = query({
  args: {
    circleId: v.id('circles'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthUser(ctx)

    // Inline caller authz so we can (a) reject blocked callers and (b) surface
    // a graceful null when an ex-member visits their OWN profile URL instead
    // of throwing (which would surface as a query error in the UI).
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', caller._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt) {
      if (caller._id === args.userId) return null
      throw new Error('Not a member of this circle')
    }
    if (callerMembership.blocked) {
      if (caller._id === args.userId) return null
      throw new Error('Not a member of this circle')
    }

    // Look up target membership directly — include historical (leftAt) memberships.
    const targetMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', args.userId).eq('circleId', args.circleId))
      .first()

    if (!targetMembership) throw new Error('User has never been a member of this circle')
    if (targetMembership.blocked) return null

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) return null

    const circle = await ctx.db.get(args.circleId)
    if (!circle) return null

    const isOwner = circle.adminId === args.userId

    // Prompt text map for the circle (cheap vs. per-response lookups).
    const circlePrompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const promptTextById = new Map<string, string>()
    for (const p of circlePrompts) promptTextById.set(p._id as string, p.text)

    // All submissions by this user for this circle (any cycle). We can't
    // use the full by_user_circle_cycle index without a specific cycle, so
    // query by_user and filter by circleId in memory.
    const allSubs = await ctx.db
      .query('submissions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
    const userSubs = allSubs.filter((s) => s.circleId === args.circleId)

    // Newsletters for this circle — for attaching publish metadata and
    // enforcing the privacy rule.
    const allNewsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const publishedNewsletterByCycle = new Map<string, Doc<'newsletters'>>()
    for (const n of allNewsletters) {
      if (n.status === 'published') publishedNewsletterByCycle.set(n.cycleId, n)
    }

    // Build the set of responseIds that were actually included in each
    // published newsletter's compiled sections. The privacy rule is "what
    // readers saw in the issue", not "the cycle was published at all" — this
    // prevents a post-publish submission/edit from leaking through the
    // cycle-level gate.
    const publishedResponseIdsByCycle = new Map<string, Set<string>>()
    for (const [cycleId, newsletter] of publishedNewsletterByCycle) {
      const ids = new Set<string>()
      if (!newsletter.htmlContent) {
        publishedResponseIdsByCycle.set(cycleId, ids)
        continue
      }
      try {
        const parsed = JSON.parse(newsletter.htmlContent) as {
          sections?: Array<{ responses?: Array<{ responseId?: string }> }>
        }
        for (const section of parsed.sections ?? []) {
          for (const r of section.responses ?? []) {
            if (r.responseId) ids.add(r.responseId)
          }
        }
      } catch {
        // Malformed JSON — treat as empty; entries for this cycle will be
        // filtered out for non-target viewers.
      }
      publishedResponseIdsByCycle.set(cycleId, ids)
    }

    const viewerIsTarget = caller._id === args.userId

    const entries: ProfileEntry[] = []

    for (const submission of userSubs) {
      // Gather this submission's responses.
      const responses = await ctx.db
        .query('responses')
        .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
        .collect()

      const publishedNewsletter = publishedNewsletterByCycle.get(submission.cycleId)

      // Privacy rule (AC #7, tightened): for non-target viewers, only surface
      // responses that were actually included in the published newsletter's
      // compiled sections. Target can always see their own history.
      //
      // Back-compat: newsletters compiled before story 1.3 don't store a
      // `responseId` per section response, so the parsed set comes back empty.
      // In that case we can't do a strict match, so we fall back to the
      // cycle-level gate (any published newsletter for the cycle → include the
      // submission's responses). New post-1.3 newsletters keep the strict
      // match.
      let visibleResponses: typeof responses
      if (viewerIsTarget) {
        visibleResponses = responses
      } else {
        if (!publishedNewsletter) continue
        const publishedIds = publishedResponseIdsByCycle.get(submission.cycleId)
        if (publishedIds && publishedIds.size > 0) {
          visibleResponses = responses.filter((r) => publishedIds.has(r._id as string))
        } else {
          // Legacy newsletter without per-response ids — trust cycle-level publish.
          visibleResponses = responses
        }
        if (visibleResponses.length === 0) continue
      }

      // Mirror the newsletter compile content-non-empty rule on the visible set:
      // include if submittedAt OR at least one visible response has non-empty text.
      const hasNonEmptyText = visibleResponses.some((r) => r.text.trim().length > 0)
      if (!submission.submittedAt && !hasNonEmptyText) continue

      const renderedResponses: ProfileEntry['responses'] = []
      for (const r of visibleResponses) {
        // TODO(prompt-snapshot): prefer per-submission prompt snapshot once available.
        const promptText = promptTextById.get(r.promptId as string) ?? '[Prompt removed]'
        const media = await resolveResponseMedia(ctx, r._id)
        renderedResponses.push({
          responseId: r._id,
          promptText,
          text: r.text,
          media,
        })
      }

      entries.push({
        cycleId: submission.cycleId,
        newsletterId: publishedNewsletter?._id,
        issueNumber: publishedNewsletter?.issueNumber,
        publishedAt: publishedNewsletter?.publishedAt,
        submittedAt: submission.submittedAt ?? null,
        responses: renderedResponses,
      })
    }

    // Newest-first by cycleId (YYYY-MM sorts correctly as a string).
    entries.sort((a, b) => (a.cycleId < b.cycleId ? 1 : a.cycleId > b.cycleId ? -1 : 0))

    // Stats derived from the filtered visible set.
    const submittedTimes = entries.map((e) => e.submittedAt).filter((t): t is number => t !== null)
    const submissionCount = entries.length
    const firstSubmittedAt = submittedTimes.length > 0 ? Math.min(...submittedTimes) : null
    const lastSubmittedAt = submittedTimes.length > 0 ? Math.max(...submittedTimes) : null

    return {
      user: {
        id: targetUser._id,
        name: targetUser.name ?? targetUser.email ?? 'Unknown Member',
        imageUrl: targetUser.imageUrl ?? null,
      },
      membership: {
        role: targetMembership.role,
        joinedAt: targetMembership.joinedAt,
        leftAt: targetMembership.leftAt,
        isOwner,
      },
      stats: {
        submissionCount,
        firstSubmittedAt,
        lastSubmittedAt,
      },
      entries,
    }
  },
})
