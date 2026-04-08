import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DeadlineCountdown } from '@/components/submissions/DeadlineCountdown'

// Fixed "now" for deterministic tests: Feb 12 2026 00:00:00 UTC
const NOW = new Date('2026-02-12T00:00:00Z').getTime()

// Deadline in the future: Feb 14 2026 10:59:00 UTC (2d 10h 59m away)
const FUTURE_DEADLINE = new Date('2026-02-14T10:59:00Z').getTime()

// Deadline in the past
const PAST_DEADLINE = new Date('2026-02-11T10:59:00Z').getTime()

// Deadline < 1 hour away: Feb 12 2026 00:30:00 UTC (30 min away)
const URGENT_DEADLINE = new Date('2026-02-12T00:30:00Z').getTime()

describe('DeadlineCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders days/hours/mins/secs when deadline is in the future', () => {
    render(<DeadlineCountdown deadlineTimestamp={FUTURE_DEADLINE} />)

    expect(screen.getByText(/2d 10h 59m 0s/)).toBeInTheDocument()
  })

  it('renders "Submissions Locked" when deadline has passed', () => {
    render(<DeadlineCountdown deadlineTimestamp={PAST_DEADLINE} />)

    expect(screen.getByText('Submissions Locked')).toBeInTheDocument()
  })

  it('shows "Submission Locked" label text when past deadline', () => {
    render(<DeadlineCountdown deadlineTimestamp={PAST_DEADLINE} />)

    expect(screen.getByText('Submission Locked')).toBeInTheDocument()
  })

  it('shows deadline label when not locked', () => {
    render(<DeadlineCountdown deadlineTimestamp={FUTURE_DEADLINE} />)

    expect(screen.getByText(/Deadline:/)).toBeInTheDocument()
  })

  it('applies amber styling when urgent (< 1 hour remaining)', () => {
    render(<DeadlineCountdown deadlineTimestamp={URGENT_DEADLINE} />)

    const container = screen.getByText(/30m/).closest('div')?.parentElement
    expect(container?.className).toMatch(/amber/)
  })

  it('applies destructive styling when past deadline', () => {
    const { container } = render(<DeadlineCountdown deadlineTimestamp={PAST_DEADLINE} />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/destructive/)
  })

  it('countdown updates after 1 second', () => {
    render(<DeadlineCountdown deadlineTimestamp={FUTURE_DEADLINE} />)

    expect(screen.getByText(/2d 10h 59m 0s/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // After 1 second, seconds should decrement
    expect(screen.queryByText(/2d 10h 59m 0s/)).not.toBeInTheDocument()
    expect(screen.getByText(/2d 10h 58m 59s/)).toBeInTheDocument()
  })

  it('accepts optional className prop', () => {
    const { container } = render(
      <DeadlineCountdown deadlineTimestamp={FUTURE_DEADLINE} className="my-custom-class" />
    )

    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('renders with default deadline when no timestamp provided', () => {
    // Should not throw and should render some countdown or locked state
    expect(() => render(<DeadlineCountdown />)).not.toThrow()
  })
})
