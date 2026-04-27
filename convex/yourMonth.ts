import { query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { computeSecondSaturdayDeadline, parseCycleId } from './lib/dates'
import { resolveResponseMedia } from './newsletterHelpers'
import type { Doc, Id } from './_generated/dataModel'

// TODO(dedupe): mirrors validateCycleId in convex/submissions.ts:9-23.
function validateCycleId(cycleId: string): void {
  const cyclePattern = /^\d{4}-\d{2}$/
  if (!cyclePattern.test(cycleId)) {
    throw new Error('Cycle ID must be in YYYY-MM format')
  }
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]!
  if (year < 2024 || year > 2099) {
    throw new Error('Invalid year in cycle ID')
  }
  if (month < 1 || month > 12) {
    throw new Error('Invalid month in cycle ID')
  }
}

/**
 * Like getAuthUser but returns null instead of throwing when the Convex `users`
 * row hasn't been synced yet (Clerk webhook race on first login). Personal
 * views should render an empty/CTA state rather than flashing an error.
 */
async function getAuthUserOrNull(ctx: QueryCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()
}

interface YourMonthCircleEntry {
  circleId: Id<'circles'>
  circleName: string
  circleIconUrl: string | null
  submission: {
    submissionId: Id<'submissions'>
    submittedAt: number | null
    locked: boolean
  } | null
  newsletter: {
    newsletterId: Id<'newsletters'>
    issueNumber: number
    publishedAt: number | null
    status: 'draft' | 'published' | 'skipped'
  } | null
  responses: Array<{
    responseId: Id<'responses'>
    promptText: string
    text: string
    media: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }>
  }>
}

export const getYourMonth = query({
  args: { cycleId: v.string() },
  handler: async (ctx, args) => {
    const caller = await getAuthUserOrNull(ctx)
    validateCycleId(args.cycleId)

    const { year, month } = parseCycleId(args.cycleId)
    const deadline = computeSecondSaturdayDeadline(year, month)
    const now = Date.now()

    if (!caller) {
      return { cycleId: args.cycleId, deadline, circles: [] }
    }

    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', caller._id))
      .collect()
    const activeMemberships = allMemberships.filter((m) => !m.leftAt && !m.blocked)

    const circles: YourMonthCircleEntry[] = await Promise.all(
      activeMemberships.map(async (membership) => {
        // Hide circles the caller joined AFTER this cycle's deadline — they
        // couldn't have participated, so a "Missed" chip would be misleading.
        if (membership.joinedAt > deadline) return null

        const [circle, submission, newsletter] = await Promise.all([
          ctx.db.get(membership.circleId),
          ctx.db
            .query('submissions')
            .withIndex('by_user_circle_cycle', (q) =>
              q
                .eq('userId', caller._id)
                .eq('circleId', membership.circleId)
                .eq('cycleId', args.cycleId)
            )
            .first(),
          ctx.db
            .query('newsletters')
            .withIndex('by_circle_cycle', (q) =>
              q.eq('circleId', membership.circleId).eq('cycleId', args.cycleId)
            )
            .first(),
        ])

        // Skip missing or archived circles to match the dashboard's
        // getCirclesByUser convention. An archived circle shouldn't surface
        // in personal views even if the membership row is still active.
        if (!circle || circle.archivedAt) {
          return null
        }

        const circleIconUrl = circle.iconImageId
          ? await ctx.storage.getUrl(circle.iconImageId)
          : null

        let renderedResponses: YourMonthCircleEntry['responses'] = []
        if (submission) {
          // Critical AC #7: only the caller's submission was queried via
          // by_user_circle_cycle, so its responses cannot belong to other users.
          const submissionResponses = await ctx.db
            .query('responses')
            .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
            .collect()

          // Prompt text map for the circle
          const circlePrompts = await ctx.db
            .query('prompts')
            .withIndex('by_circle', (q) => q.eq('circleId', membership.circleId))
            .collect()
          const promptById = new Map<string, Doc<'prompts'>>()
          for (const p of circlePrompts) promptById.set(p._id as string, p)

          const resolved = await Promise.all(
            submissionResponses.map(async (r) => {
              const prompt = promptById.get(r.promptId as string)
              const media = await resolveResponseMedia(ctx, r._id)
              return {
                responseId: r._id,
                promptText: prompt?.text ?? '[Prompt removed]',
                text: r.text,
                media,
                order: prompt?.order ?? Number.MAX_SAFE_INTEGER,
                creationTime: r._creationTime,
              }
            })
          )

          renderedResponses = resolved
            .filter((r) => r.text.trim().length > 0 || r.media.length > 0)
            .sort((a, b) => a.order - b.order || a.creationTime - b.creationTime)
            .map(({ order: _order, creationTime: _creationTime, ...rest }) => rest)
        }

        // Schema types newsletter.status as v.string() (legacy); narrow at the
        // boundary so the API exposes the documented union.
        const rawStatus = newsletter?.status
        const status: 'draft' | 'published' | 'skipped' | null =
          rawStatus === 'draft' || rawStatus === 'published' || rawStatus === 'skipped'
            ? rawStatus
            : null

        const entry: YourMonthCircleEntry = {
          circleId: circle._id,
          circleName: circle.name,
          circleIconUrl,
          submission: submission
            ? {
                submissionId: submission._id,
                submittedAt: submission.submittedAt ?? null,
                locked: !!submission.lockedAt || now >= deadline,
              }
            : null,
          newsletter:
            newsletter && status
              ? {
                  newsletterId: newsletter._id,
                  issueNumber: newsletter.issueNumber,
                  publishedAt: newsletter.publishedAt ?? null,
                  status,
                }
              : null,
          responses: renderedResponses,
        }
        return entry
      })
    ).then((rows) => rows.filter((r): r is YourMonthCircleEntry => r !== null))

    circles.sort(
      (a, b) =>
        a.circleName.localeCompare(b.circleName, 'en') ||
        (a.circleId as string).localeCompare(b.circleId as string)
    )

    return {
      cycleId: args.cycleId,
      deadline,
      circles,
    }
  },
})

