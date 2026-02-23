'use client'

import { useParams } from 'next/navigation'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CircleSettings } from '@/components/CircleSettings'

export default function CircleSettingsPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href={`/dashboard/circles/${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Circle Settings</h1>
      </header>

      <div className="safe-area-bottom flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-lg">
          <CircleSettings circleId={circleId} />
        </div>
      </div>
    </div>
  )
}
