import { mutation } from './_generated/server'
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

export const createTestNewsletter = mutation({
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
