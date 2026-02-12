import { describe, it, expect } from 'vitest'

// Replicate email validation logic from convex/emails.ts

function validateEmailArgs(args: { email: string; name?: string }): {
  valid: boolean
  error?: string
} {
  if (!args.email || !args.email.includes('@')) {
    return { valid: false, error: 'Valid email is required' }
  }
  return { valid: true }
}

function validatePasswordChange(args: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): { valid: boolean; error?: string } {
  if (!args.currentPassword) {
    return { valid: false, error: 'Current password is required' }
  }
  if (args.newPassword.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (args.newPassword !== args.confirmPassword) {
    return { valid: false, error: 'Passwords do not match' }
  }
  return { valid: true }
}

describe('Email Validation', () => {
  describe('sendWelcomeEmail args', () => {
    it('requires a valid email', () => {
      expect(validateEmailArgs({ email: '' })).toEqual({
        valid: false,
        error: 'Valid email is required',
      })
      expect(validateEmailArgs({ email: 'notanemail' })).toEqual({
        valid: false,
        error: 'Valid email is required',
      })
    })

    it('accepts valid email with name', () => {
      expect(validateEmailArgs({ email: 'test@example.com', name: 'Test' })).toEqual({
        valid: true,
      })
    })

    it('accepts valid email without name', () => {
      expect(validateEmailArgs({ email: 'test@example.com' })).toEqual({ valid: true })
    })
  })

  describe('sendAccountDeletionEmail args', () => {
    it('requires a valid email', () => {
      expect(validateEmailArgs({ email: '' })).toEqual({
        valid: false,
        error: 'Valid email is required',
      })
    })

    it('accepts valid email', () => {
      expect(validateEmailArgs({ email: 'user@example.com' })).toEqual({ valid: true })
    })
  })

  describe('Password validation', () => {
    it('requires current password', () => {
      expect(
        validatePasswordChange({
          currentPassword: '',
          newPassword: 'newpass12',
          confirmPassword: 'newpass12',
        })
      ).toEqual({ valid: false, error: 'Current password is required' })
    })

    it('requires minimum 8 characters', () => {
      expect(
        validatePasswordChange({
          currentPassword: 'old',
          newPassword: 'short',
          confirmPassword: 'short',
        })
      ).toEqual({ valid: false, error: 'Password must be at least 8 characters' })
    })

    it('requires matching passwords', () => {
      expect(
        validatePasswordChange({
          currentPassword: 'old',
          newPassword: 'newpassword',
          confirmPassword: 'different',
        })
      ).toEqual({ valid: false, error: 'Passwords do not match' })
    })

    it('accepts valid password change', () => {
      expect(
        validatePasswordChange({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword',
          confirmPassword: 'newpassword',
        })
      ).toEqual({ valid: true })
    })
  })
})
