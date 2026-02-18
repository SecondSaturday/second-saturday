import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Id } from '../../convex/_generated/dataModel'

// ---------------------------------------------------------------------------
// Hoist mock refs so they are available in vi.mock factory (hoisted)
// ---------------------------------------------------------------------------
const { mockGetCircle, mockGetSubmissionForCircle, mockUseQuery } = vi.hoisted(() => {
  const mockGetCircle = { _type: 'query', _name: 'circles:getCircle' }
  const mockGetSubmissionForCircle = {
    _type: 'query',
    _name: 'submissions:getSubmissionForCircle',
  }
  const mockUseQuery = vi.fn()
  return { mockGetCircle, mockGetSubmissionForCircle, mockUseQuery }
})

vi.mock('../../convex/_generated/api', () => ({
  api: {
    circles: { getCircle: mockGetCircle },
    submissions: { getSubmissionForCircle: mockGetSubmissionForCircle },
  },
}))

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

const CIRCLE_ID = 'circle-123' as Id<'circles'>

vi.mock('next/navigation', () => ({
  useParams: () => ({ circleId: CIRCLE_ID }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>←</span>,
}))

// Stub screen to capture props without rendering the full submission tree
vi.mock('@/screens/submissions/MultiCircleSubmissionScreen', () => ({
  MultiCircleSubmissionScreen: ({ circles, cycleId }: { circles: unknown[]; cycleId: string }) => (
    <div
      data-testid="submission-screen"
      data-cycle-id={cycleId}
      data-circles={JSON.stringify(circles)}
    />
  ),
}))

import SubmitPage from '@/app/dashboard/circles/[circleId]/submit/page'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockCircle = {
  _id: CIRCLE_ID,
  name: 'Test Circle',
  iconUrl: 'https://example.com/icon.jpg',
  memberCount: 5,
  role: 'member',
  newsletterCount: 3,
}

describe('SubmitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner when circle is undefined', () => {
    mockUseQuery.mockReturnValue(undefined)
    const { container } = render(<SubmitPage />)
    expect(screen.queryByTestId('submission-screen')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows loading spinner when submission is undefined', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      return undefined
    })
    const { container } = render(<SubmitPage />)
    expect(screen.queryByTestId('submission-screen')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows circle not found when circle is null', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return null
      return null
    })
    render(<SubmitPage />)
    expect(screen.getByText('Circle not found')).toBeInTheDocument()
    expect(screen.queryByTestId('submission-screen')).not.toBeInTheDocument()
  })

  it('renders submission screen when data is loaded', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    expect(screen.getByTestId('submission-screen')).toBeInTheDocument()
  })

  it('passes the circle id and name to the submission screen', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    const circles = JSON.parse(screen.getByTestId('submission-screen').dataset.circles!)
    expect(circles).toHaveLength(1)
    expect(circles[0].id).toBe(CIRCLE_ID)
    expect(circles[0].name).toBe('Test Circle')
    expect(circles[0].iconUrl).toBe('https://example.com/icon.jpg')
  })

  it('passes a YYYY-MM cycle id to the submission screen', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    const cycleId = screen.getByTestId('submission-screen').dataset.cycleId!
    expect(cycleId).toMatch(/^\d{4}-\d{2}$/)
  })

  it('sets circle status to not-started when no submission exists', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    const circles = JSON.parse(screen.getByTestId('submission-screen').dataset.circles!)
    expect(circles[0].status).toBe('not-started')
  })

  it('sets circle status to in-progress when submission exists without submittedAt', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return { _id: 'sub-1', responses: [] }
      return undefined
    })
    render(<SubmitPage />)
    const circles = JSON.parse(screen.getByTestId('submission-screen').dataset.circles!)
    expect(circles[0].status).toBe('in-progress')
  })

  it('sets circle status to submitted when submission has submittedAt', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle)
        return {
          _id: 'sub-1',
          submittedAt: Date.now(),
          responses: [],
        }
      return undefined
    })
    render(<SubmitPage />)
    const circles = JSON.parse(screen.getByTestId('submission-screen').dataset.circles!)
    expect(circles[0].status).toBe('submitted')
  })

  it('renders back link to dashboard with circle param', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    expect(screen.getByRole('link')).toHaveAttribute('href', `/dashboard?circle=${CIRCLE_ID}`)
  })

  it('renders page title', () => {
    mockUseQuery.mockImplementation((queryRef: unknown) => {
      if (queryRef === mockGetCircle) return mockCircle
      if (queryRef === mockGetSubmissionForCircle) return null
      return undefined
    })
    render(<SubmitPage />)
    expect(screen.getByRole('heading', { name: /make submission/i })).toBeInTheDocument()
  })
})
