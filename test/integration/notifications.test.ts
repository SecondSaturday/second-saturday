/**
 * Integration tests for notification business logic.
 *
 * Tests the rules from convex/notifications.ts in isolation,
 * following the same pattern as newsletters.test.ts.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Type definitions replicating Convex document shapes
// ---------------------------------------------------------------------------

interface User {
  _id: string
  name?: string
  email: string
  oneSignalPlayerId?: string
}

interface Membership {
  _id: string
  userId: string
  circleId: string
  role: 'admin' | 'member'
  joinedAt: number
  leftAt?: number
  blocked?: boolean
}

interface NotificationPreferences {
  _id: string
  userId: string
  submissionReminders: boolean
  newsletterReady: boolean
  createdAt: number
  updatedAt: number
}

interface AdminReminder {
  _id: string
  circleId: string
  adminUserId: string
  targetUserId?: string
  cycleId: string
  sentAt: number
}

interface Submission {
  _id: string
  circleId: string
  userId: string
  cycleId: string
  submittedAt?: number
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/notifications.ts - queries
// ---------------------------------------------------------------------------

function getNotificationPreferences(prefs: NotificationPreferences | null): {
  submissionReminders: boolean
  newsletterReady: boolean
} {
  if (!prefs) {
    return { submissionReminders: true, newsletterReady: true }
  }
  return {
    submissionReminders: prefs.submissionReminders,
    newsletterReady: prefs.newsletterReady,
  }
}

function getAdminReminderCount(
  reminders: AdminReminder[],
  adminUserId: string,
  circleId: string,
  cycleId: string
): number {
  return reminders.filter(
    (r) => r.adminUserId === adminUserId && r.circleId === circleId && r.cycleId === cycleId
  ).length
}

// ---------------------------------------------------------------------------
// Replicated logic from convex/notifications.ts - mutations
// ---------------------------------------------------------------------------

function updateNotificationPreferences(
  existing: NotificationPreferences | null,
  userId: string,
  args: { submissionReminders: boolean; newsletterReady: boolean },
  now: number
): { action: 'insert' | 'patch'; record: NotificationPreferences } {
  if (existing) {
    return {
      action: 'patch',
      record: {
        ...existing,
        submissionReminders: args.submissionReminders,
        newsletterReady: args.newsletterReady,
        updatedAt: now,
      },
    }
  }
  return {
    action: 'insert',
    record: {
      _id: `prefs_${userId}`,
      userId,
      submissionReminders: args.submissionReminders,
      newsletterReady: args.newsletterReady,
      createdAt: now,
      updatedAt: now,
    },
  }
}

function registerOneSignalPlayerId(user: User, playerId: string): User {
  return { ...user, oneSignalPlayerId: playerId }
}

function validateAdminRole(membership: Membership | null): { valid: boolean; error?: string } {
  if (!membership || membership.leftAt) {
    return { valid: false, error: 'Not a member of this circle' }
  }
  if (membership.role !== 'admin') {
    return { valid: false, error: 'Not an admin of this circle' }
  }
  return { valid: true }
}

function checkReminderLimit(existingCount: number): { allowed: boolean; error?: string } {
  if (existingCount >= 3) {
    return { allowed: false, error: 'Maximum of 3 admin reminders per cycle reached' }
  }
  return { allowed: true }
}

function validateTargetMembership(membership: Membership | null): {
  valid: boolean
  error?: string
} {
  if (!membership || membership.leftAt || membership.blocked) {
    return { valid: false, error: 'Target user is not an active member of this circle' }
  }
  return { valid: true }
}

function getNonSubmitters(
  memberships: Membership[],
  submissions: Submission[],
  cycleId: string
): Membership[] {
  const activeMembers = memberships.filter((m) => !m.leftAt && !m.blocked)
  const submittedUserIds = new Set(
    submissions.filter((s) => s.cycleId === cycleId && s.submittedAt).map((s) => s.userId)
  )
  return activeMembers.filter((m) => !submittedUserIds.has(m.userId))
}

function cleanupAdminReminders(
  reminders: AdminReminder[],
  circleId: string,
  cycleId: string
): string[] {
  return reminders.filter((r) => r.circleId === circleId && r.cycleId === cycleId).map((r) => r._id)
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const now = Date.now()

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: 'user1',
    name: 'Alice',
    email: 'alice@example.com',
    ...overrides,
  }
}

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    _id: 'mem1',
    userId: 'user1',
    circleId: 'circle1',
    role: 'member',
    joinedAt: now - 86400000,
    ...overrides,
  }
}

function makePrefs(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    _id: 'prefs1',
    userId: 'user1',
    submissionReminders: true,
    newsletterReady: true,
    createdAt: now - 86400000,
    updatedAt: now - 86400000,
    ...overrides,
  }
}

function makeReminder(overrides: Partial<AdminReminder> = {}): AdminReminder {
  return {
    _id: 'rem1',
    circleId: 'circle1',
    adminUserId: 'admin1',
    cycleId: '2026-02',
    sentAt: now,
    ...overrides,
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('updateNotificationPreferences', () => {
  it('creates new preferences when none exist (insert)', () => {
    const result = updateNotificationPreferences(
      null,
      'user1',
      {
        submissionReminders: true,
        newsletterReady: false,
      },
      now
    )

    expect(result.action).toBe('insert')
    expect(result.record.userId).toBe('user1')
    expect(result.record.submissionReminders).toBe(true)
    expect(result.record.newsletterReady).toBe(false)
    expect(result.record.createdAt).toBe(now)
    expect(result.record.updatedAt).toBe(now)
  })

  it('updates existing preferences (patch)', () => {
    const existing = makePrefs({
      submissionReminders: true,
      newsletterReady: true,
    })
    const updateTime = now + 1000

    const result = updateNotificationPreferences(
      existing,
      'user1',
      {
        submissionReminders: false,
        newsletterReady: true,
      },
      updateTime
    )

    expect(result.action).toBe('patch')
    expect(result.record.submissionReminders).toBe(false)
    expect(result.record.newsletterReady).toBe(true)
    expect(result.record.updatedAt).toBe(updateTime)
  })

  it('preserves createdAt on update', () => {
    const existing = makePrefs({ createdAt: 1000 })
    const result = updateNotificationPreferences(
      existing,
      'user1',
      {
        submissionReminders: false,
        newsletterReady: false,
      },
      now
    )

    expect(result.record.createdAt).toBe(1000)
  })

  it('updates updatedAt to new timestamp on patch', () => {
    const existing = makePrefs({ updatedAt: 1000 })
    const result = updateNotificationPreferences(
      existing,
      'user1',
      {
        submissionReminders: true,
        newsletterReady: true,
      },
      5000
    )

    expect(result.record.updatedAt).toBe(5000)
  })

  it('upsert: insert then patch produces correct state', () => {
    // First call: insert
    const insertResult = updateNotificationPreferences(
      null,
      'user1',
      {
        submissionReminders: true,
        newsletterReady: true,
      },
      1000
    )
    expect(insertResult.action).toBe('insert')

    // Second call: patch using the inserted record
    const patchResult = updateNotificationPreferences(
      insertResult.record,
      'user1',
      {
        submissionReminders: false,
        newsletterReady: true,
      },
      2000
    )
    expect(patchResult.action).toBe('patch')
    expect(patchResult.record.submissionReminders).toBe(false)
    expect(patchResult.record.newsletterReady).toBe(true)
    expect(patchResult.record.updatedAt).toBe(2000)
    expect(patchResult.record.createdAt).toBe(1000)
  })
})

describe('sendAdminReminder', () => {
  it('validates admin role - rejects non-member', () => {
    const result = validateAdminRole(null)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })

  it('validates admin role - rejects member who has left', () => {
    const membership = makeMembership({ role: 'admin', leftAt: 1000 })
    const result = validateAdminRole(membership)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Not a member of this circle')
  })

  it('validates admin role - rejects non-admin member', () => {
    const membership = makeMembership({ role: 'member' })
    const result = validateAdminRole(membership)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Not an admin of this circle')
  })

  it('validates admin role - accepts active admin', () => {
    const membership = makeMembership({ role: 'admin' })
    const result = validateAdminRole(membership)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('enforces 3 reminder limit - allows when under limit', () => {
    expect(checkReminderLimit(0).allowed).toBe(true)
    expect(checkReminderLimit(1).allowed).toBe(true)
    expect(checkReminderLimit(2).allowed).toBe(true)
  })

  it('enforces 3 reminder limit - blocks at limit', () => {
    const result = checkReminderLimit(3)
    expect(result.allowed).toBe(false)
    expect(result.error).toBe('Maximum of 3 admin reminders per cycle reached')
  })

  it('enforces 3 reminder limit - blocks above limit', () => {
    expect(checkReminderLimit(4).allowed).toBe(false)
    expect(checkReminderLimit(10).allowed).toBe(false)
  })

  it('validates target membership - rejects non-member', () => {
    const result = validateTargetMembership(null)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Target user is not an active member of this circle')
  })

  it('validates target membership - rejects member who has left', () => {
    const membership = makeMembership({ leftAt: 1000 })
    const result = validateTargetMembership(membership)
    expect(result.valid).toBe(false)
  })

  it('validates target membership - rejects blocked member', () => {
    const membership = makeMembership({ blocked: true })
    const result = validateTargetMembership(membership)
    expect(result.valid).toBe(false)
  })

  it('validates target membership - accepts active member', () => {
    const membership = makeMembership()
    const result = validateTargetMembership(membership)
    expect(result.valid).toBe(true)
  })
})

describe('sendBulkAdminReminder', () => {
  const memberships: Membership[] = [
    makeMembership({ _id: 'mem1', userId: 'u1', role: 'admin' }),
    makeMembership({ _id: 'mem2', userId: 'u2', role: 'member' }),
    makeMembership({ _id: 'mem3', userId: 'u3', role: 'member' }),
    makeMembership({ _id: 'mem4', userId: 'u4', role: 'member', leftAt: 1000 }),
    makeMembership({ _id: 'mem5', userId: 'u5', role: 'member', blocked: true }),
  ]

  it('sends to non-submitters only', () => {
    const submissions: Submission[] = [
      { _id: 's1', circleId: 'circle1', userId: 'u1', cycleId: '2026-02', submittedAt: now },
      { _id: 's2', circleId: 'circle1', userId: 'u2', cycleId: '2026-02', submittedAt: now },
    ]

    const nonSubmitters = getNonSubmitters(memberships, submissions, '2026-02')
    // u1 and u2 submitted, u4 left, u5 blocked -> only u3 remains
    expect(nonSubmitters).toHaveLength(1)
    expect(nonSubmitters[0]!.userId).toBe('u3')
  })

  it('excludes left and blocked members from bulk send', () => {
    const nonSubmitters = getNonSubmitters(memberships, [], '2026-02')
    // u4 left, u5 blocked -> u1, u2, u3 remain
    expect(nonSubmitters).toHaveLength(3)
    expect(nonSubmitters.map((m) => m.userId).sort()).toEqual(['u1', 'u2', 'u3'])
  })

  it('respects reminder limit for bulk send', () => {
    const existingReminders = [
      makeReminder({ _id: 'r1' }),
      makeReminder({ _id: 'r2' }),
      makeReminder({ _id: 'r3' }),
    ]

    const count = getAdminReminderCount(existingReminders, 'admin1', 'circle1', '2026-02')
    const limitCheck = checkReminderLimit(count)
    expect(limitCheck.allowed).toBe(false)
  })

  it('allows bulk send when under reminder limit', () => {
    const existingReminders = [makeReminder({ _id: 'r1' }), makeReminder({ _id: 'r2' })]

    const count = getAdminReminderCount(existingReminders, 'admin1', 'circle1', '2026-02')
    const limitCheck = checkReminderLimit(count)
    expect(limitCheck.allowed).toBe(true)
  })

  it('returns all active non-submitters when no submissions exist', () => {
    const nonSubmitters = getNonSubmitters(memberships, [], '2026-02')
    expect(nonSubmitters).toHaveLength(3)
  })
})

describe('getAdminReminderCount', () => {
  it('returns 0 when no reminders exist', () => {
    const count = getAdminReminderCount([], 'admin1', 'circle1', '2026-02')
    expect(count).toBe(0)
  })

  it('returns correct count for matching admin+circle+cycle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r3', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-02' }),
    ]

    expect(getAdminReminderCount(reminders, 'admin1', 'circle1', '2026-02')).toBe(3)
  })

  it('does not count reminders from a different admin', () => {
    const reminders = [
      makeReminder({ _id: 'r1', adminUserId: 'admin1' }),
      makeReminder({ _id: 'r2', adminUserId: 'admin2' }),
    ]

    expect(getAdminReminderCount(reminders, 'admin1', 'circle1', '2026-02')).toBe(1)
  })

  it('does not count reminders for a different circle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', circleId: 'circle1' }),
      makeReminder({ _id: 'r2', circleId: 'circle2' }),
    ]

    expect(getAdminReminderCount(reminders, 'admin1', 'circle1', '2026-02')).toBe(1)
  })

  it('does not count reminders for a different cycle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', cycleId: '2026-03' }),
    ]

    expect(getAdminReminderCount(reminders, 'admin1', 'circle1', '2026-02')).toBe(1)
  })

  it('filters by all three dimensions simultaneously', () => {
    const reminders = [
      makeReminder({ _id: 'r1', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', adminUserId: 'admin2', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r3', adminUserId: 'admin1', circleId: 'circle2', cycleId: '2026-02' }),
      makeReminder({ _id: 'r4', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-03' }),
    ]

    expect(getAdminReminderCount(reminders, 'admin1', 'circle1', '2026-02')).toBe(1)
  })
})

describe('cleanupAdminReminders', () => {
  it('returns IDs of all reminders matching circle+cycle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r3', circleId: 'circle1', cycleId: '2026-02' }),
    ]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toEqual(['r1', 'r2', 'r3'])
  })

  it('does not include reminders from a different circle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', circleId: 'circle2', cycleId: '2026-02' }),
    ]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toEqual(['r1'])
  })

  it('does not include reminders from a different cycle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', circleId: 'circle1', cycleId: '2026-03' }),
    ]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toEqual(['r1'])
  })

  it('returns empty array when no reminders match', () => {
    const reminders = [makeReminder({ _id: 'r1', circleId: 'circle2', cycleId: '2026-03' })]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toHaveLength(0)
  })

  it('returns empty array when no reminders exist', () => {
    const idsToDelete = cleanupAdminReminders([], 'circle1', '2026-02')
    expect(idsToDelete).toHaveLength(0)
  })

  it('cleans up reminders from multiple admins in same circle+cycle', () => {
    const reminders = [
      makeReminder({ _id: 'r1', adminUserId: 'admin1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', adminUserId: 'admin2', circleId: 'circle1', cycleId: '2026-02' }),
    ]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toEqual(['r1', 'r2'])
  })
})

describe('registerOneSignalPlayerId', () => {
  it('sets playerId on user record', () => {
    const user = makeUser()
    const result = registerOneSignalPlayerId(user, 'player_abc123')
    expect(result.oneSignalPlayerId).toBe('player_abc123')
  })

  it('preserves existing user fields', () => {
    const user = makeUser({ name: 'Alice', email: 'alice@test.com' })
    const result = registerOneSignalPlayerId(user, 'player_xyz')
    expect(result.name).toBe('Alice')
    expect(result.email).toBe('alice@test.com')
    expect(result._id).toBe(user._id)
  })

  it('overwrites existing playerId', () => {
    const user = makeUser({ oneSignalPlayerId: 'old_player' })
    const result = registerOneSignalPlayerId(user, 'new_player')
    expect(result.oneSignalPlayerId).toBe('new_player')
  })

  it('handles empty string playerId', () => {
    const user = makeUser()
    const result = registerOneSignalPlayerId(user, '')
    expect(result.oneSignalPlayerId).toBe('')
  })
})

describe('getNotificationPreferences (query)', () => {
  it('returns defaults when no prefs exist', () => {
    const result = getNotificationPreferences(null)
    expect(result).toEqual({ submissionReminders: true, newsletterReady: true })
  })

  it('returns stored values when prefs exist', () => {
    const prefs = makePrefs({ submissionReminders: false, newsletterReady: true })
    const result = getNotificationPreferences(prefs)
    expect(result.submissionReminders).toBe(false)
    expect(result.newsletterReady).toBe(true)
  })

  it('returns both false when both disabled', () => {
    const prefs = makePrefs({ submissionReminders: false, newsletterReady: false })
    const result = getNotificationPreferences(prefs)
    expect(result.submissionReminders).toBe(false)
    expect(result.newsletterReady).toBe(false)
  })

  it('returns both true when both enabled', () => {
    const prefs = makePrefs({ submissionReminders: true, newsletterReady: true })
    const result = getNotificationPreferences(prefs)
    expect(result.submissionReminders).toBe(true)
    expect(result.newsletterReady).toBe(true)
  })
})

describe('sendSubmissionReminder cron flow logic', () => {
  it('notification preference default: submissionReminders is true (opt-out model)', () => {
    // When prefs is null, default is true -> user receives reminders
    const result = getNotificationPreferences(null)
    expect(result.submissionReminders).toBe(true)
  })

  it('respects user opt-out of submission reminders', () => {
    const prefs = makePrefs({ submissionReminders: false })
    const result = getNotificationPreferences(prefs)
    expect(result.submissionReminders).toBe(false)
  })

  it('only users with oneSignalPlayerId receive push notifications', () => {
    const usersWithPlayer: User[] = [
      makeUser({ _id: 'u1', oneSignalPlayerId: 'player1' }),
      makeUser({ _id: 'u2' }), // no player ID
      makeUser({ _id: 'u3', oneSignalPlayerId: 'player3' }),
    ]

    const playerIds = usersWithPlayer
      .filter((u) => u.oneSignalPlayerId)
      .map((u) => u.oneSignalPlayerId!)

    expect(playerIds).toEqual(['player1', 'player3'])
  })
})

describe('sendNewsletterReadyNotification flow logic', () => {
  it('notification preference default: newsletterReady is true (opt-out model)', () => {
    const result = getNotificationPreferences(null)
    expect(result.newsletterReady).toBe(true)
  })

  it('respects user opt-out of newsletter ready notifications', () => {
    const prefs = makePrefs({ newsletterReady: false })
    const result = getNotificationPreferences(prefs)
    expect(result.newsletterReady).toBe(false)
  })

  it('triggers cleanup of admin reminders after newsletter send', () => {
    const reminders = [
      makeReminder({ _id: 'r1', circleId: 'circle1', cycleId: '2026-02' }),
      makeReminder({ _id: 'r2', circleId: 'circle1', cycleId: '2026-02' }),
    ]

    const idsToDelete = cleanupAdminReminders(reminders, 'circle1', '2026-02')
    expect(idsToDelete).toHaveLength(2)
  })
})

describe('adminReminder record structure', () => {
  it('bulk reminder has no targetUserId', () => {
    const bulkReminder = makeReminder({ targetUserId: undefined })
    expect(bulkReminder.targetUserId).toBeUndefined()
  })

  it('individual reminder has targetUserId set', () => {
    const reminder = makeReminder({ targetUserId: 'user2' })
    expect(reminder.targetUserId).toBe('user2')
  })

  it('reminder record includes sentAt timestamp', () => {
    const reminder = makeReminder({ sentAt: 12345 })
    expect(reminder.sentAt).toBe(12345)
  })

  it('reminder record includes all required fields', () => {
    const reminder = makeReminder()
    expect(reminder).toHaveProperty('_id')
    expect(reminder).toHaveProperty('circleId')
    expect(reminder).toHaveProperty('adminUserId')
    expect(reminder).toHaveProperty('cycleId')
    expect(reminder).toHaveProperty('sentAt')
  })
})
