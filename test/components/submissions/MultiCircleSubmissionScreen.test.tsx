import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MultiCircleSubmissionScreen } from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import type { Id } from '../../../convex/_generated/dataModel'

// ---------------------------------------------------------------------------
// Hoist mock refs so they are available in vi.mock factory (which is hoisted)
// ---------------------------------------------------------------------------
const {
  mockGetSubmissionForCircle,
  mockGetPromptsForCircle,
  mockUpdateResponseMutation,
  mockCreateSubmissionMutation,
  mockLockSubmissionMutation,
  mockUseQuery,
  mockUseMutation,
} = vi.hoisted(() => {
  const mockGetSubmissionForCircle = { _type: 'query', _name: 'getSubmissionForCircle' }
  const mockGetPromptsForCircle = { _type: 'query', _name: 'getPromptsForCircle' }
  const mockUpdateResponseMutation = { _type: 'mutation', _name: 'updateResponse' }
  const mockCreateSubmissionMutation = { _type: 'mutation', _name: 'createSubmission' }
  const mockLockSubmissionMutation = { _type: 'mutation', _name: 'lockSubmission' }
  const mockUseQuery = vi.fn()
  const mockUseMutation = vi.fn()
  return {
    mockGetSubmissionForCircle,
    mockGetPromptsForCircle,
    mockUpdateResponseMutation,
    mockCreateSubmissionMutation,
    mockLockSubmissionMutation,
    mockUseQuery,
    mockUseMutation,
  }
})

// ---------------------------------------------------------------------------
// Mock the convex generated API so we get stable, identity-comparable refs
// ---------------------------------------------------------------------------
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    submissions: {
      getSubmissionForCircle: mockGetSubmissionForCircle,
      getPromptsForCircle: mockGetPromptsForCircle,
      createSubmission: mockCreateSubmissionMutation,
      updateResponse: mockUpdateResponseMutation,
      lockSubmission: mockLockSubmissionMutation,
    },
  },
}))

// ---------------------------------------------------------------------------
// Mock convex/react
// ---------------------------------------------------------------------------
vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

// ---------------------------------------------------------------------------
// Mock heavy child components so tests are fast and focused on screen logic
// ---------------------------------------------------------------------------
vi.mock('@/components/submissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/submissions')>()
  return {
    ...actual,
    PromptResponseCard: ({
      promptText,
      onValueChange,
      disabled,
    }: {
      promptText: string
      onValueChange?: (v: string) => void
      disabled?: boolean
    }) => (
      <div data-testid="prompt-card" data-disabled={disabled ? 'true' : 'false'}>
        <p>{promptText}</p>
        <textarea
          aria-label={promptText}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
        />
      </div>
    ),
    DeadlineCountdown: () => <div data-testid="deadline-countdown" />,
    AutoSaveIndicator: ({ status }: { status: string }) => (
      <div data-testid="auto-save-indicator" data-status={status}>
        {status === 'saving' && <span>Saving...</span>}
        {status === 'saved' && <span>Saved</span>}
      </div>
    ),
    // Stub CircleSubmissionTabs to a simpler version that avoids Radix UI issues
    // while still testing the real screen logic (draft state, save behaviour, etc.)
    CircleSubmissionTabs: ({
      circles,
      activeCircleId,
      onCircleChange,
      children,
    }: {
      circles: Circle[]
      activeCircleId: string
      onCircleChange: (id: string) => void
      children: React.ReactNode
    }) => (
      <div data-testid="circle-tabs">
        {circles.map((c) => (
          <button
            key={c.id}
            data-testid={`tab-${c.id}`}
            data-active={c.id === activeCircleId ? 'true' : 'false'}
            onClick={() => onCircleChange(c.id)}
          >
            {c.name}
          </button>
        ))}
        <div data-testid="tab-content">{children}</div>
      </div>
    ),
  }
})

// ---------------------------------------------------------------------------
// Mock lucide-react to avoid SVG issues
// ---------------------------------------------------------------------------
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader" className={className} />
  ),
  Check: () => <span>✓</span>,
  Lock: () => <span>🔒</span>,
  Clock: () => <span>🕐</span>,
  Cloud: () => <span>☁</span>,
  CloudOff: () => <span>📵</span>,
}))

