'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { DeadlineCountdown } from '@/components/submissions'
import { getNextSecondSaturday } from '@/lib/dates'
import { useMemo } from 'react'

function getDeadlineTimestamp(): number {
  const d = getNextSecondSaturday(new Date())
  d.setUTCHours(10, 59, 0, 0)
  return d.getTime()
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
      {/* Deadline */}
      <DeadlineCountdown deadlineTimestamp={deadlineTimestamp} />

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
