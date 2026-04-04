'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getSecondSaturday } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSelect: (date: Date) => void
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 5
const PADDING = Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT

function generateYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
}

const YEARS = generateYears()

interface WheelColumnProps {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function WheelColumn({ items, selectedIndex, onSelect }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(true)

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = ref.current
    if (!el) return
    isUserScrolling.current = false
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior })
    setTimeout(
      () => {
        isUserScrolling.current = true
      },
      behavior === 'smooth' ? 300 : 50
    )
  }, [])

  useEffect(() => {
    scrollToIndex(selectedIndex, 'instant')
  }, [selectedIndex, scrollToIndex])

  const commitSelection = useCallback(() => {
    if (!isUserScrolling.current) return
    const el = ref.current
    if (!el) return
    const index = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(items.length - 1, index))
    if (clamped !== selectedIndex) {
      onSelect(clamped)
    }
  }, [items.length, selectedIndex, onSelect])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(commitSelection, 100)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
    }
  }, [commitSelection])

  const height = ITEM_HEIGHT * VISIBLE_COUNT

  return (
    <div className="relative flex-1" style={{ height }}>
      {/* Selection band */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-border/50"
        style={{ top: PADDING, height: ITEM_HEIGHT }}
      />
      {/* Top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: PADDING,
          background: 'linear-gradient(to bottom, hsl(var(--background)) 10%, transparent)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: PADDING,
          background: 'linear-gradient(to top, hsl(var(--background)) 10%, transparent)',
        }}
      />
      <div
        ref={ref}
        className="h-full overflow-y-auto"
        style={{
          scrollSnapType: 'y mandatory',
          scrollPaddingTop: PADDING,
          scrollPaddingBottom: PADDING,
          scrollbarWidth: 'none',
        }}
      >
        {/* Top spacer so first item can be centered */}
        <div style={{ height: PADDING }} />
        {items.map((item, i) => (
          <div
            key={item}
            className={cn(
              'flex cursor-pointer select-none items-center justify-center transition-all duration-150',
              i === selectedIndex
                ? 'text-lg font-semibold text-foreground'
                : 'text-base text-muted-foreground/50'
            )}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
            onClick={() => {
              onSelect(i)
              scrollToIndex(i)
            }}
          >
            {item}
          </div>
        ))}
        {/* Bottom spacer so last item can be centered */}
        <div style={{ height: PADDING }} />
      </div>
    </div>
  )
}

export function DatePicker({ open, onOpenChange, selectedDate, onSelect }: DatePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DatePickerContent
          selectedDate={selectedDate}
          onSelect={onSelect}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function DatePickerContent({
  selectedDate,
  onSelect,
  onOpenChange,
}: {
  selectedDate: Date
  onSelect: (date: Date) => void
  onOpenChange: (open: boolean) => void
}) {
  const [month, setMonth] = useState(selectedDate.getMonth())
  const [yearIndex, setYearIndex] = useState(() => {
    const idx = YEARS.indexOf(selectedDate.getFullYear())
    return idx >= 0 ? idx : 0
  })

  const handleConfirm = () => {
    const date = getSecondSaturday(YEARS[yearIndex] ?? new Date().getFullYear(), month)
    onSelect(date)
    onOpenChange(false)
  }

  return (
    <DialogContent className="max-w-xs p-0" showCloseButton={false}>
      <DialogHeader className="px-4 pt-4">
        <DialogTitle className="text-center">Select Month</DialogTitle>
      </DialogHeader>
      <div className="flex px-4">
        <WheelColumn items={MONTHS} selectedIndex={month} onSelect={setMonth} />
        <WheelColumn items={YEARS.map(String)} selectedIndex={yearIndex} onSelect={setYearIndex} />
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => onOpenChange(false)}
          className="flex-1 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </DialogContent>
  )
}
