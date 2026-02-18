import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Clerk
const mockUpdatePassword = vi.fn()
const mockDelete = vi.fn()
let mockPasswordEnabled = true

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      fullName: 'Test User',
      firstName: 'Test',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      imageUrl: 'https://example.com/avatar.jpg',
      passwordEnabled: mockPasswordEnabled,
      updatePassword: mockUpdatePassword,
      delete: mockDelete,
    },
  }),
}))

// Mock Convex
const mockUpdateProfile = vi.fn()
const mockDeleteAccount = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: () => ({
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    imageUrl: 'https://example.com/avatar.jpg',
  }),
  useMutation: (fn: { _name: string }) => {
    if (fn._name === 'users:updateProfile') return mockUpdateProfile
    if (fn._name === 'users:deleteAccount') return mockDeleteAccount
    return vi.fn()
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

// Mock ImageUpload
vi.mock('@/components/circles/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

// Mock convex api
vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    users: {
      getCurrentUser: { _name: 'users:getCurrentUser' },
      updateProfile: { _name: 'users:updateProfile' },
      deleteAccount: { _name: 'users:deleteAccount' },
    },
  },
}))

import SettingsPage from '@/app/dashboard/settings/page'

describe('SettingsPage', () => {
  beforeEach(() => {
    mockPasswordEnabled = true
    vi.clearAllMocks()
  })

  it('renders profile section with name and email', () => {
    render(<SettingsPage />)
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('email field is read-only', () => {
    render(<SettingsPage />)
    const emailInput = screen.getByDisplayValue('test@example.com')
    expect(emailInput).toBeDisabled()
  })

  it('save button disabled when no changes', () => {
    render(<SettingsPage />)
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it('password section visible when passwordEnabled is true', () => {
    render(<SettingsPage />)
    expect(screen.getAllByText('Change Password').length).toBeGreaterThan(0)
  })

  it('password section hidden for OAuth-only users', () => {
    mockPasswordEnabled = false
    render(<SettingsPage />)
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument()
  })

  it('password change validates minimum length', () => {
    render(<SettingsPage />)
    const newPasswordInput = screen.getByPlaceholderText('New password (min 8 characters)')
    fireEvent.change(newPasswordInput, { target: { value: 'short' } })
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('password change validates matching passwords', () => {
    render(<SettingsPage />)
    const newPasswordInput = screen.getByPlaceholderText('New password (min 8 characters)')
    const confirmInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'different' } })
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('delete account flow shows confirmation dialog', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    expect(screen.getByText(/type.*DELETE.*to confirm/i)).toBeInTheDocument()
  })

  it('delete requires typing DELETE', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    const deleteButtons = screen.getAllByRole('button', { name: /delete account/i })
    const confirmButton = deleteButtons[deleteButtons.length - 1]
    expect(confirmButton).toBeDisabled()
  })
})
