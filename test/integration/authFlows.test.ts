/**
 * Integration tests for auth flow logic.
 *
 * These replicate the business logic from auth-related Convex functions
 * and UI flows in isolation. True end-to-end tests require a running
 * Convex backend (tested via E2E / Playwright).
 */
import { describe, it, expect } from 'vitest'

// --- Replicate webhook routing logic from convex/http.ts ---

interface ClerkWebhookPayload {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
  }
}

function routeWebhookEvent(payload: ClerkWebhookPayload): {
  action: 'upsert' | 'delete' | 'ignore'
  sendWelcome: boolean
  userData?: { clerkId: string; email?: string; name?: string; imageUrl?: string }
} {
  const { type, data } = payload
  const email = data.email_addresses?.[0]?.email_address
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

  switch (type) {
    case 'user.created':
      if (!email) return { action: 'ignore', sendWelcome: false }
      // Note: name is NOT passed to upsert on user.created (let user set it on /complete-profile)
      return {
        action: 'upsert',
        sendWelcome: true,
        userData: { clerkId: data.id, email, imageUrl: data.image_url },
      }
    case 'user.updated':
      if (!email) return { action: 'ignore', sendWelcome: false }
      return {
        action: 'upsert',
        sendWelcome: false,
        userData: { clerkId: data.id, email, name, imageUrl: data.image_url },
      }
    case 'user.deleted':
      return { action: 'delete', sendWelcome: false, userData: { clerkId: data.id } }
    default:
      return { action: 'ignore', sendWelcome: false }
  }
}

// --- Replicate profile update validation logic ---

function validateProfileUpdate(args: {
  name?: string
  avatarStorageId?: string
  isAuthenticated: boolean
}): { valid: boolean; error?: string } {
  if (!args.isAuthenticated) return { valid: false, error: 'Not authenticated' }
  if (args.name !== undefined && args.name.trim() === '') {
    return { valid: false, error: 'Name cannot be empty' }
  }
  return { valid: true }
}

// --- Replicate account deletion pre-checks from convex/users.ts ---

interface MockUser {
  _id: string
  clerkId: string
  email: string
  name?: string
}

interface MockCircle {
  adminId: string
  archivedAt?: number
}

interface MockMembership {
  userId: string
  leftAt?: number
}

interface MockSubmission {
  userId: string
}

function canDeleteAccount(
  user: MockUser | null,
  circles: MockCircle[],
  memberships: MockMembership[],
  submissions: MockSubmission[]
): {
  allowed: boolean
  error?: string
  membershipsToPatch: number
  contentToDelete: number
} {
  if (!user)
    return { allowed: false, error: 'User not found', membershipsToPatch: 0, contentToDelete: 0 }

  const activeAdminCircles = circles.filter((c) => c.adminId === user._id && !c.archivedAt)
  if (activeAdminCircles.length > 0) {
    return {
      allowed: false,
      error: 'You must transfer or archive your circles before deleting your account',
      membershipsToPatch: 0,
      contentToDelete: 0,
    }
  }

  const activeMemberships = memberships.filter((m) => m.userId === user._id && !m.leftAt)
  const userSubmissions = submissions.filter((s) => s.userId === user._id)

  return {
    allowed: true,
    membershipsToPatch: activeMemberships.length,
    contentToDelete: userSubmissions.length,
  }
}

// --- Replicate re-auth check logic ---

function requiresPasswordReauth(user: { passwordEnabled: boolean }): 'password' | 'oauth_confirm' {
  return user.passwordEnabled ? 'password' : 'oauth_confirm'
}

// --- Replicate timezone sync logic ---

function shouldSyncTimezone(user: { timezone?: string } | null): boolean {
  return !!user && !user.timezone
}

// --- Tests ---

describe('Webhook routing logic', () => {
  it('routes user.created with email to upsert + welcome', () => {
    const result = routeWebhookEvent({
      type: 'user.created',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'new@test.com' }],
        first_name: 'Jane',
        last_name: 'Doe',
        image_url: 'https://img.clerk.com/abc',
      },
    })
    expect(result.action).toBe('upsert')
    expect(result.sendWelcome).toBe(true)
    expect(result.userData).toEqual({
      clerkId: 'user_abc',
      email: 'new@test.com',
      imageUrl: 'https://img.clerk.com/abc',
    })
  })

  it('routes user.created without email to ignore', () => {
    const result = routeWebhookEvent({
      type: 'user.created',
      data: { id: 'user_abc' },
    })
    expect(result.action).toBe('ignore')
    expect(result.sendWelcome).toBe(false)
  })

  it('routes user.updated to upsert without welcome', () => {
    const result = routeWebhookEvent({
      type: 'user.updated',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'updated@test.com' }],
        first_name: 'Jane',
      },
    })
    expect(result.action).toBe('upsert')
    expect(result.sendWelcome).toBe(false)
    expect(result.userData?.email).toBe('updated@test.com')
  })

  it('routes user.updated without email to ignore', () => {
    const result = routeWebhookEvent({
      type: 'user.updated',
      data: { id: 'user_abc' },
    })
    expect(result.action).toBe('ignore')
  })

  it('routes user.deleted to delete', () => {
    const result = routeWebhookEvent({
      type: 'user.deleted',
      data: { id: 'user_abc' },
    })
    expect(result.action).toBe('delete')
    expect(result.sendWelcome).toBe(false)
  })

  it('routes unknown event type to ignore', () => {
    const result = routeWebhookEvent({
      type: 'session.created',
      data: { id: 'sess_abc' },
    })
    expect(result.action).toBe('ignore')
  })

  it('user.created does not include name (deferred to /complete-profile)', () => {
    const result = routeWebhookEvent({
      type: 'user.created',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'a@b.com' }],
        first_name: 'First',
        last_name: 'Last',
      },
    })
    expect(result.userData?.name).toBeUndefined()
  })

  it('user.updated constructs name from first + last', () => {
    const result = routeWebhookEvent({
      type: 'user.updated',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'a@b.com' }],
        first_name: 'First',
        last_name: 'Last',
      },
    })
    expect(result.userData?.name).toBe('First Last')
  })

  it('user.updated handles first name only', () => {
    const result = routeWebhookEvent({
      type: 'user.updated',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'a@b.com' }],
        first_name: 'Solo',
      },
    })
    expect(result.userData?.name).toBe('Solo')
  })

  it('user.updated handles missing name fields', () => {
    const result = routeWebhookEvent({
      type: 'user.updated',
      data: {
        id: 'user_abc',
        email_addresses: [{ email_address: 'a@b.com' }],
      },
    })
    expect(result.userData?.name).toBeUndefined()
  })
})

