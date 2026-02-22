'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { useMemo } from 'react'

/** Compute second Saturday deadline in UTC (fallback when backend hasn't loaded) */
function getDeadlineTimestamp(): number {
  const now = new Date(Date.now())
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
  const secondSaturdayDay = 1 + daysToFirstSaturday + 7
  const deadline = Date.UTC(year, month, secondSaturdayDay, 10, 59, 0)
  // If past this month's deadline, compute next month's
  if (Date.now() > deadline) {
    const nextMonth = month + 1
    const nextYear = nextMonth > 11 ? year + 1 : year
    const adjMonth = nextMonth > 11 ? 0 : nextMonth
    const nextFirstDay = new Date(Date.UTC(nextYear, adjMonth, 1))
    const nextDayOfWeek = nextFirstDay.getUTCDay()
    const nextDaysToFirstSat = (6 - nextDayOfWeek + 7) % 7
    const nextSecondSatDay = 1 + nextDaysToFirstSat + 7
    return Date.UTC(nextYear, adjMonth, nextSecondSatDay, 10, 59, 0)
  }
  return deadline
}

const STATUS_STYLES = {
  Submitted: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  'Not Started': 'bg-muted text-muted-foreground',
} as const

export function AdminSubmissionDashboard({ circleId }: { circleId: Id<'circles'> }) {
  const data = useQuery(api.memberships.getSubmissionStatus, { circleId })
  const deadlineTimestamp = useMemo(
    () => data?.deadline ?? getDeadlineTimestamp(),
    [data?.deadline]
  )

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const handleSendReminder = () => {
    toast.info('Reminders coming soon')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Reminder count */}
      <p className="text-xs text-muted-foreground">3 of 3 reminders remaining</p>

      {/* Member list */}
      <div className="flex flex-col gap-2">
        {data.members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <Avatar size="sm">
              {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
              <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
              {member.submittedAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(member.submittedAt).toLocaleString()}
                </p>
              )}
            </div>

            <Badge variant="outline" className={STATUS_STYLES[member.status]}>
              {member.status}
            </Badge>

            {member.status !== 'Submitted' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendReminder}
                title="Send reminder"
              >
                <Send className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {data.members.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No members yet</p>
      )}
    </div>
  )
}
