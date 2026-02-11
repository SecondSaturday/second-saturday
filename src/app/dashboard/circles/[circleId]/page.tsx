'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { CircleHome } from '@/components/CircleHome'
import { CircleSettings } from '@/components/CircleSettings'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function CircleHomePage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>
  const circle = useQuery(api.circles.getCircle, { circleId })
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">
          {circle?.name ?? ''}
        </h1>
        <button onClick={() => setShowSettings(true)}>
          <Settings className="size-5 text-muted-foreground" />
        </button>
      </header>

      <CircleHome circleId={circleId} onSettingsClick={() => setShowSettings(true)} />

      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Circle Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CircleSettings circleId={circleId} onClose={() => setShowSettings(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
