import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Id } from '../../../convex/_generated/dataModel'

const mockRemoveMember = vi.fn()

vi.mock('convex/react', () => ({
  useMutation: () => mockRemoveMember,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

import { RemoveMemberModal } from '@/components/RemoveMemberModal'

describe('RemoveMemberModal', () => {
  const defaultProps = {
    circleId: 'circle1' as Id<'circles'>,
    targetUserId: 'user2' as Id<'users'>,
    targetName: 'John Doe',
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRemoveMember.mockResolvedValue({ success: true })
  })

  it('renders dialog with target name', () => {
    render(<RemoveMemberModal {...defaultProps} />)
    expect(screen.getByText('Remove John Doe?')).toBeInTheDocument()
  })

  it('renders Remove and Remove & Block options', () => {
    render(<RemoveMemberModal {...defaultProps} />)
    // "Remove" appears as both a label and button text; "Remove & Block" as label and button
    expect(screen.getAllByText('Remove').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Remove & Block').length).toBeGreaterThanOrEqual(1)
  })

  it('shows descriptions for both options', () => {
    render(<RemoveMemberModal {...defaultProps} />)
    expect(screen.getByText(/can rejoin/i)).toBeInTheDocument()
    expect(screen.getByText(/cannot rejoin/i)).toBeInTheDocument()
  })

  it('calls removeMember with keepContributions=true for Remove', async () => {
    render(<RemoveMemberModal {...defaultProps} />)
    // The "Remove" button inside the option card (not the "Remove & Block" one)
    const buttons = screen.getAllByRole('button')
    const removeButton = buttons.find((b) => b.textContent === 'Remove')!
    fireEvent.click(removeButton)
    await waitFor(() => {
      expect(mockRemoveMember).toHaveBeenCalledWith({
        circleId: 'circle1',
        targetUserId: 'user2',
        keepContributions: true,
      })
    })
  })

  it('calls removeMember with keepContributions=false for Remove & Block', async () => {
    render(<RemoveMemberModal {...defaultProps} />)
    const blockButtons = screen.getAllByText('Remove & Block')
    // Click the button (last one with that text, which is the actual button)
    fireEvent.click(blockButtons[blockButtons.length - 1])
    await waitFor(() => {
      expect(mockRemoveMember).toHaveBeenCalledWith({
        circleId: 'circle1',
        targetUserId: 'user2',
        keepContributions: false,
      })
    })
  })

  it('renders Cancel button', () => {
    render(<RemoveMemberModal {...defaultProps} />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    render(<RemoveMemberModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error toast on mutation failure', async () => {
    mockRemoveMember.mockRejectedValue(new Error('Admin access required'))
    const { toast } = await import('sonner')
    render(<RemoveMemberModal {...defaultProps} />)
    const blockButtons = screen.getAllByText('Remove & Block')
    fireEvent.click(blockButtons[blockButtons.length - 1])
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Admin access required')
    })
  })

  it('does not render when open is false', () => {
    render(<RemoveMemberModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Remove John Doe?')).not.toBeInTheDocument()
  })
})
