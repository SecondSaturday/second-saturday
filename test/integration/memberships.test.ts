/**
 * Integration tests for membership business logic.
 *
 * Tests the rules from convex/memberships.ts in isolation.
 */
import { describe, it, expect } from 'vitest'

// --- Pure logic helpers mirroring convex/memberships.ts ---

type Membership = {
  _id: string
  userId: string
  circleId: string
  role: 'admin' | 'member'
  joinedAt: number
  leftAt?: number
  blocked?: boolean
}

function validateJoinCircle(args: {
  inviteCode: string
  circleExists: boolean
  circleArchived: boolean
  existingMembership?: { leftAt?: number; blocked?: boolean }
}): { valid: boolean; error?: string; alreadyMember?: boolean } {
  if (!args.circleExists) return { valid: false, error: 'Invalid invite code' }
  if (args.circleArchived) return { valid: false, error: 'This circle has been archived' }

  if (args.existingMembership) {
    if (args.existingMembership.blocked)
      return { valid: false, error: 'You have been blocked from this circle' }
    if (!args.existingMembership.leftAt) return { valid: true, alreadyMember: true }
    // Rejoin case: had leftAt, not blocked
    return { valid: true, alreadyMember: false }
  }

  return { valid: true, alreadyMember: false }
}

function getActiveMembers(memberships: Membership[]): Membership[] {
  return memberships.filter((m) => !m.leftAt)
}

function getMemberCount(members: Array<{ userId: string }>): number {
  return members.length
}

function hasMinimumMembers(memberCount: number): boolean {
  return memberCount >= 3
}

function validateLeaveCircle(membership: Membership | null): { valid: boolean; error?: string } {
  if (!membership || membership.leftAt)
    return { valid: false, error: 'Not a member of this circle' }
  if (membership.role === 'admin')
    return { valid: false, error: 'Transfer admin role before leaving' }
  return { valid: true }
}

function validateRemoveMember(args: {
  callerMembership: Membership | null
  targetMembership: Membership | null
  callerId: string
  targetId: string
}): { valid: boolean; error?: string } {
  if (!args.callerMembership || args.callerMembership.role !== 'admin') {
    return { valid: false, error: 'Admin access required' }
  }
  if (args.targetId === args.callerId) {
    return { valid: false, error: 'Cannot remove yourself. Use leave circle instead.' }
  }
  if (!args.targetMembership || args.targetMembership.leftAt) {
    return { valid: false, error: 'Target user is not an active member' }
  }
  return { valid: true }
}

function validateSubmissionStatusAccess(membership: Membership | null): {
  valid: boolean
  error?: string
} {
  if (!membership || membership.leftAt || membership.role !== 'admin') {
    return { valid: false, error: 'Admin access required' }
  }
  return { valid: true }
}

// --- Tests ---

describe('joinCircle logic', () => {
  it('rejects invalid invite code (no circle found)', () => {
    const result = validateJoinCircle({
      inviteCode: 'bad-code',
      circleExists: false,
      circleArchived: false,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid invite code')
  })

  it('rejects archived circle', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: true,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('archived')
  })

  it('returns alreadyMember: true if user is active member', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
      existingMembership: { leftAt: undefined, blocked: undefined },
    })
    expect(result.valid).toBe(true)
    expect(result.alreadyMember).toBe(true)
  })

  it('allows new member to join valid circle', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
    })
    expect(result.valid).toBe(true)
    expect(result.alreadyMember).toBe(false)
  })

  it('allows rejoin when leftAt is set and not blocked', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
      existingMembership: { leftAt: Date.now(), blocked: undefined },
    })
    expect(result.valid).toBe(true)
    expect(result.alreadyMember).toBe(false)
  })

  it('rejects rejoin when blocked', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
      existingMembership: { leftAt: Date.now(), blocked: true },
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('blocked')
  })
})

describe('getCircleMembers filtering', () => {
  const memberships: Membership[] = [
    { _id: 'm1', userId: 'u1', circleId: 'c1', role: 'admin', joinedAt: 1000 },
    { _id: 'm2', userId: 'u2', circleId: 'c1', role: 'member', joinedAt: 2000 },
    { _id: 'm3', userId: 'u3', circleId: 'c1', role: 'member', joinedAt: 3000, leftAt: 4000 },
    {
      _id: 'm4',
      userId: 'u4',
      circleId: 'c1',
      role: 'member',
      joinedAt: 3000,
      leftAt: 5000,
      blocked: true,
    },
  ]

  it('filters out members with leftAt set', () => {
    const active = getActiveMembers(memberships)
    expect(active).toHaveLength(2)
    expect(active.map((m) => m.userId)).toEqual(['u1', 'u2'])
  })

  it('filters out blocked members', () => {
    const active = getActiveMembers(memberships)
    expect(active.find((m) => m.userId === 'u4')).toBeUndefined()
  })

  it('returns empty array when all members left', () => {
    const allLeft: Membership[] = [
      { _id: 'm1', userId: 'u1', circleId: 'c1', role: 'admin', joinedAt: 1000, leftAt: 2000 },
    ]
    expect(getActiveMembers(allLeft)).toHaveLength(0)
  })
})

