import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUser, getOrCreateAuthUser, requireAdmin } from './authHelpers'

const PROMPT_LIBRARY: Record<string, string[]> = {
  reflection: ['What did you do this month?', "What's something you learned recently?"],
  fun: ['What are you listening to?', 'Best meal you had this month?'],
  gratitude: ['One Good Thing', 'Who made your month better?'],
  deep: ['On Your Mind', 'What are you looking forward to?'],
}

export const getPromptLibrary = query({
  args: {},
  handler: async () => {
    return PROMPT_LIBRARY
  },
})

export const getCirclePrompts = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!membership || membership.leftAt) throw new Error('Not a member of this circle')

    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    return prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)
  },
})

export const updatePrompts = mutation({
  args: {
    circleId: v.id('circles'),
    prompts: v.array(
      v.object({
        id: v.optional(v.id('prompts')),
        text: v.string(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)
    await requireAdmin(ctx, user._id, args.circleId)

    if (args.prompts.length < 1 || args.prompts.length > 8) {
      throw new Error('Must have 1-8 prompts')
    }

    for (const p of args.prompts) {
      if (p.text.length > 200) {
        throw new Error('Prompt text must be 200 characters or less')
      }
    }

    // Check for duplicate prompt texts
    const texts = args.prompts.map((p) => p.text.trim().toLowerCase())
    const uniqueTexts = new Set(texts)
    if (uniqueTexts.size !== texts.length) {
      throw new Error('Duplicate prompts are not allowed')
    }

    // Deactivate all existing prompts for this circle
    const existing = await ctx.db
      .query('prompts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    for (const p of existing) {
      await ctx.db.patch(p._id, { active: false })
    }

    const now = Date.now()

    // Create or update prompts
    for (const p of args.prompts) {
      if (p.id) {
        // Verify the prompt belongs to this circle
        const existingPrompt = await ctx.db.get(p.id)
        if (!existingPrompt || existingPrompt.circleId !== args.circleId) {
          throw new Error('Prompt does not belong to this circle')
        }
        await ctx.db.patch(p.id, {
          text: p.text,
          order: p.order,
          active: true,
        })
      } else {
        await ctx.db.insert('prompts', {
          circleId: args.circleId,
          text: p.text,
          order: p.order,
          active: true,
          createdAt: now,
        })
      }
    }

    return { success: true }
  },
})
