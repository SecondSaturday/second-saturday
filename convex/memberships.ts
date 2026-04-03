import { mutation, query, internalMutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { getAuthUser, getOrCreateAuthUser, getActiveMembership } from './authHelpers'

export const getCircleMembers = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is a member — return empty instead of throwing
    // so reactive queries don't hit error boundaries after leaving
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt) return []

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMembers = memberships.filter((m) => !m.leftAt)

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId)
        return {
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          name: memberUser?.name ?? memberUser?.email ?? 'Unknown',
          imageUrl: memberUser?.imageUrl,
        }
      })
    )

    return members
  },
})

export const getMembershipCount = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is a member of the circle
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt) {
      throw new Error('Not a member of this circle')
    }

    const members = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    return members.filter((m) => !m.leftAt).length
  },
})

export const joinCircle = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const user = await getOrCreateAuthUser(ctx)

    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .first()

    if (!circle) throw new Error('Invalid invite code')
    if (circle.archivedAt) throw new Error('This circle has been archived')

    // Check if already a member or previously left
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', circle._id))
      .first()

    if (existing) {
      if (existing.blocked) throw new Error('You have been blocked from this circle')
      if (!existing.leftAt) return { circleId: circle._id, alreadyMember: true }

      // Rejoin: clear leftAt and update joinedAt
      await ctx.db.patch(existing._id, { leftAt: undefined, joinedAt: Date.now() })
      return { circleId: circle._id, alreadyMember: false }
    }

    await ctx.db.insert('memberships', {
      userId: user._id,
      circleId: circle._id,
      role: 'member',
      joinedAt: Date.now(),
    })

    return { circleId: circle._id, alreadyMember: false }
  },
})

/** Get current cycle ID in YYYY-MM format */
function getCurrentCycleId(): string {
  const now = new Date(Date.now())
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** Compute deadline timestamp for a cycle (second Saturday at 10:59 UTC) */
function computeDeadline(cycleId: string): number {
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]! - 1
  const firstDay = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  return Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)
}

export const getSubmissionStatus = query({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Admin-only access
    const callerMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', args.circleId))
      .first()

    if (!callerMembership || callerMembership.leftAt || callerMembership.role !== 'admin') {
      return null
    }

    const cycleId = getCurrentCycleId()
    const deadline = computeDeadline(cycleId)

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()

    const activeMembers = memberships.filter((m) => !m.leftAt)

    const members = await Promise.all(
      activeMembers.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId)

        // Look up submission for this member in the current cycle
        const submission = await ctx.db
          .query('submissions')
          .withIndex('by_user_circle_cycle', (q) =>
            q.eq('userId', m.userId).eq('circleId', args.circleId).eq('cycleId', cycleId)
          )
          .first()

        let status: 'Submitted' | 'In Progress' | 'Not Started' = 'Not Started'
        let submittedAt: number | null = null

        if (submission) {
          if (submission.submittedAt) {
            status = 'Submitted'
            submittedAt = submission.submittedAt
          } else {
            status = 'In Progress'
          }
        }

        return {
          userId: m.userId,
          name: memberUser?.name ?? memberUser?.email ?? 'Unknown',
          imageUrl: memberUser?.imageUrl ?? null,
          status,
          submittedAt,
        }
      })
    )

    return { members, deadline }
  },
})

export const transferAdmin = mutation({
  args: {
    circleId: v.id('circles'),
    newAdminUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is current admin
    const callerMembership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Cannot transfer to yourself
    if (args.newAdminUserId === user._id) {
      throw new Error('Cannot transfer admin to yourself')
    }

    // Verify target is an active member
    const targetMembership = await getActiveMembership(ctx, args.newAdminUserId, args.circleId)
    if (!targetMembership) throw new Error('Target user is not an active member')

    // Transfer: promote target, demote caller
    await ctx.db.patch(targetMembership._id, { role: 'admin' })
    await ctx.db.patch(callerMembership._id, { role: 'member' })

    // Update adminId on the circle
    await ctx.db.patch(args.circleId, { adminId: args.newAdminUserId, updatedAt: Date.now() })

    return { success: true }
  },
})

