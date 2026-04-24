'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'

const LONG_PRESS_MS = 400
const MOVE_TOLERANCE_PX = 10

export function formatReactorList(names: string[] | undefined): string {
  if (!names || names.length === 0) return ''
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  if (names.length <= 5) return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
  return `${names.slice(0, 4).join(', ')}, and ${names.length - 4} others`
}

interface ReactionChipProps {
  emoji: string
  count: number
  reactedByMe: boolean
  reactorNames: string[]
  disabled?: boolean
  onToggle: () => void
}

const buttonTouchStyle: CSSProperties = {
  WebkitTouchCallout: 'none',
  touchAction: 'manipulation',
}

export function ReactionChip({
  emoji,
  count,
  reactedByMe,
  reactorNames,
  disabled,
  onToggle,
}: ReactionChipProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const longPressFiredRef = useRef(false)

  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current)
    },
    []
  )

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    longPressFiredRef.current = false
    startPosRef.current = { x: e.clientX, y: e.clientY }
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setSheetOpen(true)
    }, LONG_PRESS_MS)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!startPosRef.current || timerRef.current == null) return
    const dx = e.clientX - startPosRef.current.x
    const dy = e.clientY - startPosRef.current.y
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clearTimer()
  }

  const handlePointerEnd = () => clearTimer()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (longPressFiredRef.current) {
      e.preventDefault()
      longPressFiredRef.current = false
      return
    }
    onToggle()
  }

  const label = formatReactorList(reactorNames)

  return (
    <Popover open={sheetOpen} onOpenChange={setSheetOpen}>
      <PopoverAnchor asChild>
        <div className="group relative">
          <button
            type="button"
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onContextMenu={(e) => e.preventDefault()}
            disabled={disabled}
            aria-label={label ? `${emoji} — ${label}` : undefined}
            style={buttonTouchStyle}
            className={`inline-flex select-none items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-60 ${
              reactedByMe
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-muted/40 text-foreground/80 hover:bg-muted'
            }`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
          {label && (
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-md group-hover:block"
            >
              {label}
              <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
            </div>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent side="top" align="start" className="w-auto min-w-[180px] p-2">
        <div className="flex items-center gap-2 px-1 pb-1.5">
          <span className="text-base leading-none">{emoji}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {count} {count === 1 ? 'reaction' : 'reactions'}
          </span>
        </div>
        <ul className="max-h-56 space-y-0.5 overflow-y-auto text-sm">
          {reactorNames.map((name, i) => (
            <li key={`${name}-${i}`} className="px-1 py-0.5 text-foreground/90">
              {name === 'You' ? <span className="font-medium">You</span> : name}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
