/**
 * Integration tests for membership business logic.
 *
 * Tests the rules from convex/memberships.ts in isolation.
 */
import { describe, it, expect } from 'vitest'

// Replicate logic from convex/memberships.ts

function validateJoinCircle(args: {
  inviteCode: string
  circleExists: boolean
  circleArchived: boolean
  alreadyMember: boolean
}): { valid: boolean; error?: string; alreadyMember?: boolean } {
  if (!args.circleExists) {
    return { valid: false, error: 'Invalid invite code' }
  }
  if (args.circleArchived) {
    return { valid: false, error: 'This circle has been archived' }
  }
  if (args.alreadyMember) {
    return { valid: true, alreadyMember: true }
  }
  return { valid: true, alreadyMember: false }
}

function getMemberCount(members: Array<{ userId: string }>): number {
  return members.length
}

function hasMinimumMembers(memberCount: number): boolean {
  return memberCount >= 3
}

describe('joinCircle logic', () => {
  it('rejects invalid invite code (no circle found)', () => {
    const result = validateJoinCircle({
      inviteCode: 'bad-code',
      circleExists: false,
      circleArchived: false,
      alreadyMember: false,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid invite code')
  })

  it('rejects archived circle', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: true,
      alreadyMember: false,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('archived')
  })

  it('returns alreadyMember: true if user is already a member', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
      alreadyMember: true,
    })
    expect(result.valid).toBe(true)
    expect(result.alreadyMember).toBe(true)
  })

  it('allows new member to join valid circle', () => {
    const result = validateJoinCircle({
      inviteCode: 'valid-code',
      circleExists: true,
      circleArchived: false,
      alreadyMember: false,
    })
    expect(result.valid).toBe(true)
    expect(result.alreadyMember).toBe(false)
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
    expect(hasMinimumMembers(1)).toBe(false) // admin only
    expect(hasMinimumMembers(2)).toBe(false) // admin + 1
    expect(hasMinimumMembers(3)).toBe(true) // minimum met
    expect(hasMinimumMembers(10)).toBe(true)
  })

  it('admin counts as 1 member', () => {
    // When a circle is created, admin is automatically a member
    // So memberCount starts at 1
    const memberCountAfterCreation = 1
    expect(hasMinimumMembers(memberCountAfterCreation)).toBe(false)
    expect(3 - memberCountAfterCreation).toBe(2) // need 2 more
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
