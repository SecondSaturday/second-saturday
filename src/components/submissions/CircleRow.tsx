'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface CircleRowCircle {
  id: string
  name: string
  iconUrl: string | null
}

interface CircleRowProps {
  circles: CircleRowCircle[]
  activeCircleId: string
  onCircleChange: (circleId: string) => void
}

export function CircleRow({ circles, activeCircleId, onCircleChange }: CircleRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card pl-5">
      <span className="shrink-0 font-serif text-lg text-foreground">To:</span>
      <div className="flex gap-4 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
        {circles.map((circle) => {
          const isActive = circle.id === activeCircleId
          return (
            <button
              key={circle.id}
              onClick={() => onCircleChange(circle.id)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <Avatar className="size-11">
                <AvatarImage src={circle.iconUrl ?? undefined} alt={circle.name} />
                <AvatarFallback className="text-sm">
                  {circle.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'text-[10px] max-w-[72px] truncate',
                  isActive ? 'font-semibold text-primary' : 'font-medium text-foreground'
                )}
              >
                {circle.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
