import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

/** Get the authenticated user or throw (safe for queries and mutations) */
export async function getAuthUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .first()

  if (!user) throw new Error('User not found')
  return user
}

/** Get the authenticated user, auto-creating if not yet synced via webhook (mutations only) */
export async function getOrCreateAuthUser(ctx: MutationCtx): Promise<Doc<'users'>> {
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

/** Check if user is an active member of the circle */
export async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'memberships'>> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()

  if (!membership || membership.leftAt) throw new Error('Not a member of this circle')
  return membership
}

/** Check if user is the admin of the circle */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'memberships'>> {
  const membership = await requireMembership(ctx, userId, circleId)
  if (membership.role !== 'admin') throw new Error('Admin access required')
  return membership
}

/** Check if user is the owner (circle.adminId) of the circle */
export async function requireOwner(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'circles'>> {
  const circle = await ctx.db.get(circleId)
  if (!circle) throw new Error('Circle not found')
  if (circle.adminId !== userId) throw new Error('Owner access required')
  return circle
}

/** Get active membership or null (non-throwing) */
export async function getActiveMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  circleId: Id<'circles'>
): Promise<Doc<'memberships'> | null> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()
  if (!membership || membership.leftAt) return null
  return membership
}
