import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      fullName: 'Test User',
      firstName: 'Test',
      imageUrl: 'https://example.com/clerk-avatar.jpg',
    },
  }),
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: () => ({
    name: 'Convex User',
    imageUrl: 'https://example.com/convex-avatar.jpg',
  }),
}))

// Mock convex api
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    users: {
      getCurrentUser: { _name: 'users:getCurrentUser' },
    },
  },
}))

describe('DashboardHeader', () => {
  it('renders date label', () => {
    render(<DashboardHeader dateLabel="Sep 13" />)
    expect(screen.getByText('Sep 13')).toBeInTheDocument()
  })

  it('renders default date when no label provided', () => {
    render(<DashboardHeader />)
    // Should render current date in "Mon DD" format
    const dateButton = screen.getByRole('button', { name: /\w+ \d+/i })
    expect(dateButton).toBeInTheDocument()
  })

  it('calls onDatePickerOpen when date is clicked', () => {
    const onDatePickerOpen = vi.fn()
    render(<DashboardHeader dateLabel="Sep 13" onDatePickerOpen={onDatePickerOpen} />)
    fireEvent.click(screen.getByText('Sep 13'))
    expect(onDatePickerOpen).toHaveBeenCalledOnce()
  })

  it('renders menu button', () => {
    render(<DashboardHeader />)
    const buttons = screen.getAllByRole('button')
    // Should have date picker + menu = at least 2 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('uses Convex user name for avatar fallback', () => {
    render(<DashboardHeader />)
    // The avatar fallback should show the first letter of the Convex user's name
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
