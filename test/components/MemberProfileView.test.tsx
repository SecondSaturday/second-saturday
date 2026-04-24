import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Per-test query state. `queryReturns` is consulted by the useQuery mock in
// insertion order: first call → first entry, etc. This lets us control
// (profile, circle, currentUser) separately.
let queryReturns: unknown[] = []
let callIndex = 0

vi.mock('convex/react', () => ({
  useQuery: () => {
    const value = queryReturns[callIndex]
    callIndex += 1
    return value
  },
}))

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }))

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsDesktop: () => true,
  useMediaQuery: () => true,
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

// Must import after mocks
import { MemberProfileView } from '@/components/profile/MemberProfileView'

const CIRCLE_ID = 'c1' as never
const USER_ID = 'u1' as never

function setQueryReturns(values: unknown[]) {
  queryReturns = values
  callIndex = 0
}

describe('MemberProfileView', () => {
  it('shows a spinner while the profile query is loading', () => {
    setQueryReturns([undefined, undefined, undefined])
    const { container } = render(<MemberProfileView circleId={CIRCLE_ID} userId={USER_ID} />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders "not available" when the profile query returns null (blocked/never member)', () => {
    setQueryReturns([null, { name: 'My Circle' }, { _id: 'caller' }])
    render(<MemberProfileView circleId={CIRCLE_ID} userId={USER_ID} />)
    expect(screen.getByText(/profile isn't available/i)).toBeInTheDocument()
  })

  it('renders the empty state when the target has no visible entries', () => {
    const profile = {
      user: { id: USER_ID, name: 'Alex Doe', imageUrl: null },
      membership: { role: 'member', joinedAt: Date.now(), isOwner: false },
      stats: { submissionCount: 0, firstSubmittedAt: null, lastSubmittedAt: null },
      entries: [],
    }
    setQueryReturns([profile, { name: 'My Circle' }, { _id: 'caller' }])
    render(<MemberProfileView circleId={CIRCLE_ID} userId={USER_ID} />)
    expect(screen.getByText(/hasn't shared an update/i)).toBeInTheDocument()
  })

  it('renders header, stats, and a published entry (happy path)', () => {
    const profile = {
      user: { id: USER_ID, name: 'Alex Doe', imageUrl: null },
      membership: {
        role: 'admin',
        joinedAt: new Date('2026-01-15').getTime(),
        isOwner: true,
      },
      stats: {
        submissionCount: 2,
        firstSubmittedAt: new Date('2026-01-31').getTime(),
        lastSubmittedAt: new Date('2026-02-28').getTime(),
      },
      entries: [
        {
          cycleId: '2026-02',
          newsletterId: 'n2',
          issueNumber: 2,
          publishedAt: new Date('2026-03-14').getTime(),
          submittedAt: new Date('2026-02-28').getTime(),
          responses: [
            {
              responseId: 'r1',
              promptText: 'What did you do this month?',
              text: 'Hiked a mountain.',
              media: [],
            },
          ],
        },
      ],
    }
    setQueryReturns([profile, { name: 'My Circle' }, { _id: 'caller' }])
    render(<MemberProfileView circleId={CIRCLE_ID} userId={USER_ID} />)
    expect(screen.getByRole('heading', { name: 'Alex Doe' })).toBeInTheDocument()
    expect(screen.getByText('Admin · Owner')).toBeInTheDocument()
    expect(screen.getByText(/2 updates/)).toBeInTheDocument()
    expect(screen.getByText(/Issue #2 · February 2026/)).toBeInTheDocument()
    expect(screen.getByText('Hiked a mountain.')).toBeInTheDocument()
  })

  it('labels an unpublished (draft) entry as "Draft · {Month}"', () => {
    const profile = {
      user: { id: USER_ID, name: 'Alex Doe', imageUrl: null },
      membership: { role: 'member', joinedAt: Date.now(), isOwner: false },
      stats: { submissionCount: 1, firstSubmittedAt: null, lastSubmittedAt: null },
      entries: [
        {
          cycleId: '2026-04',
          submittedAt: null,
          responses: [
            { responseId: 'r9', promptText: 'Highlight?', text: 'in-progress', media: [] },
          ],
        },
      ],
    }
    setQueryReturns([profile, { name: 'My Circle' }, { _id: USER_ID }])
    render(<MemberProfileView circleId={CIRCLE_ID} userId={USER_ID} />)
    expect(screen.getByText(/Draft · April 2026/)).toBeInTheDocument()
  })
})
