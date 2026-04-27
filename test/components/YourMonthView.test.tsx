import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock matches the codebase convention (call-order). The order in YourMonthView is:
// 1. useGetYourMonth -> api.yourMonth.getYourMonth
// 2. useQuery(api.yourMonth.listYourMonthsAvailable, ...)
// 3. useQuery(api.users.getCurrentUser, ...)
// Refactoring the component's hook order will require updating these arrays.
let queryReturns: unknown[] = []
let callIndex = 0

vi.mock('convex/react', () => ({
  useQuery: () => {
    const value = queryReturns[callIndex]
    callIndex += 1
    return value
  },
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }))

const replaceMock = vi.fn()
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
}))

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

// Imported after mocks
import { YourMonthView } from '@/components/yourMonth/YourMonthView'

function setQueryReturns(values: unknown[]) {
  queryReturns = values
  callIndex = 0
}

describe('YourMonthView', () => {
  it('shows a spinner while the data query is loading', () => {
    // Order: getYourMonth, listYourMonthsAvailable, getCurrentUser
    setQueryReturns([undefined, undefined, undefined])
    const { container } = render(<YourMonthView cycleId="2026-04" />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders empty state when the user has no active circles', () => {
    setQueryReturns([
      { cycleId: '2026-04', deadline: Date.now() + 1000, circles: [] },
      { hasActiveMembership: true, months: [] },
      { _id: 'me', name: 'Me', imageUrl: null, email: 'me@x.com' },
    ])
    render(<YourMonthView cycleId="2026-04" />)
    expect(screen.getByText(/Nothing to show for this month yet/i)).toBeInTheDocument()
  })

  it('renders per-circle cards with status chips and responses (happy path)', () => {
    const data = {
      cycleId: '2026-04',
      deadline: Date.now() + 60_000,
      circles: [
        {
          circleId: 'c1',
          circleName: 'Family',
          circleIconUrl: null,
          submission: { submissionId: 's1', submittedAt: 1, locked: false },
          newsletter: {
            newsletterId: 'n1',
            issueNumber: 4,
            publishedAt: 100,
            status: 'published' as const,
          },
          responses: [
            { responseId: 'r1', promptText: 'Highlights?', text: 'A good month.', media: [] },
          ],
        },
        {
          circleId: 'c2',
          circleName: 'Work Friends',
          circleIconUrl: null,
          submission: null,
          newsletter: null,
          responses: [],
        },
      ],
    }
    setQueryReturns([
      data,
      {
        hasActiveMembership: true,
        months: [{ cycleId: '2026-04', hasPublishedNewsletter: true }],
      },
      { _id: 'me', name: 'Me', imageUrl: null, email: 'me@x.com' },
    ])
    render(<YourMonthView cycleId="2026-04" />)
    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.getByText('Work Friends')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.getByText(/A good month\./)).toBeInTheDocument()
    expect(screen.getAllByText(/Nothing this month\./i).length).toBeGreaterThan(0)
  })

  it('renders the "Finish your update" CTA when deadline is in the future and a circle has no submission', () => {
    const data = {
      cycleId: '2026-04',
      deadline: Date.now() + 60_000,
      circles: [
        {
          circleId: 'c1',
          circleName: 'Family',
          circleIconUrl: null,
          submission: null,
          newsletter: null,
          responses: [],
        },
      ],
    }
    setQueryReturns([
      data,
      {
        hasActiveMembership: true,
        months: [{ cycleId: '2026-04', hasPublishedNewsletter: false }],
      },
      { _id: 'me', name: 'Me', imageUrl: null, email: 'me@x.com' },
    ])
    render(<YourMonthView cycleId="2026-04" />)
    expect(screen.getByText(/Finish your.*update/i)).toBeInTheDocument()
  })
})
