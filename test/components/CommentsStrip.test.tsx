import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { getFunctionName } from 'convex/server'
import type { Id } from '../../convex/_generated/dataModel'
import type { ServerComment } from '@/components/newsletter/CommentsStrip'

const mockAddComment = vi.fn()
const mockEditComment = vi.fn()
const mockDeleteComment = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

vi.mock('convex/react', () => ({
  // Dispatch by the FunctionReference identity passed into useMutation, so the
  // mapping is stable regardless of render count or hook-call order.
  useMutation: (ref: unknown) => {
    const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0])
    if (name.endsWith(':addComment')) return mockAddComment
    if (name.endsWith(':editComment')) return mockEditComment
    if (name.endsWith(':deleteComment')) return mockDeleteComment
    throw new Error(`Unexpected useMutation ref in test: ${name}`)
  },
  useQuery: () => ({ name: 'Test User', email: 'test@example.com', imageUrl: null }),
}))

// Stub the Radix dropdown so it renders children inline for tests
// (Radix relies on pointer/portal behavior that jsdom + fireEvent don't reliably trigger).
import * as React from 'react'
vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DropdownMenuTrigger: ({
      children,
      ...rest
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button type="button" {...rest}>
        {children}
      </button>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DropdownMenuItem: ({
      children,
      onClick,
      ...rest
    }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    ),
  }
})

import { CommentsStrip } from '@/components/newsletter/CommentsStrip'

const responseId = 'r1' as Id<'responses'>
const circleId = 'c1' as Id<'circles'>

function makeComment(overrides: Partial<ServerComment> = {}): ServerComment {
  return {
    commentId: 'cm1' as Id<'comments'>,
    userId: 'u1' as Id<'users'>,
    authorName: 'Alice',
    authorAvatarUrl: null,
    text: 'Nice update!',
    createdAt: Date.now() - 60_000,
    updatedAt: Date.now() - 60_000,
    isDeleted: false,
    canEdit: true,
    canDelete: true,
    ...overrides,
  }
}

describe('CommentsStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddComment.mockResolvedValue({ commentId: 'cm-new', createdAt: Date.now() })
    mockEditComment.mockResolvedValue({ updated: true })
    mockDeleteComment.mockResolvedValue({ deleted: true })
  })

  it('renders the collapsed "Add a comment" prompt when there are no comments', () => {
    render(<CommentsStrip responseId={responseId} comments={[]} circleId={circleId} />)
    expect(screen.getByText('Add a comment')).toBeInTheDocument()
  })

  it('renders the count chip when comments exist (collapsed)', () => {
    render(
      <CommentsStrip
        responseId={responseId}
        comments={[makeComment(), makeComment({ commentId: 'cm2' as Id<'comments'> })]}
        circleId={circleId}
      />
    )
    expect(screen.getByText('2 comments')).toBeInTheDocument()
  })

  it('expands to show comments and a composer on click', () => {
    render(
      <CommentsStrip
        responseId={responseId}
        comments={[makeComment({ text: 'Hello world' })]}
        circleId={circleId}
      />
    )
    fireEvent.click(screen.getByText('1 comment'))
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add a comment…')).toBeInTheDocument()
  })

  it('optimistically appends a pending comment on send and calls addComment', async () => {
    render(<CommentsStrip responseId={responseId} comments={[]} circleId={circleId} />)
    fireEvent.click(screen.getByText('Add a comment'))

    const textarea = screen.getByPlaceholderText('Add a comment…') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'optimistic message' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // Pending row appears immediately
    expect(screen.getByText('optimistic message')).toBeInTheDocument()
    expect(screen.getByText(/sending/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith({ responseId, text: 'optimistic message' })
    })
  })

  it('reverts the optimistic row and toasts when the send mutation rejects', async () => {
    mockAddComment.mockRejectedValueOnce(new Error('boom'))
    render(<CommentsStrip responseId={responseId} comments={[]} circleId={circleId} />)
    fireEvent.click(screen.getByText('Add a comment'))

    const textarea = screen.getByPlaceholderText('Add a comment…') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'will fail' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/failed to send/i))
    })
    // Pending row should be gone (reverted) — the "Sending…" indicator is no longer in the DOM.
    expect(screen.queryByText(/sending/i)).not.toBeInTheDocument()
    // Draft should be restored for retry.
    expect(textarea.value).toBe('will fail')
  })

  it('renders a deleted comment as "Comment deleted" and hides edit/delete', () => {
    render(
      <CommentsStrip
        responseId={responseId}
        comments={[makeComment({ isDeleted: true, text: '', canEdit: false, canDelete: false })]}
        circleId={circleId}
      />
    )
    fireEvent.click(screen.getByText('1 comment'))
    expect(screen.getByText('Comment deleted')).toBeInTheDocument()
    expect(screen.queryByLabelText('Comment options')).not.toBeInTheDocument()
  })

  it('confirms before deleting and calls deleteComment', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const c = makeComment({ commentId: 'cm-del' as Id<'comments'> })
    render(<CommentsStrip responseId={responseId} comments={[c]} circleId={circleId} />)
    fireEvent.click(screen.getByText('1 comment'))
    fireEvent.click(screen.getByLabelText('Comment options'))
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalledWith({ commentId: 'cm-del' })
    })
    confirmSpy.mockRestore()
  })

  it('does not call deleteComment if the confirm dialog is dismissed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<CommentsStrip responseId={responseId} comments={[makeComment()]} circleId={circleId} />)
    fireEvent.click(screen.getByText('1 comment'))
    fireEvent.click(screen.getByLabelText('Comment options'))
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(mockDeleteComment).not.toHaveBeenCalled()
    })
    confirmSpy.mockRestore()
  })

  it('edit flow: clicking Edit shows a textarea, Save calls editComment', async () => {
    const c = makeComment({ commentId: 'cm-edit' as Id<'comments'>, text: 'before' })
    render(<CommentsStrip responseId={responseId} comments={[c]} circleId={circleId} />)
    fireEvent.click(screen.getByText('1 comment'))
    fireEvent.click(screen.getByLabelText('Comment options'))
    fireEvent.click(screen.getByText('Edit'))

    const editArea = screen.getByDisplayValue('before') as HTMLTextAreaElement
    fireEvent.change(editArea, { target: { value: 'after' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockEditComment).toHaveBeenCalledWith({ commentId: 'cm-edit', text: 'after' })
    })
  })
})
