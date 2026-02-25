import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Clerk
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
      delete: mockDelete,
    },
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
  UserProfile: () => <div data-testid="clerk-user-profile" />,
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

  it('renders profile section with name', () => {
    render(<SettingsPage />)
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
  })

  it('save button disabled when no changes', () => {
    render(<SettingsPage />)
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
  })

  it('renders Clerk UserProfile component', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('clerk-user-profile')).toBeInTheDocument()
  })

  it('renders a log out button', () => {
    render(<SettingsPage />)
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('delete account flow shows re-auth step first', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: /delete account/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify identity/i })).toBeInTheDocument()
    })
  })

  it('delete re-auth requires password for password users', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    const passwordInput = screen.getByPlaceholderText('Current password')
    expect(passwordInput).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify identity/i })).toBeInTheDocument()
  })
})
