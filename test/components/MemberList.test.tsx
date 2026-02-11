import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockMembers = [
  { userId: 'u1', role: 'admin', joinedAt: 1000, name: 'Alice Admin', imageUrl: null },
  { userId: 'u2', role: 'member', joinedAt: 2000, name: 'Bob Member', imageUrl: null },
  { userId: 'u3', role: 'member', joinedAt: 3000, name: 'Charlie Member', imageUrl: null },
]
const mockCircle = { _id: 'c1', name: 'Test Circle', role: 'admin' }
const mockCurrentUser = { _id: 'u1', name: 'Alice Admin' }

let circleReturn: typeof mockCircle | undefined | null = mockCircle
let membersReturn: typeof mockMembers | undefined = mockMembers
let userReturn: typeof mockCurrentUser | undefined | null = mockCurrentUser

// Track call order to differentiate queries
let callCount = 0

vi.mock('convex/react', () => ({
  useQuery: () => {
    callCount++
    // MembersPage calls useQuery 3 times in order: getCircle, getCircleMembers, getCurrentUser
    const index = callCount % 3
    if (index === 1) return circleReturn
    if (index === 2) return membersReturn
    return userReturn
  },
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ circleId: 'c1' }),
}))

vi.mock('sonner', () => ({
  toast: { info: vi.fn() },
}))

import MembersPage from '@/app/dashboard/circles/[circleId]/members/page'

describe('MembersPage', () => {
  beforeEach(() => {
    circleReturn = mockCircle
    membersReturn = mockMembers
    userReturn = mockCurrentUser
    callCount = 0
  })

  it('renders loading spinner when data is undefined', () => {
    circleReturn = undefined
    const { container } = render(<MembersPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders "Circle not found" when circle is null', () => {
    circleReturn = null
    render(<MembersPage />)
    expect(screen.getByText('Circle not found')).toBeInTheDocument()
  })

  it('renders all active members', () => {
    render(<MembersPage />)
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Member')).toBeInTheDocument()
    expect(screen.getByText('Charlie Member')).toBeInTheDocument()
  })

  it('shows Admin badge for admin members', () => {
    render(<MembersPage />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows member count in header', () => {
    render(<MembersPage />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows Remove button for non-admin members when viewer is admin', () => {
    render(<MembersPage />)
    const removeButtons = screen.getAllByText('Remove')
    // Should have Remove buttons for Bob and Charlie (not for self/admin)
    expect(removeButtons).toHaveLength(2)
  })

  it('sorts admin first', () => {
    render(<MembersPage />)
    const allCards = document.querySelectorAll('[class*="rounded-lg border"]')
    const firstCard = allCards[0]
    expect(firstCard?.textContent).toContain('Alice Admin')
  })
})
