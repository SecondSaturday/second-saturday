/**
 * Integration tests for email flow logic.
 *
 * These test the validation and scheduling logic embedded in Convex functions
 * by replicating the rules in isolation. True end-to-end Convex
 * integration tests require a running Convex backend (tested via E2E).
 */
import { describe, it, expect } from 'vitest'

// Replicate the email trigger logic from convex/http.ts and convex/users.ts

interface WebhookPayload {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
  }
}

function extractEmailFromWebhook(payload: WebhookPayload): {
  email?: string
  name?: string
  shouldSendWelcome: boolean
} {
  const email = payload.data.email_addresses?.[0]?.email_address
  const name =
    [payload.data.first_name, payload.data.last_name].filter(Boolean).join(' ') || undefined

  return {
    email,
    name,
    shouldSendWelcome: payload.type === 'user.created' && !!email,
  }
}

function extractEmailBeforeDeletion(
  user: {
    email: string
    name?: string
  } | null
): { email?: string; name?: string; shouldSendDeletion: boolean } {
  if (!user) return { shouldSendDeletion: false }
  return { email: user.email, name: user.name, shouldSendDeletion: true }
}

describe('Email Flow Logic', () => {
  describe('Welcome email trigger (user.created webhook)', () => {
    it('triggers welcome email on user.created with valid email', () => {
      const result = extractEmailFromWebhook({
        type: 'user.created',
        data: {
          id: 'user_123',
          email_addresses: [{ email_address: 'test@example.com' }],
          first_name: 'John',
          last_name: 'Doe',
        },
      })
      expect(result.shouldSendWelcome).toBe(true)
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('John Doe')
    })

    it('does not trigger welcome email on user.updated', () => {
      const result = extractEmailFromWebhook({
        type: 'user.updated',
        data: {
          id: 'user_123',
          email_addresses: [{ email_address: 'test@example.com' }],
        },
      })
      expect(result.shouldSendWelcome).toBe(false)
    })

    it('does not trigger welcome email without email', () => {
      const result = extractEmailFromWebhook({
        type: 'user.created',
        data: { id: 'user_123' },
      })
      expect(result.shouldSendWelcome).toBe(false)
    })

    it('handles missing name gracefully', () => {
      const result = extractEmailFromWebhook({
        type: 'user.created',
        data: {
          id: 'user_123',
          email_addresses: [{ email_address: 'test@example.com' }],
        },
      })
      expect(result.shouldSendWelcome).toBe(true)
      expect(result.name).toBeUndefined()
    })
  })

  describe('Account deletion email trigger', () => {
    it('captures email before deletion', () => {
      const result = extractEmailBeforeDeletion({
        email: 'test@example.com',
        name: 'John',
      })
      expect(result.shouldSendDeletion).toBe(true)
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('John')
    })

    it('handles missing user', () => {
      const result = extractEmailBeforeDeletion(null)
      expect(result.shouldSendDeletion).toBe(false)
    })

    it('handles user without name', () => {
      const result = extractEmailBeforeDeletion({ email: 'test@example.com' })
      expect(result.shouldSendDeletion).toBe(true)
      expect(result.name).toBeUndefined()
    })
  })
})
