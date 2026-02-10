import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/dashboard/EmptyState'

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

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState />)
    expect(screen.getByText(/no circles yet/i)).toBeInTheDocument()
  })

  it('renders create circle link', () => {
    render(<EmptyState />)
    const link = screen.getByRole('link', { name: /create a circle/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/create')
  })
})
