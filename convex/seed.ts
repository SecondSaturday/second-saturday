import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

const TEST_RESPONSES = [
  "Things have been really good this month! Spent a lot of time outdoors and finally got back into reading. Feels like I'm finding a rhythm again.",
  "Honestly it's been a whirlwind — between work and trying to see family more, I feel like February just flew by. But in the best way.",
  "Had some big moments this month. Started something new that I'm excited about but also terrified of. More on that soon.",
  'Quiet month for me, and I needed it. Focused on the small things — good coffee, long walks, less screen time. Highly recommend.',
  'Lots of travel this month which was exhausting but also really grounding in a weird way. Reminded me how much I love coming home.',
]

const TEST_RESPONSES_2 = [
  "Finally finished a project I'd been putting off for months. The relief is real. Now I don't know what to do with myself.",
  "Been cooking more at home and honestly it's been the highlight of my week every week. Discovered I actually enjoy it.",
  'Reconnected with an old friend out of the blue this month — one of those conversations that goes for three hours and you forget to eat.',
  "Work is intense right now but I'm learning a lot. Trying to remember that discomfort usually means growth.",
  "Started a new habit I've been meaning to build for years. Day 18. Still going. Quietly proud of myself.",
]

/**
 * Clean up test data: delete submissions, responses, and newsletter for a circle + cycle.
 */
export const cleanupTestData = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const { circleId, cycleId } = args
    const deleted = { submissions: 0, responses: 0, media: 0, newsletters: 0, reads: 0 }

    // Delete submissions, their responses, and any media for this cycle
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()

    for (const sub of submissions) {
      if (sub.cycleId !== cycleId) continue

      // Delete responses and their media
      const responses = await ctx.db
        .query('responses')
        .withIndex('by_submission', (q) => q.eq('submissionId', sub._id))
        .collect()
      for (const resp of responses) {
        // Delete media attached to this response
        const mediaItems = await ctx.db
          .query('media')
          .withIndex('by_response', (q) => q.eq('responseId', resp._id))
          .collect()
        for (const m of mediaItems) {
          if (m.storageId) {
            await ctx.storage.delete(m.storageId)
          }
          await ctx.db.delete(m._id)
          deleted.media++
        }

        await ctx.db.delete(resp._id)
        deleted.responses++
      }

      await ctx.db.delete(sub._id)
      deleted.submissions++
    }

    // Delete newsletter and reads
    const newsletter = await ctx.db
      .query('newsletters')
      .withIndex('by_circle_cycle', (q) => q.eq('circleId', circleId).eq('cycleId', cycleId))
      .first()

    if (newsletter) {
      const reads = await ctx.db
        .query('newsletterReads')
        .withIndex('by_newsletter', (q) => q.eq('newsletterId', newsletter._id))
        .collect()
      for (const read of reads) {
        await ctx.db.delete(read._id)
        deleted.reads++
      }
      await ctx.db.delete(newsletter._id)
      deleted.newsletters++
    }

    return deleted
  },
})

/**
 * Delete a newsletter for a given circle + cycle (used by test script to force recompilation).
 */
export const deleteNewsletter = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const newsletter = await ctx.db
      .query('newsletters')
      .withIndex('by_circle_cycle', (q) =>
        q.eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .first()

    if (!newsletter) throw new Error('No newsletter found for this cycle')

    // Delete associated reads
    const reads = await ctx.db
      .query('newsletterReads')
      .withIndex('by_newsletter', (q) => q.eq('newsletterId', newsletter._id))
      .collect()
    for (const read of reads) {
      await ctx.db.delete(read._id)
    }

    await ctx.db.delete(newsletter._id)
    return { deleted: newsletter._id }
  },
})

/**
 * Create test submissions for all active members of a circle.
 * Each member gets a submission with responses to all active prompts.
 * Used by the newsletter pipeline test script.
 */
