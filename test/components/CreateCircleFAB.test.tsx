import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

// Mock dates module
vi.mock('@/lib/dates', () => ({
  getNextSecondSaturday: () => new Date(2026, 1, 14), // Feb 14, 2026
  formatShortDate: () => 'Feb 14',
}))

import { CreateCircleFAB } from '@/components/dashboard/CreateCircleFAB'

describe('CreateCircleFAB', () => {
  it('renders the FAB button', () => {
    render(<CreateCircleFAB />)
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/create')
  })

  it('shows the next deadline date', () => {
    render(<CreateCircleFAB />)
    expect(screen.getByText(/Feb 14/)).toBeInTheDocument()
  })
})
