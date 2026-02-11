import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Id } from '../../../convex/_generated/dataModel'

const mockLeaveCircle = vi.fn()
const mockPush = vi.fn()

vi.mock('convex/react', () => ({
  useMutation: () => mockLeaveCircle,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
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
    mockLeaveCircle.mockResolvedValue({ success: true })
  })

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
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
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