/** Cascade-delete all data belonging to a circle */
async function cascadeDeleteCircle(ctx: MutationCtx, circleId: Id<'circles'>) {
  // 1. Delete submissions → responses → media (with storage blobs)
  const submissions = await ctx.db
    .query('submissions')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const sub of submissions) {
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_submission', (q) => q.eq('submissionId', sub._id))
      .collect()
    for (const resp of responses) {
      const mediaItems = await ctx.db
        .query('media')
        .withIndex('by_response', (q) => q.eq('responseId', resp._id))
        .collect()
      for (const m of mediaItems) {
        if (m.storageId) await ctx.storage.delete(m.storageId)
        await ctx.db.delete(m._id)
      }
      await ctx.db.delete(resp._id)
    }
    await ctx.db.delete(sub._id)
  }

  // 2. Delete prompts
  const prompts = await ctx.db
    .query('prompts')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const p of prompts) {
    await ctx.db.delete(p._id)
  }

  // 3. Delete newsletters and reads
  const newsletters = await ctx.db
    .query('newsletters')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const nl of newsletters) {
    const nlReads = await ctx.db
      .query('newsletterReads')
      .withIndex('by_newsletter', (q) => q.eq('newsletterId', nl._id))
      .collect()
    for (const r of nlReads) {
      await ctx.db.delete(r._id)
    }
    await ctx.db.delete(nl._id)
  }

  // 4. Delete videos (and schedule Mux asset cleanup)
  const videos = await ctx.db
    .query('videos')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const vid of videos) {
    if (vid.assetId) {
      await ctx.scheduler.runAfter(0, internal.videoActions.deleteMuxAsset, {
        assetId: vid.assetId,
      })
    }
    await ctx.db.delete(vid._id)
  }

  // 5. Delete admin reminders
  const reminders = await ctx.db
    .query('adminReminders')
    .withIndex('by_circle_cycle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const r of reminders) {
    await ctx.db.delete(r._id)
  }

  // 6. Delete all memberships
  const memberships = await ctx.db
    .query('memberships')
    .withIndex('by_circle', (q) => q.eq('circleId', circleId))
    .collect()
  for (const m of memberships) {
    await ctx.db.delete(m._id)
  }

  // 7. Delete circle storage blobs and the circle itself
  const circle = await ctx.db.get(circleId)
  if (circle) {
    if (circle.iconImageId) await ctx.storage.delete(circle.iconImageId)
    if (circle.coverImageId) await ctx.storage.delete(circle.coverImageId)
    await ctx.db.delete(circleId)
  }
}

export const leaveCircle = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    const membership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!membership) throw new Error('Not a member of this circle')

    // Count active members
    const allMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .collect()
    const activeMembers = allMemberships.filter((m) => !m.leftAt)

    if (membership.role === 'admin' && activeMembers.length > 1) {
      throw new Error('Transfer admin role before leaving')
    }

    // Last member leaving — cascade delete the entire circle
    if (activeMembers.length === 1) {
      await cascadeDeleteCircle(ctx, args.circleId)
      return { success: true, circleDeleted: true }
    }

    await ctx.db.patch(membership._id, { leftAt: Date.now() })
    return { success: true, circleDeleted: false }
  },
})

export const transferAdminAndLeave = mutation({
  args: {
    circleId: v.id('circles'),
    newAdminUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    const callerMembership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    if (args.newAdminUserId === user._id) {
      throw new Error('Cannot transfer admin to yourself')
    }

    const targetMembership = await getActiveMembership(ctx, args.newAdminUserId, args.circleId)
    if (!targetMembership) throw new Error('Target user is not an active member')

    // Transfer admin and leave atomically
    await ctx.db.patch(targetMembership._id, { role: 'admin' })
    await ctx.db.patch(args.circleId, { adminId: args.newAdminUserId, updatedAt: Date.now() })
    await ctx.db.patch(callerMembership._id, { leftAt: Date.now() })

    return { success: true }
  },
})

