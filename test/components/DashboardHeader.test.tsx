import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

// Mock Clerk UserButton
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="clerk-user-button" />,
}))

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('DashboardHeader', () => {
  it('renders Clerk UserButton', () => {
    render(<DashboardHeader />)
    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument()
  })

  it('renders date label', () => {
    render(<DashboardHeader dateLabel="Sep 13" />)
    expect(screen.getByText('Sep 13')).toBeInTheDocument()
  })

  it('renders default date when no label provided', () => {
    render(<DashboardHeader />)
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
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
