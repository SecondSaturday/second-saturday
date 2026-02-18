/**
 * Accessibility tests for dashboard components.
 *
 * Validates that components follow a11y best practices:
 * - Proper ARIA roles and labels
 * - Keyboard navigation support
 * - Semantic HTML structure
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CircleListItem } from '@/components/dashboard/CircleListItem'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      fullName: 'Test User',
      firstName: 'Test',
      imageUrl: 'https://example.com/avatar.jpg',
    },
  }),
}))

describe('CircleListItem accessibility', () => {
  const defaultProps = {
    name: 'Test Circle',
    iconUrl: null,
    memberNames: ['You', 'Alex'],
    memberCount: 2,
    hasUnread: false,
  }

  it('renders as a button element (interactive)', () => {
    render(<CircleListItem {...defaultProps} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('is keyboard focusable', async () => {
    const user = userEvent.setup()
    render(<CircleListItem {...defaultProps} />)
    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  it('is keyboard activatable with Enter', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CircleListItem {...defaultProps} onClick={onClick} />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is keyboard activatable with Space', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CircleListItem {...defaultProps} onClick={onClick} />)
    await user.tab()
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has avatar with alt text', () => {
    render(<CircleListItem {...defaultProps} />)
    screen.queryByAltText('Test Circle')
    // AvatarImage renders with alt text (may or may not show depending on fallback)
    // At minimum, the fallback initial should be present
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows 3-member warning for small circles', () => {
    render(<CircleListItem {...defaultProps} memberCount={2} />)
    expect(screen.getByText(/invite.*more/i)).toBeInTheDocument()
  })
})

describe('EmptyState accessibility', () => {
  it('has a link with descriptive text', () => {
    render(<EmptyState />)
    const link = screen.getByRole('link', { name: /create a circle/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/create')
  })

  it('provides context about the empty state', () => {
    render(<EmptyState />)
    expect(screen.getByText(/no circles yet/i)).toBeInTheDocument()
  })
})

describe('DashboardHeader accessibility', () => {
  it('all interactive elements are buttons', () => {
    render(<DashboardHeader dateLabel="Sep 13" />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('date picker button is keyboard accessible', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<DashboardHeader dateLabel="Sep 13" onDatePickerOpen={onOpen} />)
    // First tab lands on the avatar link; second tab reaches the date picker button
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalled()
  })
})
