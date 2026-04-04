'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getNextSecondSaturday, formatShortDate, getSecondSaturdayDeadline } from '@/lib/dates'
import { useDeadlineCountdown } from '@/hooks/useDeadlineCountdown'

interface SubmitFABProps {
  nextDeadlineLabel?: string
  sidebarWidthVw?: number
}

export function SubmitFAB({ nextDeadlineLabel, sidebarWidthVw }: SubmitFABProps) {
  const nextDate = getNextSecondSaturday()
  const label = nextDeadlineLabel ?? formatShortDate(nextDate)
  const deadline = getSecondSaturdayDeadline(nextDate).getTime()
  const countdown = useDeadlineCountdown(deadline)

  // Always compute the display values from the hook
  // When past deadline, the hook returns isPast=true with zeroed values,
  // but the label will just show "0m 0s to next edition" briefly until
  // getNextSecondSaturday() recalculates on the next render cycle
  const { days, hours, minutes, seconds } = countdown

  let timeDisplay: string
  if (days > 0) {
    timeDisplay = `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    timeDisplay = `${hours}h ${minutes}m ${seconds}s`
  } else {
    timeDisplay = `${minutes}m ${seconds}s`
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center md:left-0 md:right-auto"
      style={sidebarWidthVw ? { width: `${sidebarWidthVw}vw` } : undefined}
    >
      <Link
        href="/dashboard/submit"
        data-testid="submit-button"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-5 stroke-[3]" />
        {label}
      </Link>
      <p className="pointer-events-none mt-1.5 text-center font-mono text-xs text-muted-foreground/60">
        {timeDisplay}
        <span className="font-mono"> left</span>
      </p>
    </div>
  )
}
