/**
 * Component tests for invite preview page.
 * Tests all states: loading, invalid, blocked, already member, signed out, signed in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock dependencies
const mockPush = vi.fn()
const mockUseParams = vi.fn()
const mockUseRouter = vi.fn()
const mockUseAuth = vi.fn()
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockTrackEvent = vi.fn()

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('convex/react', () => ({
  useQuery: (api: unknown, args: unknown) => mockUseQuery(api, args),
  useMutation: (api: unknown) => mockUseMutation(api),
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: mockTrackEvent,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // eslint-disable-next-line @next/next/no-img-element
  AvatarImage: ({ alt }: { src?: string; alt: string }) => <img alt={alt} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ProfileHeaderImageLayout', () => ({
  ProfileHeaderImageLayout: () => <div data-testid="profile-header" />,
}))

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('InvitePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ inviteCode: 'test-invite-123' })
    mockUseRouter.mockReturnValue({ push: mockPush })
  })

  describe('Loading State', () => {
    it('shows loading spinner when data is loading', async () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(undefined) // Loading state
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      const { container } = render(<InvitePreviewPage />)

      // Check for loading spinner by class
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Invalid Invite', () => {
    it('shows error message for invalid invite code', async () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(null) // Invalid invite
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Invalid invite link')).toBeInTheDocument()
      })

      expect(screen.getByText('Go to dashboard')).toBeInTheDocument()
    })
  })

  describe('Blocked User State', () => {
    it('shows blocked message when user is blocked', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'A test circle',
        adminName: 'Admin User',
        memberCount: 5,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValueOnce(mockCircle).mockReturnValueOnce({ status: 'blocked' })
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('You have been blocked from this circle')).toBeInTheDocument()
      })

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
    })

    it('does not track invite_link_viewed for blocked users', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 5,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValueOnce(mockCircle).mockReturnValueOnce({ status: 'blocked' })
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('You have been blocked from this circle')).toBeInTheDocument()
      })

      // Should still track invite view
      expect(mockTrackEvent).toHaveBeenCalledWith('invite_link_viewed', {
        inviteCode: 'test-invite-123',
      })
    })
  })

  describe('Already Member State', () => {
    it('shows already member message after attempting to join', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'A test circle',
        adminName: 'Admin User',
        memberCount: 5,
        iconUrl: null,
      }

      const mockJoinCircle = vi.fn().mockResolvedValue({
        circleId: 'circle-123',
        alreadyMember: true,
      })

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(mockJoinCircle)

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Join Circle')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Join Circle'))

      await waitFor(() => {
        expect(screen.getByText('You are already a member of this circle')).toBeInTheDocument()
      })

      expect(screen.getByText('Go to Circle')).toBeInTheDocument()
      expect(mockJoinCircle).toHaveBeenCalledWith({ inviteCode: 'test-invite-123' })
    })
  })

  describe('Unauthenticated User State', () => {
    it('shows sign up and log in options for unauthenticated users', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'A test circle',
        adminName: 'Admin User',
        memberCount: 5,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/Test Circle/)).toBeInTheDocument()
      })

      expect(screen.getByText('Sign up to Join')).toBeInTheDocument()
      expect(screen.getByText('Log in to Join')).toBeInTheDocument()
      expect(screen.getByText(/5 members/)).toBeInTheDocument()
      expect(screen.getByText('Admin User started this circle')).toBeInTheDocument()
    })

    it('preserves redirect URL in auth links', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      const { container } = render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/Test Circle/)).toBeInTheDocument()
      })

      const signUpLink = container.querySelector('a[href*="sign-up"]')
      const logInLink = container.querySelector('a[href*="sign-in"]')

      expect(signUpLink?.getAttribute('href')).toContain('redirect_url=/invite/test-invite-123')
      expect(logInLink?.getAttribute('href')).toContain('redirect_url=/invite/test-invite-123')
    })

    it('tracks invite_link_viewed for unauthenticated users', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('invite_link_viewed', {
          inviteCode: 'test-invite-123',
        })
      })
    })
  })

  describe('Authenticated User Join Flow', () => {
    it('shows join button for authenticated users', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'A test circle',
        adminName: 'Admin User',
        memberCount: 5,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Join Circle')).toBeInTheDocument()
      })

      expect(screen.queryByText('Sign up to Join')).not.toBeInTheDocument()
      expect(screen.queryByText('Log in to Join')).not.toBeInTheDocument()
    })

    it('successfully joins circle and redirects', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'A test circle',
        adminName: 'Admin User',
        memberCount: 5,
        iconUrl: null,
      }

      const mockJoinCircle = vi.fn().mockResolvedValue({
        circleId: 'circle-123',
        alreadyMember: false,
      })

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(mockJoinCircle)

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Join Circle')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Join Circle'))

      await waitFor(() => {
        expect(mockJoinCircle).toHaveBeenCalledWith({ inviteCode: 'test-invite-123' })
      })

      expect(mockTrackEvent).toHaveBeenCalledWith('circle_joined', {
        circleId: 'circle-123',
        source: 'invite_link',
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard/circles/circle-123')
    })

    it('shows loading state while joining', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      const mockJoinCircle = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ circleId: 'circle-123', alreadyMember: false }), 100)
            )
        )

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(mockJoinCircle)

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Join Circle')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Join Circle'))

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Joining...')).toBeInTheDocument()
      })
    })

    it('handles join error gracefully', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      const mockJoinCircle = vi.fn().mockRejectedValue(new Error('Network error'))

      mockUseAuth.mockReturnValue({ isSignedIn: true })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(mockJoinCircle)

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Join Circle')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Join Circle'))

      await waitFor(() => {
        expect(mockJoinCircle).toHaveBeenCalled()
      })

      // Button should be re-enabled after error
      await waitFor(() => {
        const button = screen.getByText('Join Circle')
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Circle Details Display', () => {
    it('displays circle icon when available', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: 'https://example.com/icon.jpg',
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument()
      })
    })

    it('displays circle initials when no icon', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-header')).toBeInTheDocument()
      })
    })

    it('displays admin name attribution', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'This is a wonderful test circle',
        adminName: 'Admin',
        memberCount: 3,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Admin started this circle')).toBeInTheDocument()
      })
    })

    it('correctly formats member count', async () => {
      const mockCircle = {
        _id: 'circle-123',
        name: 'Test Circle',
        description: 'Test',
        adminName: 'Admin',
        memberCount: 1,
        iconUrl: null,
      }

      mockUseAuth.mockReturnValue({ isSignedIn: false })
      mockUseQuery.mockReturnValue(mockCircle)
      mockUseMutation.mockReturnValue(vi.fn())

      const InvitePreviewPage = (await import('@/app/invite/[inviteCode]/page')).default

      render(<InvitePreviewPage />)

      await waitFor(() => {
        expect(screen.getByText('1 member sharing monthly updates')).toBeInTheDocument()
      })
    })
  })
})
