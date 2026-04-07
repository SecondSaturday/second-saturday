'use client'

import { useMemo, useState, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { MultiCircleSubmissionScreen } from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { getSecondSaturdayDeadline } from '@/lib/dates'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CircleSidebar } from '@/components/submissions/CircleSidebar'

function getDueLabel(): string {
  const now = new Date()
  const deadline = getSecondSaturdayDeadline(now)
  if (now.getTime() > deadline.getTime()) return 'Submissions locked'
  const diffMs = deadline.getTime() - now.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function getEditionTitle(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long' }) + ' Edition'
}

export default function SubmitPage() {
  const cycleId = useMemo(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  }, [])

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const userCircles = useQuery(api.circles.getCirclesByUser)
  const editionTitle = useMemo(() => getEditionTitle(), [])
  const dueLabel = getDueLabel()

  // Lifted state — must be before any early returns
  const [desktopActiveCircle, setDesktopActiveCircle] = useState('')
  const [circleProgress, setCircleProgress] = useState<
    Record<string, { answered: number; total: number }>
  >({})

  const handleProgressUpdate = useCallback((circleId: string, answered: number, total: number) => {
    setCircleProgress((prev) => {
      const existing = prev[circleId]
      if (existing && existing.answered === answered && existing.total === total) return prev
      return { ...prev, [circleId]: { answered, total } }
    })
  }, [])

  if (userCircles === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (userCircles.length === 0) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-5" />
            <span className="text-[17px]">Back</span>
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">Join or create a circle to start submitting.</p>
          <Link
            href="/dashboard/create"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create a circle
          </Link>
        </div>
      </div>
    )
  }

  const circles: Circle[] = userCircles
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => ({
      id: c._id,
      name: c.name,
      iconUrl: c.iconUrl ?? null,
      status: 'not-started' as const,
    }))

  // Use first circle as default if no explicit selection yet
  const effectiveActiveCircle = desktopActiveCircle || circles[0]?.id || ''

  if (isDesktop) {
    return (
      <div className="safe-area-top flex h-dvh bg-background">
        {/* Desktop sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex flex-col gap-5 px-5 pb-6 pt-7">
            <Link href="/dashboard" className="flex items-center gap-1 text-primary text-[15px]">
              <ChevronLeft className="size-5" />
              Back
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-[28px] text-foreground">{editionTitle}</h1>
              <span className="text-[13px] text-foreground/40">{dueLabel}</span>
            </div>
          </div>
          <CircleSidebar
            circles={circles}
            activeCircleId={effectiveActiveCircle}
            onCircleChange={setDesktopActiveCircle}
            progress={circleProgress}
          />
        </div>

        {/* Main content area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Top bar with submit button */}
          <div className="flex shrink-0 items-center justify-end border-b border-border bg-card px-8 py-2.5">
            <Link
              href="/dashboard/submit/review"
              className="rounded-lg bg-primary px-4 py-2 text-[15px] font-semibold text-primary-foreground"
            >
              Submit
            </Link>
          </div>

          <MultiCircleSubmissionScreen
            circles={circles}
            cycleId={cycleId}
            variant="redesign"
            activeCircleId={effectiveActiveCircle}
            onCircleChange={setDesktopActiveCircle}
            onProgressUpdate={handleProgressUpdate}
          />
        </div>
      </div>
    )
  }

  // Mobile layout
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      {/* Mobile header */}
      <div className="shrink-0 bg-card">
        {/* Nav bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/dashboard" className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-6" />
            <span className="text-[17px]">Back</span>
          </Link>
          <Link
            href="/dashboard/submit/review"
            className="rounded-lg bg-primary px-4 py-2 text-[15px] font-semibold text-primary-foreground"
          >
            Submit
          </Link>
        </div>
        {/* Title area */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h1 className="font-serif text-[34px] text-foreground">{editionTitle}</h1>
          <span className="text-[15px] text-foreground/40">{dueLabel}</span>
        </div>
      </div>

      {/* Content — will be rebuilt in later stories */}
      <MultiCircleSubmissionScreen circles={circles} cycleId={cycleId} variant="redesign" />
    </div>
  )
}
