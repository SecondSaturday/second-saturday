import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockCircle = {
  _id: 'c1',
  name: 'Test Circle',
  description: 'A test circle',
  iconUrl: null,
  memberCount: 5,
  adminName: 'Alice Admin',
}

let circleReturn: typeof mockCircle | undefined | null = mockCircle
let isSignedIn = true
const mockJoinCircle = vi.fn()
const mockPush = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: () => circleReturn,
  useMutation: () => mockJoinCircle,
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ inviteCode: 'test-invite' }),
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
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

vi.mock('@/components/ui/button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-explicit-any
  AvatarImage: ({ alt }: any) => <img alt={alt} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import InvitePreviewPage from '@/app/invite/[inviteCode]/page'

describe('InvitePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    circleReturn = mockCircle
    isSignedIn = true
    mockJoinCircle.mockResolvedValue({ circleId: 'c1', alreadyMember: false })
  })

  it('renders loading spinner when data is undefined', () => {
    circleReturn = undefined
    const { container } = render(<InvitePreviewPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders invalid invite link when circle is null', () => {
    circleReturn = null
    render(<InvitePreviewPage />)
    expect(screen.getByText('Invalid invite link')).toBeInTheDocument()
  })

  it('renders circle name when signed in', () => {
    render(<InvitePreviewPage />)
    expect(screen.getByText(/Test Circle/)).toBeInTheDocument()
  })

  it('shows member count', () => {
    render(<InvitePreviewPage />)
    expect(screen.getByText(/5 members/)).toBeInTheDocument()
  })

  it('shows admin name', () => {
    const { container } = render(<InvitePreviewPage />)
    expect(container.textContent).toContain('Alice Admin started this circle')
  })

  it('shows Join Circle button when signed in', () => {
    render(<InvitePreviewPage />)
    expect(screen.getByText('Join Circle')).toBeInTheDocument()
  })

  it('shows sign up/log in buttons when not signed in', () => {
    isSignedIn = false
    render(<InvitePreviewPage />)
    expect(screen.getByText('Sign up to Join')).toBeInTheDocument()
    expect(screen.getByText('Log in to Join')).toBeInTheDocument()
  })

  it('calls joinCircle mutation on Join Circle click', async () => {
    render(<InvitePreviewPage />)
    fireEvent.click(screen.getByText('Join Circle'))
    await waitFor(() => {
      expect(mockJoinCircle).toHaveBeenCalledWith({ inviteCode: 'test-invite' })
    })
  })

  it('navigates to circle page after successful join', async () => {
    render(<InvitePreviewPage />)
    fireEvent.click(screen.getByText('Join Circle'))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/circles/c1')
    })
  })

  it('shows already member message when alreadyMember is true', async () => {
    mockJoinCircle.mockResolvedValue({ circleId: 'c1', alreadyMember: true })
    render(<InvitePreviewPage />)
    fireEvent.click(screen.getByText('Join Circle'))
    await waitFor(() => {
      expect(screen.getByText(/already a member/i)).toBeInTheDocument()
    })
  })

  it('shows error toast on join failure', async () => {
    mockJoinCircle.mockRejectedValue(new Error('You have been blocked from this circle'))
    const { toast } = await import('sonner')
    render(<InvitePreviewPage />)
    fireEvent.click(screen.getByText('Join Circle'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You have been blocked from this circle')
    })
  })
})
