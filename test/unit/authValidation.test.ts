import { describe, it, expect } from 'vitest'
import { isImageFile, isVideoFile } from '@/lib/image'

// Replicate inline validation logic from settings page

function validatePassword(args: {
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

function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { valid: false, error: 'Display name is required' }
  }
  return { valid: true }
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Valid email is required' }
  }
  return { valid: true }
}

function createMockFile(name: string, type: string): File {
  return new File([''], name, { type })
}

describe('Password validation', () => {
  it('rejects empty current password', () => {
    const result = validatePassword({
      currentPassword: '',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Current password is required')
  })

  it('rejects new password shorter than 8 chars', () => {
    const result = validatePassword({
      currentPassword: 'oldpass',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Password must be at least 8 characters')
  })

  it('rejects 7-character password', () => {
    const result = validatePassword({
      currentPassword: 'oldpass',
      newPassword: '1234567',
      confirmPassword: '1234567',
    })
    expect(result.valid).toBe(false)
  })

  it('accepts 8-character password', () => {
    const result = validatePassword({
      currentPassword: 'oldpass',
      newPassword: '12345678',
      confirmPassword: '12345678',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = validatePassword({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'different',
    })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Passwords do not match')
  })

  it('accepts valid password change', () => {
    const result = validatePassword({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.valid).toBe(true)
  })

  it('checks current password before length', () => {
    const result = validatePassword({
      currentPassword: '',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.error).toBe('Current password is required')
  })

  it('checks length before match', () => {
    const result = validatePassword({
      currentPassword: 'old',
      newPassword: 'short',
      confirmPassword: 'diff',
    })
    expect(result.error).toBe('Password must be at least 8 characters')
  })
})

describe('Display name validation', () => {
  it('rejects empty string', () => {
    expect(validateDisplayName('').valid).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(validateDisplayName('   ').valid).toBe(false)
  })

  it('rejects tab/newline only', () => {
    expect(validateDisplayName('\t\n').valid).toBe(false)
  })

  it('accepts normal name', () => {
    expect(validateDisplayName('Alice').valid).toBe(true)
  })

  it('accepts name with surrounding whitespace (trimmed)', () => {
    expect(validateDisplayName('  Bob  ').valid).toBe(true)
  })

  it('accepts multi-word name', () => {
    expect(validateDisplayName('John Doe').valid).toBe(true)
  })
})

describe('Email format validation', () => {
  it('rejects empty string', () => {
    expect(validateEmail('').valid).toBe(false)
  })

  it('rejects string without @', () => {
    expect(validateEmail('notanemail').valid).toBe(false)
  })

  it('accepts bare @ (simple includes check)', () => {
    // Our simple validation only checks for @ presence
    expect(validateEmail('@').valid).toBe(true)
  })

  it('accepts valid email', () => {
    expect(validateEmail('user@example.com').valid).toBe(true)
  })

  it('accepts subdomain email', () => {
    expect(validateEmail('user@mail.example.com').valid).toBe(true)
  })

  it('accepts plus addressing', () => {
    expect(validateEmail('user+tag@example.com').valid).toBe(true)
  })
})

describe('Image file type validation', () => {
  it('accepts JPEG', () => {
    expect(isImageFile(createMockFile('photo.jpg', 'image/jpeg'))).toBe(true)
  })

  it('accepts PNG', () => {
    expect(isImageFile(createMockFile('photo.png', 'image/png'))).toBe(true)
  })

  it('accepts GIF', () => {
    expect(isImageFile(createMockFile('anim.gif', 'image/gif'))).toBe(true)
  })

  it('accepts WebP', () => {
    expect(isImageFile(createMockFile('photo.webp', 'image/webp'))).toBe(true)
  })

  it('rejects video file', () => {
    expect(isImageFile(createMockFile('video.mp4', 'video/mp4'))).toBe(false)
  })

  it('rejects PDF', () => {
    expect(isImageFile(createMockFile('doc.pdf', 'application/pdf'))).toBe(false)
  })

  it('rejects text file', () => {
    expect(isImageFile(createMockFile('file.txt', 'text/plain'))).toBe(false)
  })
})

describe('Video file type validation', () => {
  it('accepts MP4', () => {
    expect(isVideoFile(createMockFile('video.mp4', 'video/mp4'))).toBe(true)
  })

  it('accepts WebM', () => {
    expect(isVideoFile(createMockFile('video.webm', 'video/webm'))).toBe(true)
  })

  it('accepts QuickTime', () => {
    expect(isVideoFile(createMockFile('video.mov', 'video/quicktime'))).toBe(true)
  })

  it('rejects image file', () => {
    expect(isVideoFile(createMockFile('photo.jpg', 'image/jpeg'))).toBe(false)
  })

  it('rejects audio file', () => {
    expect(isVideoFile(createMockFile('audio.mp3', 'audio/mpeg'))).toBe(false)
  })

  it('rejects PDF', () => {
    expect(isVideoFile(createMockFile('doc.pdf', 'application/pdf'))).toBe(false)
  })
})

describe('Profile photo constraints', () => {
  it('accepts JPEG for profile photo', () => {
    expect(isImageFile(createMockFile('avatar.jpg', 'image/jpeg'))).toBe(true)
  })

  it('accepts PNG for profile photo', () => {
    expect(isImageFile(createMockFile('avatar.png', 'image/png'))).toBe(true)
  })

  it('rejects video as profile photo', () => {
    expect(isImageFile(createMockFile('avatar.mp4', 'video/mp4'))).toBe(false)
  })

  it('rejects binary as profile photo', () => {
    expect(isImageFile(createMockFile('file.bin', 'application/octet-stream'))).toBe(false)
  })
})
