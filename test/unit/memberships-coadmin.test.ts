/**
 * Unit tests for co-admin role semantics in convex/memberships.ts.
 *
 * Follows the pure-logic replication pattern from reactions.test.ts and
 * transferAdmin.test.ts: the rules enforced by each mutation are encoded as
 * small helpers that we exercise against simulated db state.
 */
import { describe, it, expect } from 'vitest'

type Membership = {
  _id: string
  userId: string
  circleId: string
  role: 'admin' | 'member'
  joinedAt: number
  leftAt?: number
  blocked?: boolean
}

type Circle = {
  _id: string
  adminId: string // owner
}

// --- Mutation logic (pure) ---

function promoteToAdmin(args: { caller: Membership | null; target: Membership | null }): {
  ok: boolean
  alreadyAdmin?: boolean
  error?: string
  nextRole?: 'admin'
} {
  if (!args.caller || args.caller.leftAt || args.caller.role !== 'admin') {
    return { ok: false, error: 'Admin access required' }
  }
  if (!args.target || args.target.leftAt) {
    return { ok: false, error: 'Target user is not an active member' }
  }
  if (args.target.role === 'admin') {
    return { ok: true, alreadyAdmin: true }
  }
  return { ok: true, alreadyAdmin: false, nextRole: 'admin' }
}

function demoteFromAdmin(args: {
  caller: Membership | null
  target: Membership | null
  circle: Circle
  allActiveMemberships: Membership[]
}): { ok: boolean; alreadyMember?: boolean; error?: string; nextRole?: 'member' } {
  if (!args.caller || args.caller.leftAt || args.caller.role !== 'admin') {
    return { ok: false, error: 'Admin access required' }
  }
  if (!args.target || args.target.leftAt) {
    return { ok: false, error: 'Target user is not an active member' }
  }
  if (args.target.role !== 'admin') {
    return { ok: true, alreadyMember: true }
  }
  if (args.circle.adminId === args.target.userId) {
    return {
      ok: false,
      error: 'Cannot demote the circle owner. Transfer ownership first.',
    }
  }
  if (args.target.userId === args.caller.userId) {
    // Self-demote: need another admin to remain.
    const otherAdmins = args.allActiveMemberships.filter(
      (m) => m.role === 'admin' && m.userId !== args.caller!.userId
    )
    if (otherAdmins.length === 0) {
      return { ok: false, error: 'At least one admin must remain' }
    }
  } else {
    // Demoting another admin requires ownership.
    if (args.circle.adminId !== args.caller.userId) {
      return { ok: false, error: 'Only the circle owner can remove a co-admin' }
    }
  }
  return { ok: true, alreadyMember: false, nextRole: 'member' }
}

function transferAdmin(args: {
  caller: Membership | null
  target: Membership | null
  circle: Circle
  callerId: string
  targetId: string
}): {
  ok: boolean
  error?: string
  outgoingCallerRole?: 'admin' | 'member'
  newOwnerId?: string
} {
  if (!args.caller || args.caller.leftAt || args.caller.role !== 'admin') {
    return { ok: false, error: 'Admin access required' }
  }
  if (args.circle.adminId !== args.callerId) {
    return { ok: false, error: 'Only the circle owner can transfer ownership' }
  }
  if (args.callerId === args.targetId) {
    return { ok: false, error: 'Cannot transfer ownership to yourself' }
  }
  if (!args.target || args.target.leftAt) {
    return { ok: false, error: 'Target user is not an active member' }
  }
  // New semantics: caller stays admin (co-admin) after transfer.
  return { ok: true, outgoingCallerRole: 'admin', newOwnerId: args.targetId }
}

function canLeaveCircle(args: {
  caller: Membership
  circle: Circle
  allActiveMemberships: Membership[]
}): { ok: boolean; error?: string } {
  const active = args.allActiveMemberships.filter((m) => !m.leftAt)
  // Last member leaving -> cascade delete path (allowed).
  if (active.length === 1 && active[0]!.userId === args.caller.userId) {
    return { ok: true }
  }
  if (args.circle.adminId === args.caller.userId && active.length > 1) {
    return { ok: false, error: 'Transfer admin role before leaving' }
  }
  if (args.caller.role === 'admin' && active.length > 1) {
    const otherAdmins = active.filter((m) => m.role === 'admin' && m.userId !== args.caller.userId)
    if (otherAdmins.length === 0) {
      return { ok: false, error: 'Transfer admin role before leaving' }
    }
  }
  return { ok: true }
}

/**
 * cleanupOrphanedCircles branch selection.
 * Returns what action to take for the given circle after the user is deleted.
 */
