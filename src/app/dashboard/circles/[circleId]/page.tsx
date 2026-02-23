'use client'

import { useParams } from 'next/navigation'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { CircleHome } from '@/components/CircleHome'

export default function CircleHomePage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>
  const circle = useQuery(api.circles.getCircle, { circleId })

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">
          {circle?.name ?? ''}
        </h1>
        <Link href={`/dashboard/circles/${circleId}/settings`}>
          <Settings className="size-5 text-muted-foreground" />
        </Link>
      </header>

      <CircleHome circleId={circleId} />
    </div>
  )
}
