'use client'

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
  progress: Record<string, { answered: number; total: number }>
}

export function CircleSidebar({
  circles,
  activeCircleId,
  onCircleChange,
  progress,
}: CircleSidebarProps) {
  return (
    <div className="flex flex-col gap-2 px-5">
      <span className="font-serif text-lg text-foreground">Submitting To:</span>
      {circles.map((circle) => {
        const isActive = circle.id === activeCircleId
        const p = progress[circle.id]
        const progressLabel = p ? `${p.answered} of ${p.total} answered` : '0 answered'

        return (
          <button
            key={circle.id}
            onClick={() => onCircleChange(circle.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
              isActive ? 'bg-accent' : 'hover:bg-muted/30'
            )}
          >
            <Avatar className="size-7">
              <AvatarImage src={circle.iconUrl ?? undefined} alt={circle.name} />
              <AvatarFallback className="text-xs">
                {circle.name.charAt(0).toUpperCase()}
              </AvatarFallback>
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
      })}
    </div>
  )
}
