import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock convex/react
const mockCircles = [
  {
    _id: 'circle1',
    name: 'College Friends',
    iconUrl: null,
    memberNames: ['You', 'Alex', 'Dio'],
    memberCount: 3,
    hasUnread: true,
    role: 'admin',
  },
  {
    _id: 'circle2',
    name: 'Work Buddies',
    iconUrl: 'https://example.com/icon.jpg',
    memberNames: ['You', 'Sam'],
    memberCount: 2,
    hasUnread: false,
    role: 'member',
  },
]

let queryReturn: typeof mockCircles | undefined | null = mockCircles

vi.mock('convex/react', () => ({
  useQuery: () => queryReturn,
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

// Must import after mocks
import { CircleList } from '@/components/dashboard/CircleList'

describe('CircleList', () => {
  it('renders loading skeleton when data is undefined', () => {
    queryReturn = undefined
    const { container } = render(<CircleList />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    queryReturn = mockCircles
  })

  it('renders empty state when circles array is empty', () => {
    queryReturn = []
    render(<CircleList />)
    expect(screen.getByText(/no circles yet/i)).toBeInTheDocument()
    queryReturn = mockCircles
  })

  it('renders circle items when data is loaded', () => {
    queryReturn = mockCircles
    render(<CircleList />)
    expect(screen.getByText('College Friends')).toBeInTheDocument()
    expect(screen.getByText('Work Buddies')).toBeInTheDocument()
  })
})