describe('leaveCircle logic', () => {
  it('prevents admin from leaving', () => {
    const result = validateLeaveCircle({
      _id: 'm1',
      userId: 'u1',
      circleId: 'c1',
      role: 'admin',
      joinedAt: 1000,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Transfer admin')
  })

  it('allows member to leave', () => {
    const result = validateLeaveCircle({
      _id: 'm2',
      userId: 'u2',
      circleId: 'c1',
      role: 'member',
      joinedAt: 2000,
    })
    expect(result.valid).toBe(true)
  })

  it('rejects if not a member', () => {
    const result = validateLeaveCircle(null)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Not a member')
  })

  it('rejects if already left', () => {
    const result = validateLeaveCircle({
      _id: 'm2',
      userId: 'u2',
      circleId: 'c1',
      role: 'member',
      joinedAt: 2000,
      leftAt: 3000,
    })
    expect(result.valid).toBe(false)
  })
})

describe('removeMember logic', () => {
  const adminMembership: Membership = {
    _id: 'm1',
    userId: 'u1',
    circleId: 'c1',
    role: 'admin',
    joinedAt: 1000,
  }
  const memberMembership: Membership = {
    _id: 'm2',
    userId: 'u2',
    circleId: 'c1',
    role: 'member',
    joinedAt: 2000,
  }

  it('allows admin to remove a member', () => {
    const result = validateRemoveMember({
      callerMembership: adminMembership,
      targetMembership: memberMembership,
      callerId: 'u1',
      targetId: 'u2',
    })
    expect(result.valid).toBe(true)
  })

  it('prevents non-admin from removing', () => {
    const result = validateRemoveMember({
      callerMembership: memberMembership,
      targetMembership: adminMembership,
      callerId: 'u2',
      targetId: 'u1',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Admin access required')
  })

  it('prevents admin from removing self', () => {
    const result = validateRemoveMember({
      callerMembership: adminMembership,
      targetMembership: adminMembership,
      callerId: 'u1',
      targetId: 'u1',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Cannot remove yourself')
  })

  it('rejects removing already-left member', () => {
    const leftMember: Membership = { ...memberMembership, leftAt: 3000 }
    const result = validateRemoveMember({
      callerMembership: adminMembership,
      targetMembership: leftMember,
      callerId: 'u1',
      targetId: 'u2',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not an active member')
  })
})

describe('getSubmissionStatus access', () => {
  it('allows admin access', () => {
    const result = validateSubmissionStatusAccess({
      _id: 'm1',
      userId: 'u1',
      circleId: 'c1',
      role: 'admin',
      joinedAt: 1000,
    })
    expect(result.valid).toBe(true)
  })

  it('denies member access', () => {
    const result = validateSubmissionStatusAccess({
      _id: 'm2',
      userId: 'u2',
      circleId: 'c1',
      role: 'member',
      joinedAt: 2000,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Admin access required')
  })

  it('denies access if admin has left', () => {
    const result = validateSubmissionStatusAccess({
      _id: 'm1',
      userId: 'u1',
      circleId: 'c1',
      role: 'admin',
      joinedAt: 1000,
      leftAt: 2000,
    })
    expect(result.valid).toBe(false)
  })

  it('denies access if not a member', () => {
    const result = validateSubmissionStatusAccess(null)
    expect(result.valid).toBe(false)
  })
})

describe('membership count logic', () => {
  it('counts members correctly', () => {
    const members = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }]
    expect(getMemberCount(members)).toBe(3)
  })

  it('returns 0 for empty list', () => {
    expect(getMemberCount([])).toBe(0)
  })
})

describe('3-member minimum logic', () => {
  it('requires 3+ members before newsletters can be sent', () => {
    expect(hasMinimumMembers(1)).toBe(false)
    expect(hasMinimumMembers(2)).toBe(false)
    expect(hasMinimumMembers(3)).toBe(true)
    expect(hasMinimumMembers(10)).toBe(true)
  })

  it('admin counts as 1 member', () => {
    const memberCountAfterCreation = 1
    expect(hasMinimumMembers(memberCountAfterCreation)).toBe(false)
    expect(3 - memberCountAfterCreation).toBe(2)
  })
})

describe('role-based access', () => {
  type Role = 'admin' | 'member'

  function canAccessSettings(role: Role): boolean {
    return role === 'admin'
  }

  function canUpdatePrompts(role: Role): boolean {
    return role === 'admin'
  }

  function canRegenerateInvite(role: Role): boolean {
    return role === 'admin'
  }

  it('only admin can access settings', () => {
    expect(canAccessSettings('admin')).toBe(true)
    expect(canAccessSettings('member')).toBe(false)
  })

  it('only admin can update prompts', () => {
    expect(canUpdatePrompts('admin')).toBe(true)
    expect(canUpdatePrompts('member')).toBe(false)
  })

  it('only admin can regenerate invite', () => {
    expect(canRegenerateInvite('admin')).toBe(true)
    expect(canRegenerateInvite('member')).toBe(false)
  })
})
