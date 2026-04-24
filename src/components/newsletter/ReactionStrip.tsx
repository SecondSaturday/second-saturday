'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { EmojiPickerPopover, DEFAULT_PICKER_EMOJIS } from './EmojiPickerPopover'
import { ReactionChip } from './ReactionChip'

export { DEFAULT_PICKER_EMOJIS }
export const MAX_EMOJI_LENGTH = 16

export interface ServerReaction {
  emoji: string
  count: number
  reactedByMe: boolean
  reactorNames?: string[]
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
    for (const r of reactions ?? []) base.set(r.emoji, { ...r, reactorNames: r.reactorNames ?? [] })
    for (const [emoji, ov] of Object.entries(overrides)) {
      const cur = base.get(emoji) ?? { emoji, count: 0, reactedByMe: false, reactorNames: [] }
      const serverNames = (cur.reactorNames ?? []).filter((n) => n !== 'You')
      const nextNames = ov.reactedByMe ? ['You', ...serverNames] : serverNames
      base.set(emoji, {
        emoji,
        count: Math.max(0, cur.count + ov.delta),
        reactedByMe: ov.reactedByMe,
        reactorNames: nextNames,
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
        <ReactionChip
          key={r.emoji}
          emoji={r.emoji}
          count={r.count}
          reactedByMe={r.reactedByMe}
          reactorNames={r.reactorNames ?? []}
          disabled={!!pending[r.emoji]}
          onToggle={() => toggle(r.emoji)}
        />
      ))}
      <EmojiPickerPopover onSelect={pickEmoji} />
    </div>
  )
}
