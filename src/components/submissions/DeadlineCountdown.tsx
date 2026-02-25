'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDeadlineCountdown } from '@/hooks/useDeadlineCountdown'
import { getNextSecondSaturday } from '@/lib/dates'

interface DeadlineCountdownProps {
  /** Unix timestamp in milliseconds. Defaults to the next Second Saturday at 10:59 AM UTC. */
  deadlineTimestamp?: number
  className?: string
}

export function DeadlineCountdown({ deadlineTimestamp, className }: DeadlineCountdownProps) {
  const resolvedTimestamp =
    deadlineTimestamp ??
    (() => {
      const d = getNextSecondSaturday(new Date())
      d.setUTCHours(10, 59, 0, 0)
      return d.getTime()
    })()

  const { days, hours, minutes, seconds, isPast, isUrgent } =
    useDeadlineCountdown(resolvedTimestamp)

  const deadlineLocal = new Date(resolvedTimestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  let timeDisplay: string
  if (isPast) {
    timeDisplay = 'Submissions Locked'
  } else if (days > 0) {
    timeDisplay = `${days}d ${hours}h ${minutes}m ${seconds}s`
  } else if (hours > 0) {
    timeDisplay = `${hours}h ${minutes}m ${seconds}s`
  } else {
    timeDisplay = `${minutes}m ${seconds}s`
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors',
        isPast && 'border-destructive/50 bg-destructive/10',
        isUrgent && !isPast && 'border-amber-500/50 bg-amber-500/10',
        !isUrgent && !isPast && 'border-border bg-muted/30',
        className
      )}
    >
      <Clock
        className={cn(
          'size-5 shrink-0',
          isPast && 'text-destructive',
          isUrgent && !isPast && 'text-amber-600 dark:text-amber-500',
          !isUrgent && !isPast && 'text-muted-foreground'
        )}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground">
          {isPast ? 'Submission Locked' : `Deadline: ${deadlineLocal}`}
        </span>
        <span
          className={cn(
            'font-mono text-sm font-semibold',
            isPast && 'text-destructive',
            isUrgent && !isPast && 'text-amber-600 dark:text-amber-500',
            !isUrgent && !isPast && 'text-foreground'
          )}
        >
          {timeDisplay}
        </span>
      </div>
    </div>
  )
}