function cleanupOrphanedCircleAction(args: {
  circle: Circle
  deletedUserId: string
  activeMembers: Membership[]
}):
  | { kind: 'cascade' }
  | { kind: 'promote'; newAdminUserId: string; updateOwner: boolean }
  | { kind: 'rePointOwner'; newAdminUserId: string }
  | { kind: 'noop' } {
  const remaining = args.activeMembers.filter((m) => !m.leftAt && m.userId !== args.deletedUserId)
  if (remaining.length === 0) return { kind: 'cascade' }
  const activeAdmins = remaining.filter((m) => m.role === 'admin')
  if (activeAdmins.length === 0) {
    return {
      kind: 'promote',
      newAdminUserId: remaining[0]!.userId,
      updateOwner: args.circle.adminId === args.deletedUserId,
    }
  }
  if (args.circle.adminId === args.deletedUserId) {
    return { kind: 'rePointOwner', newAdminUserId: activeAdmins[0]!.userId }
  }
  return { kind: 'noop' }
}

function canDeleteCircle(args: { userId: string; circle: Circle }): {
  ok: boolean
  error?: string
} {
  if (args.circle.adminId !== args.userId) {
    return { ok: false, error: 'Owner access required' }
  }
  return { ok: true }
}

// --- Fixtures ---

const circle: Circle = { _id: 'c1', adminId: 'owner' }

const ownerMem: Membership = {
  _id: 'm-owner',
  userId: 'owner',
  circleId: 'c1',
  role: 'admin',
  joinedAt: 1,
}
const coAdminMem: Membership = {
  _id: 'm-co',
  userId: 'co',
  circleId: 'c1',
  role: 'admin',
  joinedAt: 2,
}
const memberMem: Membership = {
  _id: 'm-mem',
  userId: 'mem',
  circleId: 'c1',
  role: 'member',
  joinedAt: 3,
}
const other: Membership = {
  _id: 'm-other',
  userId: 'other',
  circleId: 'c1',
  role: 'member',
  joinedAt: 4,
}

// --- Tests ---

describe('promoteToAdmin', () => {
  it('promotes a non-admin member to admin', () => {
    const result = promoteToAdmin({ caller: ownerMem, target: memberMem })
    expect(result.ok).toBe(true)
    expect(result.alreadyAdmin).toBe(false)
    expect(result.nextRole).toBe('admin')
  })

  it('is idempotent when target is already an admin', () => {
    const result = promoteToAdmin({ caller: ownerMem, target: coAdminMem })
    expect(result.ok).toBe(true)
    expect(result.alreadyAdmin).toBe(true)
  })

  it('rejects non-admin callers', () => {
    const result = promoteToAdmin({ caller: memberMem, target: other })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Admin access required')
  })

  it('rejects inactive target', () => {
    const leftMember = { ...memberMem, leftAt: 500 }
    const result = promoteToAdmin({ caller: ownerMem, target: leftMember })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Target user is not an active member')
  })

  it('allows co-admin to promote other members', () => {
    const result = promoteToAdmin({ caller: coAdminMem, target: memberMem })
    expect(result.ok).toBe(true)
    expect(result.nextRole).toBe('admin')
  })
})

