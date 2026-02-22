import {
  mutation,
  query,
  internalQuery,
  internalAction,
  internalMutation,
} from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'

/** Get the authenticated user or throw */
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

/** Check if user is an admin of the circle */
async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Doc<'users'>['_id'],
  circleId: Doc<'circles'>['_id']
): Promise<Doc<'memberships'>> {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_circle', (q) => q.eq('userId', userId).eq('circleId', circleId))
    .first()

  if (!membership || membership.leftAt) throw new Error('Not a member of this circle')
  if (membership.role !== 'admin') throw new Error('Not an admin of this circle')
  return membership
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's notification preferences.
 * If none exist, returns defaults.
 */
export const getNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)

    const prefs = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    if (!prefs) {
      return { submissionReminders: true, newsletterReady: true }
    }

    return {
      submissionReminders: prefs.submissionReminders,
      newsletterReady: prefs.newsletterReady,
    }
  },
})

/**
 * Returns count of admin reminders for a given circle + cycle.
 */
export const getAdminReminderCount = query({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    const reminders = await ctx.db
      .query('adminReminders')
      .withIndex('by_admin_circle_cycle', (q) =>
        q.eq('adminUserId', user._id).eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .collect()

    return reminders.length
  },
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates or updates the authenticated user's notification preferences.
 */
export const updateNotificationPreferences = mutation({
  args: {
    submissionReminders: v.boolean(),
    newsletterReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const now = Date.now()

    const existing = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        submissionReminders: args.submissionReminders,
        newsletterReady: args.newsletterReady,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('notificationPreferences', {
        userId: user._id,
        submissionReminders: args.submissionReminders,
        newsletterReady: args.newsletterReady,
        createdAt: now,
        updatedAt: now,
      })
    }

    return { success: true }
  },
})

/**
 * Registers a OneSignal player ID on the authenticated user's record.
 */
export const registerOneSignalPlayerId = mutation({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await ctx.db.patch(user._id, { oneSignalPlayerId: args.playerId })
    return { success: true }
  },
})

/**
 * Send an admin reminder to a specific user.
 * Validates admin role and max 3 reminders per cycle.
 */
export const sendAdminReminder = mutation({
  args: {
    circleId: v.id('circles'),
    targetUserId: v.id('users'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await requireAdmin(ctx, user._id, args.circleId)

    // Check max 3 reminders per cycle
    const existingReminders = await ctx.db
      .query('adminReminders')
      .withIndex('by_admin_circle_cycle', (q) =>
        q.eq('adminUserId', user._id).eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .collect()

    if (existingReminders.length >= 3) {
      throw new Error('Maximum of 3 admin reminders per cycle reached')
    }

    // Insert reminder row
    await ctx.db.insert('adminReminders', {
      circleId: args.circleId,
      adminUserId: user._id,
      targetUserId: args.targetUserId,
      cycleId: args.cycleId,
      sentAt: Date.now(),
    })

    // Verify target is an active member of the circle
    const targetMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) =>
        q.eq('userId', args.targetUserId).eq('circleId', args.circleId)
      )
      .first()
    if (!targetMembership || targetMembership.leftAt || targetMembership.blocked) {
      throw new Error('Target user is not an active member of this circle')
    }

    // Get target user's player ID for push notification
    const targetUser = await ctx.db.get(args.targetUserId)
    if (targetUser?.oneSignalPlayerId) {
      const circle = await ctx.db.get(args.circleId)
      await ctx.scheduler.runAfter(0, internal.notificationPush.sendPushNotification, {
        playerIds: [targetUser.oneSignalPlayerId],
        title: 'Submission Reminder',
        message: `Your admin in ${circle?.name ?? 'your circle'} is reminding you to submit!`,
        data: { type: 'admin_reminder', circleId: args.circleId, cycleId: args.cycleId },
      })
    }

    return { success: true }
  },
})

/**
 * Send a bulk admin reminder to all non-submitters in a circle for a cycle.
 * Validates admin role and max 3 reminders per cycle.
 */