export const listYourMonthsAvailable = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getAuthUserOrNull(ctx)
    if (!caller) {
      return {
        hasActiveMembership: false,
        months: [] as Array<{
          cycleId: string
          hasPublishedNewsletter: boolean
        }>,
      }
    }

    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', caller._id))
      .collect()
    // Per AC #8 strict-exclusion decision: only active circles contribute
    // to the month picker.
    const activeMemberships = allMemberships.filter((m) => !m.leftAt && !m.blocked)

    const cycleMap = new Map<string, boolean>() // cycleId -> hasPublishedNewsletter
    let hasActiveMembership = false

    await Promise.all(
      activeMemberships.map(async (membership) => {
        const circle = await ctx.db.get(membership.circleId)
        // Same archived-circle exclusion as getYourMonth.
        if (!circle || circle.archivedAt) return
        hasActiveMembership = true
        const [submissions, publishedNewsletters] = await Promise.all([
          ctx.db
            .query('submissions')
            .withIndex('by_user_circle_cycle', (q) =>
              q.eq('userId', caller._id).eq('circleId', membership.circleId)
            )
            .collect(),
          ctx.db
            .query('newsletters')
            .withIndex('by_circle_published', (q) => q.eq('circleId', membership.circleId))
            .filter((q) => q.eq(q.field('status'), 'published'))
            .collect(),
        ])

        for (const s of submissions) {
          // Defensive lower bound: don't surface cycles before the user's
          // signup. Submissions can't predate signup in practice, but we
          // also exclude any cycle whose deadline predates joinedAt for
          // this membership — same gating as getYourMonth.
          const { year, month } = parseCycleId(s.cycleId)
          const cycleDeadline = computeSecondSaturdayDeadline(year, month)
          if (cycleDeadline < membership.joinedAt) continue
          // Belt-and-braces: per-membership joinedAt already excludes pre-membership
          // cycles, but we also gate on the user's account creation as a safety
          // net for legacy or back-filled membership rows where joinedAt may
          // predate the actual account.
          if (cycleDeadline < caller.createdAt) continue
          if (!cycleMap.has(s.cycleId)) cycleMap.set(s.cycleId, false)
        }
        for (const n of publishedNewsletters) {
          // Only count this published newsletter as relevant if the caller
          // had a submission that month (otherwise it's not "their" month).
          if (cycleMap.has(n.cycleId)) cycleMap.set(n.cycleId, true)
        }
      })
    )

    const months = Array.from(cycleMap.entries()).map(([cycleId, hasPublishedNewsletter]) => ({
      cycleId,
      hasPublishedNewsletter,
    }))
    months.sort((a, b) => (a.cycleId < b.cycleId ? 1 : a.cycleId > b.cycleId ? -1 : 0))
    return { hasActiveMembership, months: months.slice(0, 36) }
  },
})
