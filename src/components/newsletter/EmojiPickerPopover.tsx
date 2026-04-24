'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { EmojiPicker } from 'frimousse'
import { Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const DEFAULT_PICKER_EMOJIS = ['❤️', '😂', '🙌', '🔥', '🥹', '👀']

// frimousse lazy-fetches its emoji database (~200KB) from jsdelivr the first
// time EmojiPicker.Root mounts. That's on the user's click, which feels slow.
// Warm the HTTP cache on mount so the first real open is instant.
const EMOJIBASE_BASE = 'https://cdn.jsdelivr.net/npm/emojibase-data@latest/en'
let prefetchStarted = false
function prefetchEmojiData() {
  if (prefetchStarted || typeof window === 'undefined') return
  prefetchStarted = true
  const opts: RequestInit = { credentials: 'omit', cache: 'force-cache' }
  fetch(`${EMOJIBASE_BASE}/data.json`, opts).catch(() => {})
  fetch(`${EMOJIBASE_BASE}/messages.json`, opts).catch(() => {})
}

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void
  /** Optional custom trigger; defaults to the small "+" chip used in reaction strips. */
  trigger?: ReactNode
}

export function EmojiPickerPopover({ onSelect, trigger }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    prefetchEmojiData()
  }, [])

  const pick = (emoji: string) => {
    onSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label="Add reaction"
            className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px]">
        <div className="flex items-center gap-1 border-b border-border p-1">
          {DEFAULT_PICKER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pick(emoji)}
              className="rounded px-1.5 py-1 text-lg leading-none hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
        <EmojiPicker.Root
          onEmojiSelect={({ emoji }) => pick(emoji)}
          columns={9}
          className="isolate flex h-[320px] w-full flex-col bg-popover"
        >
          <EmojiPicker.Search
            placeholder="Search emoji…"
            className="mx-2 mt-2 mb-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/40"
          />
          <EmojiPicker.Viewport className="relative flex-1 overflow-hidden">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Loading…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    {...props}
                    className="bg-popover px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div {...props} className="scroll-my-1 px-1">
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    {...props}
                    className="flex size-8 items-center justify-center rounded text-lg data-[active]:bg-muted"
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
  )
}
