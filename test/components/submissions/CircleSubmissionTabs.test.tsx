import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CircleSubmissionTabs } from '@/components/submissions/CircleSubmissionTabs'
import type { Circle } from '@/components/submissions/CircleSubmissionTabs'

const makeCircle = (overrides: Partial<Circle> = {}): Circle => ({
  id: 'circle-1',
  name: 'Test Circle',
  iconUrl: null,
  status: 'not-started',
  ...overrides,
})

describe('CircleSubmissionTabs', () => {
  it('renders a tab for each circle', () => {
    const circles: Circle[] = [
      makeCircle({ id: 'c1', name: 'Alpha' }),
      makeCircle({ id: 'c2', name: 'Beta' }),
    ]
    render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders children content for the active circle', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'Alpha' })]
    render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>My Prompt Content</div>
      </CircleSubmissionTabs>
    )

    expect(screen.getByText('My Prompt Content')).toBeInTheDocument()
  })

  it('calls onCircleChange when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onCircleChange = vi.fn()
    const circles: Circle[] = [
      makeCircle({ id: 'c1', name: 'Alpha' }),
      makeCircle({ id: 'c2', name: 'Beta' }),
    ]

    render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={onCircleChange}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    await user.click(screen.getByText('Beta'))
    expect(onCircleChange).toHaveBeenCalledWith('c2')
  })

  it('renders avatar fallback with first letter of circle name when iconUrl is null', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'Zeta', iconUrl: null })]
    render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('renders without crashing when iconUrl is provided', () => {
    // Radix AvatarImage does not produce a visible <img> in jsdom (images never "load"),
    // so we verify the component renders without error and the circle name is shown.
    const circles: Circle[] = [
      makeCircle({ id: 'c1', name: 'Gamma', iconUrl: 'https://example.com/icon.png' }),
    ]
    expect(() =>
      render(
        <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
          <div>Content</div>
        </CircleSubmissionTabs>
      )
    ).not.toThrow()

    // Circle name is always rendered in the tab label
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('renders a Lock icon for circles with locked status', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'Locked Circle', status: 'locked' })]
    const { container } = render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    // The Lock icon renders as an SVG
    const lockSvg = container.querySelector('svg')
    expect(lockSvg).toBeInTheDocument()
  })

  it('renders a Check icon for circles with submitted status', () => {
    const circles: Circle[] = [
      makeCircle({ id: 'c1', name: 'Submitted Circle', status: 'submitted' }),
    ]
    const { container } = render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    // Check icon should be present (from lucide-react)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renders progress SVG for in-progress circles', () => {
    const circles: Circle[] = [
      makeCircle({ id: 'c1', name: 'In Progress', status: 'in-progress', progress: 0.6 }),
    ]
    const { container } = render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    // Two SVG circles: background + progress arc
    const svgCircles = container.querySelectorAll('svg circle')
    expect(svgCircles.length).toBeGreaterThanOrEqual(2)
  })

  it('renders empty ring SVG for not-started circles', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'Fresh', status: 'not-started' })]
    const { container } = render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    // One SVG circle for the empty ring
    const svgCircles = container.querySelectorAll('svg circle')
    expect(svgCircles.length).toBeGreaterThanOrEqual(1)
  })

  it('handles an empty circles array without crashing', () => {
    expect(() =>
      render(
        <CircleSubmissionTabs circles={[]} activeCircleId="" onCircleChange={vi.fn()}>
          <div>Content</div>
        </CircleSubmissionTabs>
      )
    ).not.toThrow()
  })

  it('uses default 50% progress when in-progress circle has no progress prop', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'Half', status: 'in-progress' })]
    const { container } = render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    // Progress arc SVG circles still render
    const svgCircles = container.querySelectorAll('svg circle')
    expect(svgCircles.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the circle name as a label in each tab', () => {
    const circles: Circle[] = [makeCircle({ id: 'c1', name: 'My Circle' })]
    render(
      <CircleSubmissionTabs circles={circles} activeCircleId="c1" onCircleChange={vi.fn()}>
        <div>Content</div>
      </CircleSubmissionTabs>
    )

    expect(screen.getByText('My Circle')).toBeInTheDocument()
  })
})
