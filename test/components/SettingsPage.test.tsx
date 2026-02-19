import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
      createEmailAddress: vi.fn(),
    },
  }),
  useSignIn: () => ({
    signIn: { create: vi.fn() },
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

  it('email field is displayed with change option', () => {
    render(<SettingsPage />)
    const emailInput = screen.getByDisplayValue('test@example.com')
    expect(emailInput).toBeDisabled()
    // "Change" button for email (not "Change Password")
    expect(screen.getByRole('button', { name: /^change$/i })).toBeInTheDocument()
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

  it('delete account flow shows re-auth step first', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: /delete account/i }))
    // Dialog opens with re-auth step, not DELETE input
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify identity/i })).toBeInTheDocument()
    })
  })

  it('delete re-auth requires password for password users', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    // Both the password change section and re-auth dialog have "Current password" inputs
    const passwordInputs = screen.getAllByPlaceholderText('Current password')
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /verify identity/i })).toBeInTheDocument()
  })
})