export const createTestSubmissions = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const { circleId, cycleId } = args

    const circle = await ctx.db.get(circleId)
    if (!circle) throw new Error('Circle not found')

    // Get active prompts
    const allPrompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const prompts = allPrompts.filter((p) => p.active).sort((a, b) => a.order - b.order)

    if (prompts.length === 0) throw new Error('No active prompts in circle')

    // Get active members
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', circleId))
      .collect()
    const activeMembers = allMemberships.filter((m) => !m.leftAt && !m.blocked)

    if (activeMembers.length === 0) throw new Error('No active members in circle')

    const now = Date.now()
    let created = 0

    for (let mi = 0; mi < activeMembers.length; mi++) {
      const membership = activeMembers[mi]!

      // Skip if submission already exists for this user+circle+cycle
      const existing = await ctx.db
        .query('submissions')
        .withIndex('by_user_circle_cycle', (q) =>
          q.eq('userId', membership.userId).eq('circleId', circleId).eq('cycleId', cycleId)
        )
        .first()

      if (existing) continue

      // Create submission
      const submissionId = await ctx.db.insert('submissions', {
        circleId,
        userId: membership.userId,
        cycleId,
        submittedAt: now,
        lockedAt: now,
        createdAt: now,
        updatedAt: now,
      })

      // Create responses for each prompt
      for (let pi = 0; pi < prompts.length; pi++) {
        const prompt = prompts[pi]!
        const text =
          pi % 2 === 0
            ? TEST_RESPONSES[(mi + pi) % TEST_RESPONSES.length]!
            : TEST_RESPONSES_2[(mi + pi) % TEST_RESPONSES_2.length]!

        await ctx.db.insert('responses', {
          submissionId,
          promptId: prompt._id,
          text,
          createdAt: now,
          updatedAt: now,
        })
      }

      created++
    }

    return { created, totalMembers: activeMembers.length, promptCount: prompts.length }
  },
})

export const createTestNewsletter = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cycleId = args.cycleId ?? '2026-02'

    const circle = await ctx.db.get(args.circleId)
    if (!circle) throw new Error('Circle not found')

    // Check for existing newsletter for this cycle
    const existing = await ctx.db
      .query('newsletters')
      .withIndex('by_circle_cycle', (q) => q.eq('circleId', args.circleId).eq('cycleId', cycleId))
      .first()
    if (existing)
      throw new Error(`Newsletter already exists for cycle ${cycleId} (id: ${existing._id})`)

    // Get active prompts sorted by order
    const allPrompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const prompts = allPrompts.filter((p) => p.active).sort((a, b) => a.order - b.order)

    // Get active members
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const activeMembers = allMemberships.filter((m) => !m.leftAt && !m.blocked)

    const memberNames: string[] = []
    for (const membership of activeMembers) {
      const user = await ctx.db.get(membership.userId)
      memberNames.push(user?.name ?? user?.email ?? 'Unknown Member')
    }

    const memberCount = activeMembers.length

    // Build sections from actual prompts (or a default if none)
    const effectivePrompts =
      prompts.length > 0
        ? prompts.map((p) => p.text)
        : ["What's been on your mind this month?", 'What are you looking forward to?']

    const sections = effectivePrompts.map((promptTitle, promptIndex) => ({
      promptTitle,
      responses: memberNames.map((memberName, memberIndex) => ({
        memberName,
        text:
          promptIndex % 2 === 0
            ? TEST_RESPONSES[(memberIndex + promptIndex) % TEST_RESPONSES.length]!
            : TEST_RESPONSES_2[(memberIndex + promptIndex) % TEST_RESPONSES_2.length]!,
        media: [] as Array<{ type: string; url: string; thumbnailUrl?: string }>,
      })),
    }))

    // Issue number
    const existingNewsletters = await ctx.db
      .query('newsletters')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const issueNumber = existingNewsletters.length + 1

    // Title
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

    const now = Date.now()
    // Backdate publishedAt to the second Saturday of the month
    const publishedAt = new Date(`${year}-${month}-08T11:00:00Z`).getTime()

    const newsletterId = await ctx.db.insert('newsletters', {
      circleId: args.circleId,
      cycleId,
      title,
      htmlContent: JSON.stringify({ sections }),
      issueNumber,
      status: 'published',
      submissionCount: memberCount,
      memberCount,
      publishedAt,
      createdAt: now,
    })

    return {
      newsletterId,
      title,
      memberCount,
      submissionCount: memberCount,
      sectionsCount: sections.length,
    }
  },
})