export const sendBulkAdminReminder = mutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    await requireAdmin(ctx, user._id, args.circleId)

    // Check max 3 reminders per cycle
    const existingReminders = await ctx.db
      .query('adminReminders')
      .withIndex('by_admin_circle_cycle', (q) =>
        q.eq('adminUserId', user._id).eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .collect()

    if (existingReminders.length >= 3) {
      throw new Error('Maximum of 3 admin reminders per cycle reached')
    }

    // Insert a single reminder row with no targetUserId (bulk)
    await ctx.db.insert('adminReminders', {
      circleId: args.circleId,
      adminUserId: user._id,
      cycleId: args.cycleId,
      sentAt: Date.now(),
    })

    // Get non-submitters and their player IDs
    const nonSubmitters = await getNonSubmittersInternal(ctx, args.circleId, args.cycleId)
    const playerIds: string[] = []

    for (const member of nonSubmitters) {
      const memberUser = await ctx.db.get(member.userId)
      if (memberUser?.oneSignalPlayerId) {
        playerIds.push(memberUser.oneSignalPlayerId)
      }
    }

    if (playerIds.length > 0) {
      const circle = await ctx.db.get(args.circleId)
      await ctx.scheduler.runAfter(0, internal.notificationPush.sendPushNotification, {
        playerIds,
        title: 'Submission Reminder',
        message: `Your admin in ${circle?.name ?? 'your circle'} is reminding you to submit!`,
        data: { type: 'admin_reminder', circleId: args.circleId, cycleId: args.cycleId },
      })
    }

    return { success: true, notifiedCount: playerIds.length }
  },
})

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Shared logic for finding non-submitters (used by both mutation and internalQuery).
 */
async function getNonSubmittersInternal(
  ctx: QueryCtx | MutationCtx,
  circleId: Doc<'circles'>['_id'],
  cycleId: string
) {
  // Get active members
  const allMemberships = await ctx.db
    .query('memberships')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()

  const activeMembers = allMemberships.filter((m) => !m.leftAt && !m.blocked)

  // Get submissions for this cycle
  const allSubmissions = await ctx.db
    .query('submissions')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()

  const submittedUserIds = new Set(
    allSubmissions
      .filter((s) => s.cycleId === cycleId && s.submittedAt)
      .map((s) => s.userId as string)
  )

  // Return members who haven't submitted
  return activeMembers.filter((m) => !submittedUserIds.has(m.userId as string))
}

// ---------------------------------------------------------------------------
// Internal Queries
// ---------------------------------------------------------------------------

/**
 * Returns active members who haven't submitted for a given circle + cycle.
 */
export const getNonSubmitters = internalQuery({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    return getNonSubmittersInternal(ctx, args.circleId, args.cycleId)
  },
})

// ---------------------------------------------------------------------------
// Internal Actions (cron / scheduled)
// ---------------------------------------------------------------------------

/**
 * Check if the coming Saturday (3 days from Wednesday) is the second Saturday
 * of its month.
 */
function isComingSaturdaySecondSaturday(): boolean {
  const now = new Date()
  // The cron runs on Wednesday; the coming Saturday is 3 days later
  const saturday = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const day = saturday.getUTCDate()
  // Second Saturday falls between day 8 and day 14
  return saturday.getUTCDay() === 6 && day >= 8 && day <= 14
}

/**
 * Cron-triggered action: send submission reminders to non-submitters
 * in all active circles. Only fires on the Wednesday before the second Saturday.
 */
