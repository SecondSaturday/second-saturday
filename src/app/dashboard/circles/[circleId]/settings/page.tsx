'use client'

import { useParams, useRouter } from 'next/navigation'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { ArrowLeft } from 'lucide-react'
import { CircleSettings } from '@/components/CircleSettings'

export default function CircleSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>
  const isDesktop = useIsDesktop()

  const handleBack = () => {
    if (isDesktop) {
      router.replace(`/dashboard?circle=${circleId}`)
    } else {
      router.replace(`/dashboard/circles/${circleId}`)
    }
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={handleBack} aria-label="Back">
          <ArrowLeft className="size-5 text-foreground" />
        </button>
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
