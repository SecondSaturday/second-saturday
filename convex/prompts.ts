import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

/** Get the authenticated user or throw (safe for queries) */
async function getAuthUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()

  if (!user) throw new Error('User not found')
  return user
}

/** Get the authenticated user, auto-creating if needed (mutations only) */
async function getOrCreateAuthUser(ctx: MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()

  if (existing) return existing

  const now = Date.now()
  const id = await ctx.db.insert('users', {
    clerkId: identity.subject,
    email: identity.email ?? '',
    name: identity.name,
    imageUrl: identity.pictureUrl,
    createdAt: now,
    updatedAt: now,
  })
  return (await ctx.db.get(id)) as Doc<'users'>
}

async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
) {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return membership
}

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

    if (!membership) throw new Error('Not a member of this circle')

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
