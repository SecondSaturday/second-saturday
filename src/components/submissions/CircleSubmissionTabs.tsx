'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SubmissionStatus = 'not-started' | 'in-progress' | 'submitted' | 'locked'

export interface Circle {
  id: string
  name: string
  iconUrl: string | null
  status: SubmissionStatus
  progress?: number // 0-1 for in-progress circles (optional)
}

interface CircleSubmissionTabsProps {
  circles: Circle[]
  activeCircleId: string
  onCircleChange: (circleId: string) => void
  children: React.ReactNode
}

function StatusIndicator({ status, progress }: { status: SubmissionStatus; progress?: number }) {
  const size = 64
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  if (status === 'locked') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/90 rounded-full p-1.5">
          <Lock className="size-4 text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-primary"
          />
        </svg>
        <div className="bg-primary rounded-full p-1">
          <Check className="size-3 text-primary-foreground" />
        </div>
      </div>
    )
  }

  if (status === 'in-progress') {
    // Dynamic progress based on prompts answered (defaults to 50% if not provided)
    const progressValue = progress ?? 0.5
    const offset = circumference - progressValue * circumference

    return (
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-300"
        />
      </svg>
    )
  }

  // not-started: empty ring
  return (
    <svg width={size} height={size} className="absolute inset-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/30"
      />
    </svg>
  )
}

export function CircleSubmissionTabs({
  circles,
  activeCircleId,
  onCircleChange,
  children,
}: CircleSubmissionTabsProps) {
  return (
    <Tabs value={activeCircleId} onValueChange={onCircleChange} className="w-full">
      {/* Instagram Stories-style horizontal tab bar */}
      <div className="border-b border-border/50 bg-background sticky top-0 z-10">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto overflow-y-hidden px-4 py-3 gap-4 scrollbar-hide"
        >
          {circles.map((circle) => (
            <TabsTrigger
              key={circle.id}
              value={circle.id}
              className={cn(
                'relative flex flex-col items-center gap-2 px-0 pb-2',
                'data-[state=active]:after:opacity-0',
                'focus-visible:ring-0 focus-visible:ring-offset-0'
              )}
            >
              {/* Avatar with status ring */}
              <div className="relative">
                <StatusIndicator status={circle.status} progress={circle.progress} />
                <Avatar
                  size="lg"
                  className={cn(
                    'size-14 ring-2 ring-background transition-transform',
                    'data-[state=active]:scale-110'
                  )}
                >
                  <AvatarImage src={circle.iconUrl ?? undefined} alt={circle.name} />
                  <AvatarFallback className="text-base">
                    {circle.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Circle name */}
              <span
                className={cn(
                  'text-xs font-medium max-w-[80px] truncate',
                  'text-muted-foreground',
                  'group-data-[state=active]/tabs:text-foreground'
                )}
              >
                {circle.name}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Content area for each circle's prompts */}
      {circles.map((circle) => (
        <TabsContent key={circle.id} value={circle.id} className="mt-0">
          {children}
        </TabsContent>
      ))}
    </Tabs>
  )
}