describe('demoteFromAdmin', () => {
  it('demotes an admin to member', () => {
    const result = demoteFromAdmin({
      caller: ownerMem,
      target: coAdminMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(true)
    expect(result.nextRole).toBe('member')
  })

  it('is idempotent when target is already a member', () => {
    const result = demoteFromAdmin({
      caller: ownerMem,
      target: memberMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(true)
    expect(result.alreadyMember).toBe(true)
  })

  it('cannot demote the owner', () => {
    const result = demoteFromAdmin({
      caller: coAdminMem,
      target: ownerMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Cannot demote the circle owner. Transfer ownership first.')
  })

  it('allows self-demote when another admin remains', () => {
    const result = demoteFromAdmin({
      caller: coAdminMem,
      target: coAdminMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(true)
    expect(result.nextRole).toBe('member')
  })

  it('blocks self-demote if no other admin remains', () => {
    // Scenario: the caller is the only admin in the circle.
    const soloAdmin: Membership = { ...coAdminMem, userId: 'solo' }
    const soloCircle: Circle = { _id: 'c2', adminId: 'solo' }
    // Trying to self-demote, but solo is the owner — blocked earlier by owner check.
    const result1 = demoteFromAdmin({
      caller: soloAdmin,
      target: soloAdmin,
      circle: soloCircle,
      allActiveMemberships: [soloAdmin, memberMem],
    })
    expect(result1.ok).toBe(false)
    expect(result1.error).toBe('Cannot demote the circle owner. Transfer ownership first.')

    // Non-owner sole admin (synthetic: owner left without transfer — unlikely, but tests guard)
    const soloCircle2: Circle = { _id: 'c3', adminId: 'ghost' }
    const result2 = demoteFromAdmin({
      caller: soloAdmin,
      target: soloAdmin,
      circle: soloCircle2,
      allActiveMemberships: [soloAdmin, memberMem],
    })
    expect(result2.ok).toBe(false)
    expect(result2.error).toBe('At least one admin must remain')
  })

  it('rejects non-admin callers', () => {
    const result = demoteFromAdmin({
      caller: memberMem,
      target: coAdminMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Admin access required')
  })

  it('non-owner co-admin cannot demote another co-admin', () => {
    const jane: Membership = { ...coAdminMem, _id: 'm-jane', userId: 'jane' }
    const larry: Membership = { ...coAdminMem, _id: 'm-larry', userId: 'larry' }
    const result = demoteFromAdmin({
      caller: larry,
      target: jane,
      circle, // owner is still "owner"; neither larry nor jane own the circle
      allActiveMemberships: [ownerMem, larry, jane, memberMem],
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Only the circle owner can remove a co-admin')
  })
})

describe('transferAdmin (new co-admin semantics)', () => {
  it('keeps outgoing caller as admin after transfer', () => {
    const result = transferAdmin({
      caller: ownerMem,
      target: memberMem,
      circle,
      callerId: 'owner',
      targetId: 'mem',
    })
    expect(result.ok).toBe(true)
    expect(result.outgoingCallerRole).toBe('admin')
    expect(result.newOwnerId).toBe('mem')
  })

  it('rejects non-admin callers', () => {
    const result = transferAdmin({
      caller: memberMem,
      target: ownerMem,
      circle,
      callerId: 'mem',
      targetId: 'owner',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Admin access required')
  })

  it('rejects non-owner co-admins from transferring ownership', () => {
    const result = transferAdmin({
      caller: coAdminMem,
      target: memberMem,
      circle, // owner is 'owner', not 'co'
      callerId: 'co',
      targetId: 'mem',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Only the circle owner can transfer ownership')
  })

  it('rejects self-transfer', () => {
    const result = transferAdmin({
      caller: ownerMem,
      target: ownerMem,
      circle,
      callerId: 'owner',
      targetId: 'owner',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Cannot transfer ownership to yourself')
  })
})

describe('leaveCircle admin guard', () => {
  it('blocks last remaining admin from leaving when other members present', () => {
    const result = canLeaveCircle({
      caller: ownerMem,
      circle,
      allActiveMemberships: [ownerMem, memberMem, other],
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Transfer admin role before leaving')
  })

  it('allows co-admin to leave when another admin remains', () => {
    const result = canLeaveCircle({
      caller: coAdminMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(true)
  })

  it('blocks owner from leaving even when another admin exists', () => {
    const result = canLeaveCircle({
      caller: ownerMem,
      circle,
      allActiveMemberships: [ownerMem, coAdminMem, memberMem],
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Transfer admin role before leaving')
  })

  it('allows sole member to leave (cascade-delete path)', () => {
    const result = canLeaveCircle({
      caller: ownerMem,
      circle,
      allActiveMemberships: [ownerMem],
    })
    expect(result.ok).toBe(true)
  })

  it('allows a non-admin member to leave', () => {
    const result = canLeaveCircle({
      caller: memberMem,
      circle,
      allActiveMemberships: [ownerMem, memberMem],
    })
    expect(result.ok).toBe(true)
  })
})

describe('cleanupOrphanedCircles', () => {
  it('re-points ownership to existing admin when owner is deleted and another admin exists', () => {
    const action = cleanupOrphanedCircleAction({
      circle,
      deletedUserId: 'owner',
      activeMembers: [ownerMem, coAdminMem, memberMem],
    })
    expect(action.kind).toBe('rePointOwner')
    if (action.kind === 'rePointOwner') {
      expect(action.newAdminUserId).toBe('co')
    }
  })

  it('promotes first active member when no admin remains', () => {
    const action = cleanupOrphanedCircleAction({
      circle,
      deletedUserId: 'owner',
      activeMembers: [ownerMem, memberMem, other],
    })
    expect(action.kind).toBe('promote')
    if (action.kind === 'promote') {
      expect(action.newAdminUserId).toBe('mem')
      expect(action.updateOwner).toBe(true)
    }
  })

  it('is a no-op when deleted user was not owner and admins remain', () => {
    const action = cleanupOrphanedCircleAction({
      circle,
      deletedUserId: 'mem',
      activeMembers: [ownerMem, coAdminMem, memberMem],
    })
    expect(action.kind).toBe('noop')
  })

  it('cascade-deletes when no active members remain', () => {
    const action = cleanupOrphanedCircleAction({
      circle,
      deletedUserId: 'owner',
      activeMembers: [ownerMem],
    })
    expect(action.kind).toBe('cascade')
  })
})

describe('deleteCircle owner gate', () => {
  it('rejects a non-owner admin from deleting', () => {
    const result = canDeleteCircle({ userId: 'co', circle })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Owner access required')
  })

  it('allows the owner to delete', () => {
    const result = canDeleteCircle({ userId: 'owner', circle })
    expect(result.ok).toBe(true)
  })

  it('rejects a regular member from deleting', () => {
    const result = canDeleteCircle({ userId: 'mem', circle })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Owner access required')
  })
})
