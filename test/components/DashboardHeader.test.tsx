import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('renders menu button', () => {
    render(<DashboardHeader />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})
