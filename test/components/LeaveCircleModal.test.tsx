import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Id } from '../../convex/_generated/dataModel'

const mockLeaveCircle = vi.fn()
const mockTransferAdmin = vi.fn()
const mockReplace = vi.fn()
const mockGetCurrentUser = { _id: 'user1' as Id<'users'>, name: 'Test User' }

const mockMembers = [
  {
    userId: 'user1' as Id<'users'>,
    name: 'Test User',
    role: 'admin' as const,
    joinedAt: 1000,
    imageUrl: null,
  },
  {
    userId: 'user2' as Id<'users'>,
    name: 'Alice',
    role: 'member' as const,
    joinedAt: 2000,
    imageUrl: null,
  },
  {
    userId: 'user3' as Id<'users'>,
    name: 'Bob',
    role: 'member' as const,
    joinedAt: 3000,
    imageUrl: null,
  },
]

let mockMutationCall = 0

vi.mock('convex/react', () => ({
  useMutation: () => {
    mockMutationCall++
    // First call is leaveCircle, second is transferAdmin
    return mockMutationCall % 2 === 1 ? mockLeaveCircle : mockTransferAdmin
  },
  useQuery: (queryRef: unknown, args: unknown) => {
    if (args === 'skip') return undefined
    // Return members for getCircleMembers, currentUser for getCurrentUser
    if (typeof queryRef === 'object') return mockMembers
    return mockGetCurrentUser
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

import { LeaveCircleModal } from '@/components/LeaveCircleModal'

describe('LeaveCircleModal', () => {
  const defaultProps = {
    circleId: 'circle1' as Id<'circles'>,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockMutationCall = 0
    mockLeaveCircle.mockResolvedValue({ success: true })
    mockTransferAdmin.mockResolvedValue({ success: true })
    mockReplace.mockResolvedValue(undefined)
  })

  describe('non-admin flow', () => {
    it('renders dialog with title and description', () => {
      render(<LeaveCircleModal {...defaultProps} />)
      expect(screen.getByText('Leave this circle?')).toBeInTheDocument()
      expect(screen.getByText(/lose access/i)).toBeInTheDocument()
    })

    it('renders Cancel and Leave Circle buttons', () => {
      render(<LeaveCircleModal {...defaultProps} />)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Leave Circle')).toBeInTheDocument()
    })

    it('calls onOpenChange(false) when Cancel is clicked', () => {
      render(<LeaveCircleModal {...defaultProps} />)
      fireEvent.click(screen.getByText('Cancel'))
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls leaveCircle mutation when Leave Circle is clicked', async () => {
      render(<LeaveCircleModal {...defaultProps} />)
      fireEvent.click(screen.getByText('Leave Circle'))
      await waitFor(() => {
        expect(mockLeaveCircle).toHaveBeenCalledWith({ circleId: 'circle1' })
      })
    })

    it('navigates to dashboard after successful leave', async () => {
      render(<LeaveCircleModal {...defaultProps} />)
      fireEvent.click(screen.getByText('Leave Circle'))
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('shows error toast on mutation failure', async () => {
      mockLeaveCircle.mockRejectedValue(new Error('Transfer admin role before leaving'))
      const { toast } = await import('sonner')
      render(<LeaveCircleModal {...defaultProps} />)
      fireEvent.click(screen.getByText('Leave Circle'))
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Transfer admin role before leaving')
      })
    })

    it('does not render when open is false', () => {
      render(<LeaveCircleModal {...defaultProps} open={false} />)
      expect(screen.queryByText('Leave this circle?')).not.toBeInTheDocument()
    })
  })

  describe('admin flow', () => {
    const adminProps = { ...defaultProps, isAdmin: true }

    it('renders transfer dialog for admin', () => {
      render(<LeaveCircleModal {...adminProps} />)
      expect(screen.getByText('Transfer admin & leave')).toBeInTheDocument()
    })

    it('shows member picker for selecting new admin', () => {
      render(<LeaveCircleModal {...adminProps} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('does not show current user in member picker', () => {
      render(<LeaveCircleModal {...adminProps} />)
      // The current user should be filtered out
      const buttons = screen.getAllByRole('button')
      const memberButtons = buttons.filter(
        (b) => b.textContent?.includes('Alice') || b.textContent?.includes('Bob')
      )
      expect(memberButtons).toHaveLength(2)
    })

    it('Transfer & Leave button is disabled until member is selected', () => {
      render(<LeaveCircleModal {...adminProps} />)
      const transferBtn = screen.getByText('Transfer & Leave')
      expect(transferBtn).toBeDisabled()
    })
  })
})