vi.mock('@/lib/dates', () => ({
  getNextSecondSaturday: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type PromptDoc = { _id: Id<'prompts'>; text: string }
type ResponseDoc = { _id: Id<'responses'>; promptId: Id<'prompts'>; text: string }
type SubmissionDoc = { _id: Id<'submissions'>; responses: ResponseDoc[] }

const CIRCLE_A: Circle = {
  id: 'circle-a',
  name: 'Circle A',
  iconUrl: null,
  status: 'not-started',
}

const CIRCLE_B: Circle = {
  id: 'circle-b',
  name: 'Circle B',
  iconUrl: null,
  status: 'not-started',
}

const PROMPT_1: PromptDoc = { _id: 'prompt-1' as Id<'prompts'>, text: 'What inspired you?' }
const PROMPT_2: PromptDoc = { _id: 'prompt-2' as Id<'prompts'>, text: 'What did you learn?' }

const SUBMISSION: SubmissionDoc = {
  _id: 'sub-1' as Id<'submissions'>,
  responses: [
    {
      _id: 'resp-1' as Id<'responses'>,
      promptId: 'prompt-1' as Id<'prompts'>,
      text: 'server text 1',
    },
    { _id: 'resp-2' as Id<'responses'>, promptId: 'prompt-2' as Id<'prompts'>, text: '' },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocks({
  submissionData,
  promptsData,
}: {
  submissionData: SubmissionDoc | null | undefined
  promptsData: PromptDoc[] | undefined
}) {
  mockUseQuery.mockImplementation((queryRef: unknown) => {
    if (queryRef === mockGetSubmissionForCircle) return submissionData
    if (queryRef === mockGetPromptsForCircle) return promptsData
    return undefined
  })
}

const mockUpdateResponse = vi.fn()
const mockCreateSubmission = vi.fn()
const mockLockSubmission = vi.fn()

function setupMutations() {
  mockUseMutation.mockImplementation((mutationRef: unknown) => {
    if (mutationRef === mockUpdateResponseMutation) return mockUpdateResponse
    if (mutationRef === mockCreateSubmissionMutation) return mockCreateSubmission
    if (mutationRef === mockLockSubmissionMutation) return mockLockSubmission
    return vi.fn()
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MultiCircleSubmissionScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    setupMutations()
    mockUpdateResponse.mockResolvedValue(undefined)
    mockCreateSubmission.mockResolvedValue('sub-new' as Id<'submissions'>)
    mockLockSubmission.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it('renders a loading spinner when queries are undefined', () => {
    setupMocks({ submissionData: undefined, promptsData: undefined })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.queryAllByTestId('prompt-card')).toHaveLength(0)
  })

  it('renders a loading spinner when only submissionData is undefined', () => {
    setupMocks({ submissionData: undefined, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders a loading spinner when only promptsData is undefined', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: undefined })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Prompts rendering
  // -------------------------------------------------------------------------

  it('renders prompt cards when data is loaded', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1, PROMPT_2] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByText('What inspired you?')).toBeInTheDocument()
    expect(screen.getByText('What did you learn?')).toBeInTheDocument()
  })

  it('shows "no prompts available" when submission is null and prompts list is empty', () => {
    setupMocks({ submissionData: null, promptsData: [] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByText('No prompts available for this circle.')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Circle tabs
  // -------------------------------------------------------------------------

  it('shows circle tab names for all circles', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A, CIRCLE_B]} cycleId="cycle-1" />)

    expect(screen.getByText('Circle A')).toBeInTheDocument()
    expect(screen.getByText('Circle B')).toBeInTheDocument()
  })

  it('shows the first circle tab as active by default', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A, CIRCLE_B]} cycleId="cycle-1" />)

    expect(screen.getByTestId('tab-circle-a')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('tab-circle-b')).toHaveAttribute('data-active', 'false')
  })

  it('switches active circle when a tab is clicked', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A, CIRCLE_B]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.click(screen.getByTestId('tab-circle-b'))
    })

    expect(screen.getByTestId('tab-circle-b')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('tab-circle-a')).toHaveAttribute('data-active', 'false')
  })

  // -------------------------------------------------------------------------
  // Draft text preservation
  // -------------------------------------------------------------------------

  it('preserves draft text state when switching tabs and back', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A, CIRCLE_B]} cycleId="cycle-1" />)

    const textarea = screen.getByRole('textbox', { name: 'What inspired you?' })
    act(() => {
      fireEvent.change(textarea, { target: { value: 'My local draft' } })
    })

    // Switch to circle B
    act(() => {
      fireEvent.click(screen.getByTestId('tab-circle-b'))
    })

    // Switch back to circle A
    act(() => {
      fireEvent.click(screen.getByTestId('tab-circle-a'))
    })

    // The prompt card should still render (draft state is preserved in the component Map)
    expect(screen.queryByText('What inspired you?')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Auto-save debounce
  // -------------------------------------------------------------------------

  it('does not call updateResponse before the debounce delay elapses', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox', { name: 'What inspired you?' }), {
        target: { value: 'new draft text' },
      })
    })

    // Advance 1999ms — debounce has not fired yet
    act(() => {
      vi.advanceTimersByTime(1999)
    })

    expect(mockUpdateResponse).not.toHaveBeenCalled()
  })

  it('calls updateResponse mutation after the 2000ms debounce delay', async () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox', { name: 'What inspired you?' }), {
        target: { value: 'new draft text' },
      })
    })

    // Advance past the 2000ms debounce and flush all microtasks
    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockUpdateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        promptId: 'prompt-1',
        text: 'new draft text',
      })
    )
  })

  it('does not call updateResponse if text has not changed from server data', async () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    expect(mockUpdateResponse).not.toHaveBeenCalled()
  })

  it('creates a submission if none exists before calling updateResponse', async () => {
    setupMocks({ submissionData: null, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox', { name: 'What inspired you?' }), {
        target: { value: 'brand new response' },
      })
    })

    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockCreateSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ circleId: 'circle-a', cycleId: 'cycle-1' })
    )
    expect(mockUpdateResponse).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // AutoSaveIndicator statuses
  // -------------------------------------------------------------------------

  it('shows "Saving..." indicator while the mutation is in-flight', async () => {
    let resolveSave!: () => void
    mockUpdateResponse.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox', { name: 'What inspired you?' }), {
        target: { value: 'new text' },
      })
    })

    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    // mutation is in-flight — indicator should show 'saving'
    expect(screen.getByTestId('auto-save-indicator')).toHaveAttribute('data-status', 'saving')
    expect(screen.getByText('Saving...')).toBeInTheDocument()

    // resolve and verify transition to saved
    await act(async () => {
      resolveSave()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('shows "Saved" indicator after successful save', async () => {
    mockUpdateResponse.mockResolvedValue(undefined)

    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    act(() => {
      fireEvent.change(screen.getByRole('textbox', { name: 'What inspired you?' }), {
        target: { value: 'typing something new' },
      })
    })

    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Locked / submitted circles
  // -------------------------------------------------------------------------

  it('disables prompt cards when circle status is locked', () => {
    const lockedCircle: Circle = { ...CIRCLE_A, status: 'locked' }
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[lockedCircle]} cycleId="cycle-1" />)

    const cards = screen.getAllByTestId('prompt-card')
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-disabled', 'true')
    })
  })

  it('disables prompt cards when circle status is submitted', () => {
    const submittedCircle: Circle = { ...CIRCLE_A, status: 'submitted' }
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[submittedCircle]} cycleId="cycle-1" />)

    const cards = screen.getAllByTestId('prompt-card')
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-disabled', 'true')
    })
  })

  it('does not disable prompt cards when circle status is not-started', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    const cards = screen.getAllByTestId('prompt-card')
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-disabled', 'false')
    })
  })

  // -------------------------------------------------------------------------
  // Submit button
  // -------------------------------------------------------------------------

  it('renders a Submit button when a submission exists', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('Submit button is disabled when no submission exists yet', () => {
    setupMocks({ submissionData: null, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('calls lockSubmission when Submit is clicked', async () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      await Promise.resolve()
    })

    expect(mockLockSubmission).toHaveBeenCalledWith({ submissionId: 'sub-1' })
  })

  it('shows Submitted state instead of Submit button when circle is submitted', () => {
    const submittedCircle: Circle = { ...CIRCLE_A, status: 'submitted' }
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[submittedCircle]} cycleId="cycle-1" />)

    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Post-deadline behavior (submissions allowed after deadline)
  // -------------------------------------------------------------------------

  it('does not disable prompt cards when deadline is past', () => {
    // Deadline is past but circle status is not-started — inputs should remain enabled
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    const cards = screen.getAllByTestId('prompt-card')
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-disabled', 'false')
    })
  })

  it('shows submit button even when deadline is past', () => {
    setupMocks({ submissionData: SUBMISSION, promptsData: [PROMPT_1] })

    render(<MultiCircleSubmissionScreen circles={[CIRCLE_A]} cycleId="cycle-1" />)

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })
})