export const sendSubmissionReminder = internalAction({
  args: {},
  handler: async (ctx) => {
    // Only send reminders on the Wednesday before the second Saturday
    if (!isComingSaturdaySecondSaturday()) {
      console.log('Coming Saturday is not the second Saturday — skipping reminders')
      return
    }

    // Calculate current cycleId (YYYY-MM)
    const now = new Date()
    const cycleId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

    // Get all active circles
    const circles = await ctx.runQuery(internal.newsletterHelpers.getAllActiveCircles, {})

    for (const circle of circles) {
      try {
        // Get non-submitters for this circle + cycle
        const nonSubmitters = await ctx.runQuery(internal.notifications.getNonSubmitters, {
          circleId: circle._id,
          cycleId,
        })

        const playerIds: string[] = []

        for (const member of nonSubmitters) {
          // Check notification preferences
          const prefs = await ctx.runQuery(
            internal.notifications.getNotificationPreferencesByUser,
            { userId: member.userId }
          )

          // Default to true if no preferences row
          if (prefs === null || prefs.submissionReminders) {
            const user = await ctx.runQuery(internal.notifications.getUserById, {
              userId: member.userId,
            })
            if (user?.oneSignalPlayerId) {
              playerIds.push(user.oneSignalPlayerId)
            }
          }
        }

        if (playerIds.length > 0) {
          await ctx.scheduler.runAfter(0, internal.notificationPush.sendPushNotification, {
            playerIds,
            title: 'Submission Reminder',
            message: `Don't forget to submit to ${circle.name} before Saturday's deadline!`,
            data: { type: 'submission_reminder', circleId: circle._id as string },
          })
          console.log(
            `Sent submission reminders for ${circle.name}: ${playerIds.length} recipients`
          )
        }
      } catch (error) {
        console.error(`Failed to send reminders for circle ${circle.name}:`, error)
      }
    }
  },
})

/**
 * Notify all circle members (who have newsletterReady enabled) that
 * a new newsletter has been published.
 */
export const sendNewsletterReadyNotification = internalAction({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const { circleId, cycleId } = args

    // Get circle name
    const circles = await ctx.runQuery(internal.newsletterHelpers.getAllActiveCircles, {})
    const circle = circles.find((c: { _id: string }) => c._id === circleId)
    const circleName = circle?.name ?? 'your circle'

    // Get active members
    const members = await ctx.runQuery(internal.notifications.getActiveMembers, { circleId })

    const playerIds: string[] = []

    for (const member of members) {
      // Check notification preferences (default newsletterReady = true)
      const prefs = await ctx.runQuery(internal.notifications.getNotificationPreferencesByUser, {
        userId: member.userId,
      })

      if (prefs === null || prefs.newsletterReady) {
        const user = await ctx.runQuery(internal.notifications.getUserById, {
          userId: member.userId,
        })
        if (user?.oneSignalPlayerId) {
          playerIds.push(user.oneSignalPlayerId)
        }
      }
    }

    if (playerIds.length > 0) {
      await ctx.scheduler.runAfter(0, internal.notificationPush.sendPushNotification, {
        playerIds,
        title: 'Newsletter Ready!',
        message: `The latest ${circleName} newsletter is ready to read!`,
        data: { type: 'newsletter_ready', circleId: circleId as string },
      })
      console.log(
        `Sent newsletter-ready notifications for ${circleName}: ${playerIds.length} recipients`
      )
    }

    // Schedule cleanup of adminReminders for this cycle
    await ctx.scheduler.runAfter(0, internal.notifications.cleanupAdminReminders, {
      circleId,
      cycleId,
    })
  },
})

// ---------------------------------------------------------------------------
// Internal Queries (used by internal actions above)
// ---------------------------------------------------------------------------

/**
 * Get notification preferences for a user by userId (no auth check).
 */
export const getNotificationPreferencesByUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('notificationPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first()
  },
})

/**
 * Get a user by ID (no auth check, for internal use).
 */
export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId)
  },
})

/**
 * Get active (non-left, non-blocked) members of a circle.
 */
export const getActiveMembers = internalQuery({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    return all.filter((m) => !m.leftAt && !m.blocked)
  },
})

// ---------------------------------------------------------------------------
// Internal Mutations
// ---------------------------------------------------------------------------

/**
 * Delete all adminReminder rows for a given circle + cycle.
 * Called after newsletter is sent to clean up stale reminders.
 */
export const cleanupAdminReminders = internalMutation({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query('adminReminders')
      .withIndex('by_circle_cycle', (q) =>
        q.eq('circleId', args.circleId).eq('cycleId', args.cycleId)
      )
      .collect()

    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id)
    }

    if (reminders.length > 0) {
      console.log(
        `Cleaned up ${reminders.length} admin reminders for circle ${args.circleId}, cycle ${args.cycleId}`
      )
    }
  },
})
