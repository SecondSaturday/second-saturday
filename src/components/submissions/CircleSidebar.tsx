'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface CircleSidebarCircle {
  id: string
  name: string
  iconUrl: string | null
}

interface CircleSidebarProps {
  circles: CircleSidebarCircle[]
  activeCircleId: string
  onCircleChange: (circleId: string) => void
  cycleId: string
}

export function CircleSidebar({
  circles,
  activeCircleId,
  onCircleChange,
  cycleId,
}: CircleSidebarProps) {
  return (
    <div className="flex flex-col gap-2 px-5">
      <span className="font-serif text-lg text-foreground">Submitting To:</span>
      {circles.map((circle) => (
        <CircleSidebarRow
          key={circle.id}
          circle={circle}
          isActive={circle.id === activeCircleId}
          onClick={() => onCircleChange(circle.id)}
          cycleId={cycleId}
        />
      ))}
    </div>
  )
}

function CircleSidebarRow({
  circle,
  isActive,
  onClick,
  cycleId,
}: {
  circle: CircleSidebarCircle
  isActive: boolean
  onClick: () => void
  cycleId: string
}) {
  const prompts = useQuery(api.submissions.getPromptsForCircle, {
    circleId: circle.id as Id<'circles'>,
  })
  const submission = useQuery(api.submissions.getSubmissionForCircle, {
    circleId: circle.id as Id<'circles'>,
    cycleId,
  })

  const total = prompts?.length ?? 0
  const answered = prompts
    ? prompts.filter((p) => {
        const response = submission?.responses?.find((r) => r.promptId === p._id)
        return response && response.text.trim().length > 0
      }).length
    : 0
  const progressLabel = total > 0 ? `${answered} of ${total} answered` : '0 answered'

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
        isActive ? 'bg-accent' : 'hover:bg-muted/30'
      )}
    >
      <Avatar className="size-7">
        <AvatarImage src={circle.iconUrl ?? undefined} alt={circle.name} />
        <AvatarFallback className="text-xs">{circle.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            'truncate text-[13px]',
            isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'
          )}
        >
          {circle.name}
        </span>
        <span className="text-[11px] text-muted-foreground">{progressLabel}</span>
      </div>
    </button>
  )
}
