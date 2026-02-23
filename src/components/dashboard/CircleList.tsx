'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { CircleListItem } from './CircleListItem'
import { EmptyState } from './EmptyState'
import { trackEvent } from '@/lib/analytics'

interface CircleListProps {
  onCircleSelect?: (circleId: string) => void
}

export function CircleList({ onCircleSelect }: CircleListProps) {
  const circles = useQuery(api.circles.getCirclesByUser)

  if (circles === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-2 px-4 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 py-4">
            <div className="size-14 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!circles || circles.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="safe-area-bottom flex-1 overflow-y-auto pb-20" data-testid="circle-list">
      {circles.map((circle) => {
        if (!circle) return null
        return (
          <CircleListItem
            key={circle._id}
            name={circle.name}
            iconUrl={circle.iconUrl}
            memberNames={circle.memberNames}
            memberCount={circle.memberCount}
            hasUnread={circle.hasUnread}
            onClick={() => {
              trackEvent('circle_selected', { circleId: circle._id })
              onCircleSelect?.(circle._id)
            }}
          />
        )
      })}
    </div>
  )
}