describe('Profile update validation', () => {
  it('rejects unauthenticated user', () => {
    const result = validateProfileUpdate({ isAuthenticated: false })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('rejects empty name', () => {
    const result = validateProfileUpdate({ name: '  ', isAuthenticated: true })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Name cannot be empty')
  })

  it('accepts valid name update', () => {
    const result = validateProfileUpdate({ name: 'Alice', isAuthenticated: true })
    expect(result.valid).toBe(true)
  })

  it('accepts avatar-only update', () => {
    const result = validateProfileUpdate({ avatarStorageId: 'storage_123', isAuthenticated: true })
    expect(result.valid).toBe(true)
  })

  it('accepts combined name + avatar update', () => {
    const result = validateProfileUpdate({
      name: 'Bob',
      avatarStorageId: 'storage_123',
      isAuthenticated: true,
    })
    expect(result.valid).toBe(true)
  })
})

describe('Account deletion pre-checks', () => {
  const user: MockUser = { _id: 'u1', clerkId: 'clerk_1', email: 'test@test.com', name: 'Test' }

  it('blocks if user is admin of active circle', () => {
    const result = canDeleteAccount(user, [{ adminId: 'u1' }], [], [])
    expect(result.allowed).toBe(false)
    expect(result.error).toContain('transfer or archive')
  })

  it('allows if user is admin of only archived circles', () => {
    const result = canDeleteAccount(user, [{ adminId: 'u1', archivedAt: 1000 }], [], [])
    expect(result.allowed).toBe(true)
  })

  it('allows if user is not admin of any circle', () => {
    const result = canDeleteAccount(user, [], [], [])
    expect(result.allowed).toBe(true)
  })

  it('counts active memberships to patch', () => {
    const result = canDeleteAccount(
      user,
      [],
      [{ userId: 'u1' }, { userId: 'u1', leftAt: 1000 }, { userId: 'u1' }],
      []
    )
    expect(result.allowed).toBe(true)
    expect(result.membershipsToPatch).toBe(2)
  })

  it('counts content to delete', () => {
    const result = canDeleteAccount(
      user,
      [],
      [],
      [{ userId: 'u1' }, { userId: 'u1' }, { userId: 'u1' }]
    )
    expect(result.contentToDelete).toBe(3)
  })

  it('rejects null user', () => {
    const result = canDeleteAccount(null, [], [], [])
    expect(result.allowed).toBe(false)
    expect(result.error).toBe('User not found')
  })

  it('ignores other users circles', () => {
    const result = canDeleteAccount(user, [{ adminId: 'other_user' }], [], [])
    expect(result.allowed).toBe(true)
  })
})

describe('Re-authentication for deletion', () => {
  it('requires password for password-enabled users', () => {
    expect(requiresPasswordReauth({ passwordEnabled: true })).toBe('password')
  })

  it('requires OAuth confirm for OAuth-only users', () => {
    expect(requiresPasswordReauth({ passwordEnabled: false })).toBe('oauth_confirm')
  })
})

describe('Timezone sync logic', () => {
  it('should sync when user has no timezone', () => {
    expect(shouldSyncTimezone({ timezone: undefined })).toBe(true)
  })

  it('should not sync when user already has timezone', () => {
    expect(shouldSyncTimezone({ timezone: 'America/New_York' })).toBe(false)
  })

  it('should not sync for null user', () => {
    expect(shouldSyncTimezone(null)).toBe(false)
  })
})

describe('Signup flow: complete profile logic', () => {
  function shouldRedirectToCompleteProfile(user: { name?: string } | null): boolean {
    if (!user) return false
    return !user.name
  }

  it('redirects when user has no name', () => {
    expect(shouldRedirectToCompleteProfile({ name: undefined })).toBe(true)
  })

  it('does not redirect when user has name', () => {
    expect(shouldRedirectToCompleteProfile({ name: 'Alice' })).toBe(false)
  })

  it('does not redirect for null user (not loaded)', () => {
    expect(shouldRedirectToCompleteProfile(null)).toBe(false)
  })
})
