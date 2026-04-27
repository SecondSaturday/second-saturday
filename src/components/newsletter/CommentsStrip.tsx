'use client'

import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { MessageSquare, MoreHorizontal, Send } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { MAX_COMMENT_TEXT_LENGTH } from '../../../convex/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface ServerComment {
  commentId: Id<'comments'>
  userId: Id<'users'>
  authorName: string
  authorAvatarUrl: string | null
  text: string
  createdAt: number
  updatedAt: number
  isDeleted: boolean
  canEdit: boolean
  canDelete: boolean
}

interface CommentsStripProps {
  responseId: Id<'responses'>
  comments: ServerComment[] | undefined
  /** Reserved for future per-circle features (e.g. mention lookup); not used today. */
  circleId: Id<'circles'>
}

type PendingComment = {
  tempId: string
  authorName: string
  authorAvatarUrl: string | null
  text: string
  createdAt: number
  status: 'pending'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function CommentsStrip({ responseId, comments, circleId }: CommentsStripProps) {
  // circleId is reserved for future per-circle features (mentions, etc.).
  void circleId
  const addComment = useMutation(api.comments.addComment)
  const editCommentMut = useMutation(api.comments.editComment)
  const deleteCommentMut = useMutation(api.comments.deleteComment)
  const currentUser = useQuery(api.users.getCurrentUser)

  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<PendingComment[]>([])
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const tempCounter = useRef(0)

  const liveComments = useMemo(() => comments ?? [], [comments])
  const merged = useMemo(() => {
    return [...liveComments, ...pending]
  }, [liveComments, pending])

  const visibleCount = liveComments.length + pending.length

  async function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed.length > MAX_COMMENT_TEXT_LENGTH) return
    if (sending) return

    tempCounter.current += 1
    const tempId = `pending-${Date.now()}-${tempCounter.current}`
    const optimistic: PendingComment = {
      tempId,
      authorName: currentUser?.name ?? currentUser?.email ?? 'You',
      authorAvatarUrl: currentUser?.imageUrl ?? null,
      text: trimmed,
      createdAt: Date.now(),
      status: 'pending',
    }
    setPending((p) => [...p, optimistic])
    setDraft('')
    setSending(true)
    try {
      await addComment({ responseId, text: trimmed })
      setPending((p) => p.filter((x) => x.tempId !== tempId))
    } catch {
      // Revert the optimistic row, restore the draft so the user can retry, and toast.
      setPending((p) => p.filter((x) => x.tempId !== tempId))
      setDraft(trimmed)
      toast.error('Failed to send comment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function startEdit(c: ServerComment) {
    setEditingId(c.commentId)
    setEditDraft(c.text)
  }

  async function saveEdit() {
    if (!editingId) return
    const trimmed = editDraft.trim()
    if (!trimmed || trimmed.length > MAX_COMMENT_TEXT_LENGTH) return
    setEditSaving(true)
    try {
      await editCommentMut({ commentId: editingId, text: trimmed })
      setEditingId(null)
      setEditDraft('')
    } catch (err) {
      // Surface failure but keep the user in edit mode so they can retry/cancel.
      console.error('Failed to edit comment', err)
      toast.error('Failed to save edit. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(c: ServerComment) {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteCommentMut({ commentId: c.commentId })
    } catch (err) {
      console.error('Failed to delete comment', err)
      toast.error('Failed to delete comment. Please try again.')
    }
  }

  const charsLeft = MAX_COMMENT_TEXT_LENGTH - draft.length
  const editCharsLeft = MAX_COMMENT_TEXT_LENGTH - editDraft.length

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 self-start rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MessageSquare className="size-3.5" />
        {visibleCount === 0 ? (
          <span>Add a comment</span>
        ) : (
          <span>
            {visibleCount} comment{visibleCount === 1 ? '' : 's'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {visibleCount === 0
            ? 'Comments'
            : `${visibleCount} comment${visibleCount === 1 ? '' : 's'}`}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>

      {merged.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {merged.map((c) => {
            const isPending = 'tempId' in c
            if (isPending) {
              const p = c as PendingComment
              return (
                <li key={p.tempId} className="flex gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={p.authorAvatarUrl ?? undefined} alt={p.authorName} />
                    <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                      {getInitials(p.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-foreground">{p.authorName}</span>
                      <span className="text-[10px] text-muted-foreground">Sending…</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">{p.text}</p>
                  </div>
                </li>
              )
            }

            const sc = c as ServerComment
            const isEditing = editingId === sc.commentId
            return (
              <li key={sc.commentId} className="flex gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={sc.authorAvatarUrl ?? undefined} alt={sc.authorName} />
                  <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                    {getInitials(sc.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {sc.isDeleted ? '' : sc.authorName}
                    </span>
                    {!sc.isDeleted && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(sc.createdAt)}
                      </span>
                    )}
                  </div>
                  {sc.isDeleted ? (
                    <p className="text-sm italic text-muted-foreground">Comment deleted</p>
                  ) : isEditing ? (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={MAX_COMMENT_TEXT_LENGTH}
                        rows={2}
                        className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] tabular-nums',
                            editCharsLeft < 50 ? 'text-destructive' : 'text-muted-foreground'
                          )}
                        >
                          {editDraft.length}/{MAX_COMMENT_TEXT_LENGTH}
                        </span>
                        <div className="ml-auto flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditDraft('')
                            }}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={
                              editSaving ||
                              editDraft.trim().length === 0 ||
                              editDraft.length > MAX_COMMENT_TEXT_LENGTH
                            }
                            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">{sc.text}</p>
                  )}
                </div>
                {!sc.isDeleted && !isEditing && (sc.canEdit || sc.canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Comment options"
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sc.canEdit && (
                        <DropdownMenuItem onClick={() => startEdit(sc)}>Edit</DropdownMenuItem>
                      )}
                      {sc.canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(sc)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_COMMENT_TEXT_LENGTH}
          placeholder="Add a comment…"
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[10px] tabular-nums',
              charsLeft < 50 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {draft.length}/{MAX_COMMENT_TEXT_LENGTH}
          </span>
          <button
            type="button"
            onClick={handleSend}
            disabled={
              sending || draft.trim().length === 0 || draft.length > MAX_COMMENT_TEXT_LENGTH
            }
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            <Send className="size-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
