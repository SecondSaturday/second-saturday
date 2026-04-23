'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { Plus } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const DEFAULT_PICKER_EMOJIS = ['❤️', '😂', '🙌', '🔥', '🥹', '👀']
export const MAX_EMOJI_LENGTH = 16

export interface ServerReaction {
  emoji: string
  count: number
  reactedByMe: boolean
}

interface ReactionStripProps {
  responseId: string
  reactions: ServerReaction[] | undefined
}

type Override = { delta: number; reactedByMe: boolean }

export function ReactionStrip({ responseId, reactions }: ReactionStripProps) {
  const addReaction = useMutation(api.reactions.addReaction)
  const removeReaction = useMutation(api.reactions.removeReaction)

  const [overrides, setOverrides] = useState<Record<string, Override>>({})
  const [pending, setPending] = useState<Record<string, true>>({})
  const inflightRef = useRef<Record<string, true>>({})

  // Clear any override whose server state now matches the optimistic target —
  // otherwise the delta stacks on top of refreshed server counts.
  useEffect(() => {
    if (!reactions) return
    setOverrides((prev) => {
      let changed = false
      const next: Record<string, Override> = {}
      for (const [emoji, ov] of Object.entries(prev)) {
        if (inflightRef.current[emoji]) {
          next[emoji] = ov
          continue
        }
        const server = reactions.find((r) => r.emoji === emoji)
        const serverReacted = server?.reactedByMe ?? false
        if (serverReacted === ov.reactedByMe) {
          changed = true
          continue
        }
        next[emoji] = ov
      }
      return changed ? next : prev
    })
  }, [reactions])

  const merged = useMemo(() => {
    const base = new Map<string, ServerReaction>()
    for (const r of reactions ?? []) base.set(r.emoji, { ...r })
    for (const [emoji, ov] of Object.entries(overrides)) {
      const cur = base.get(emoji) ?? { emoji, count: 0, reactedByMe: false }
      base.set(emoji, {
        emoji,
        count: Math.max(0, cur.count + ov.delta),
        reactedByMe: ov.reactedByMe,
      })
    }
    return Array.from(base.values()).filter((r) => r.count > 0)
  }, [reactions, overrides])

  const runMutation = async (
    emoji: string,
    action: () => Promise<unknown>,
    rollback: () => void
  ) => {
    if (inflightRef.current[emoji]) return
    inflightRef.current[emoji] = true
    setPending((prev) => ({ ...prev, [emoji]: true }))
    try {
      await action()
    } catch {
      rollback()
    } finally {
      delete inflightRef.current[emoji]
      setPending((prev) => {
        const next = { ...prev }
        delete next[emoji]
        return next
      })
    }
  }

  const toggle = async (emoji: string) => {
    if (emoji.length === 0 || emoji.length > MAX_EMOJI_LENGTH) return
    const current = merged.find((r) => r.emoji === emoji)
    const alreadyReacted = current?.reactedByMe ?? false
    const delta = alreadyReacted ? -1 : +1
    setOverrides((prev) => {
      const existing = prev[emoji]
      const nextDelta = (existing?.delta ?? 0) + delta
      return { ...prev, [emoji]: { delta: nextDelta, reactedByMe: !alreadyReacted } }
    })
    await runMutation(
      emoji,
      () => addReaction({ responseId: responseId as Id<'responses'>, emoji }),
      () => {
        setOverrides((prev) => {
          const existing = prev[emoji]
          const nextDelta = (existing?.delta ?? 0) - delta
          return { ...prev, [emoji]: { delta: nextDelta, reactedByMe: alreadyReacted } }
        })
      }
    )
  }

  const pickEmoji = async (emoji: string) => {
    if (emoji.length === 0 || emoji.length > MAX_EMOJI_LENGTH) return
    const current = merged.find((r) => r.emoji === emoji)
    if (current?.reactedByMe) {
      setOverrides((prev) => ({
        ...prev,
        [emoji]: { delta: (prev[emoji]?.delta ?? 0) - 1, reactedByMe: false },
      }))
      await runMutation(
        emoji,
        () => removeReaction({ responseId: responseId as Id<'responses'>, emoji }),
        () => {
          setOverrides((prev) => ({
            ...prev,
            [emoji]: { delta: (prev[emoji]?.delta ?? 0) + 1, reactedByMe: true },
          }))
        }
      )
      return
    }
    await toggle(emoji)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {merged.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => toggle(r.emoji)}
          disabled={!!pending[r.emoji]}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-60 ${
            r.reactedByMe
              ? 'border-primary/40 bg-primary/10 text-foreground'
              : 'border-border bg-muted/40 text-foreground/80 hover:bg-muted'
          }`}
        >
          <span className="text-sm leading-none">{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
          aria-label="Add reaction"
        >
          <Plus className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex gap-1 p-1">
          {DEFAULT_PICKER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pickEmoji(emoji)}
              className="rounded px-1.5 py-1 text-lg leading-none hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