export const removeMember = mutation({
  args: {
    circleId: v.id('circles'),
    targetUserId: v.id('users'),
    keepContributions: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Verify caller is admin
    const callerMembership = await getActiveMembership(ctx, user._id, args.circleId)
    if (!callerMembership || callerMembership.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Cannot remove yourself
    if (args.targetUserId === user._id) {
      throw new Error('Cannot remove yourself. Use leave circle instead.')
    }

    // Verify target is an active member
    const targetMembership = await getActiveMembership(ctx, args.targetUserId, args.circleId)
    if (!targetMembership) throw new Error('Target user is not an active member')

    if (args.keepContributions) {
      // Remove but keep contributions — member can rejoin
      await ctx.db.patch(targetMembership._id, { leftAt: Date.now() })
    } else {
      // Remove and block — redact all contributions
      await ctx.db.patch(targetMembership._id, { leftAt: Date.now(), blocked: true })

      // Find all submissions by this user in this circle and redact responses
      const userSubmissions = await ctx.db
        .query('submissions')
        .withIndex('by_user_circle_cycle', (q) =>
          q.eq('userId', args.targetUserId).eq('circleId', args.circleId)
        )
        .collect()

      for (const submission of userSubmissions) {
        // Redact all responses for this submission
        const responses = await ctx.db
          .query('responses')
          .withIndex('by_submission', (q) => q.eq('submissionId', submission._id))
          .collect()

        for (const response of responses) {
          await ctx.db.patch(response._id, { text: '[Removed]', updatedAt: Date.now() })

          // Delete associated media
          const mediaItems = await ctx.db
            .query('media')
            .withIndex('by_response', (q) => q.eq('responseId', response._id))
            .collect()

          for (const item of mediaItems) {
            if (item.storageId) {
              await ctx.storage.delete(item.storageId)
            }
            await ctx.db.delete(item._id)
          }
        }
      }
    }

    return { success: true }
  },
})

export const getInviteStatus = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { status: 'not_authenticated' as const }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return { status: 'not_authenticated' as const }

    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .first()

    if (!circle) return { status: 'invalid_invite' as const }
    if (circle.archivedAt) return { status: 'archived' as const }

    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_circle', (q) => q.eq('userId', user._id).eq('circleId', circle._id))
      .first()

    if (!membership) return { status: 'can_join' as const }
    if (membership.blocked) return { status: 'blocked' as const }
    if (!membership.leftAt) return { status: 'already_member' as const, circleId: circle._id }

    return { status: 'can_rejoin' as const }
  },
})

/**
 * Clean up orphaned circles after a user is deleted via Clerk webhook.
 * Normal leave flow (leaveCircle) already handles admin transfer and
 * last-member cascade-delete, but the Clerk webhook bypasses that.
 * This handles two cases:
 * 1. Deleted user was the last active member → cascade-delete the circle
 * 2. Deleted user was the admin with other members → promote another member
 */
export const cleanupOrphanedCircles = internalMutation({
  args: { deletedUserId: v.id('users') },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', args.deletedUserId))
      .collect()

    for (const membership of memberships) {
      const allMembers = await ctx.db
        .query('memberships')
        .withIndex('by_circle', (q) => q.eq('circleId', membership.circleId))
        .collect()

      const activeMembers = allMembers.filter((m) => !m.leftAt && m.userId !== args.deletedUserId)

      if (activeMembers.length === 0) {
        await cascadeDeleteCircle(ctx, membership.circleId)
      } else {
        const circle = await ctx.db.get(membership.circleId)
        if (circle && circle.adminId === args.deletedUserId) {
          const newAdmin = activeMembers[0]!
          await ctx.db.patch(newAdmin._id, { role: 'admin' })
          await ctx.db.patch(membership.circleId, {
            adminId: newAdmin.userId,
            updatedAt: Date.now(),
          })
        }
      }
    }
  },
})
