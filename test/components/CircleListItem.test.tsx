import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CircleListItem } from '@/components/dashboard/CircleListItem'

describe('CircleListItem', () => {
  const defaultProps = {
    name: 'Fake Frems',
    iconUrl: null,
    memberNames: ['You', 'Alex', 'Dio', 'Shaun'],
    memberCount: 4,
    hasUnread: false,
  }

  it('renders circle name', () => {
    render(<CircleListItem {...defaultProps} />)
    expect(screen.getByText('Fake Frems')).toBeInTheDocument()
  })

  it('renders member names as comma-separated list', () => {
    render(<CircleListItem {...defaultProps} />)
    expect(screen.getByText('You, Alex, Dio, Shaun')).toBeInTheDocument()
  })

  it('renders fallback initial when no icon url', () => {
    render(<CircleListItem {...defaultProps} />)
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('shows unread indicator when hasUnread is true', () => {
    render(<CircleListItem {...defaultProps} hasUnread={true} />)
    expect(screen.getByAltText('Unread')).toBeInTheDocument()
  })

  it('shows read indicator when hasUnread is false', () => {
    render(<CircleListItem {...defaultProps} hasUnread={false} />)
    expect(screen.getByAltText('Read')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<CircleListItem {...defaultProps} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
