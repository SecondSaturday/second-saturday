'use client'

import { useMemo, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  MultiCircleSubmissionScreen,
  type MultiCircleSubmissionScreenHandle,
} from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDueLabel } from '@/lib/dates'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { CircleSidebar } from '@/components/submissions/CircleSidebar'

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

  const router = useRouter()
  const screenRef = useRef<MultiCircleSubmissionScreenHandle>(null)

  // Global check: does ANY circle have ≥1 response?
  const hasAnyAnswers = useQuery(api.submissions.hasAnyResponses, { cycleId }) ?? false

  const handleGoToReview = async () => {
    if (!hasAnyAnswers) return
    await screenRef.current?.flushPendingChanges()
    router.push('/dashboard/submit/review')
  }

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
            cycleId={cycleId}
          />
        </div>

        {/* Main content area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Top bar with submit button */}
          <div className="flex shrink-0 items-center justify-end border-b border-border bg-card px-8 py-2.5">
            {dueLabel === 'Submissions locked' ? (
              <span className="text-sm font-medium text-muted-foreground">Submissions locked</span>
            ) : (
              <button
                onClick={handleGoToReview}
                disabled={!hasAnyAnswers}
                className={cn(
                  'rounded-lg px-4 py-2 text-[15px] font-semibold transition-opacity',
                  hasAnyAnswers
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/50 text-primary-foreground/70'
                )}
              >
                Submit
              </button>
            )}
          </div>

          <MultiCircleSubmissionScreen
            ref={screenRef}
            circles={circles}
            cycleId={cycleId}
            variant="redesign"
            activeCircleId={effectiveActiveCircle}
            onCircleChange={setDesktopActiveCircle}
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
          {dueLabel === 'Submissions locked' ? (
            <span className="text-sm font-medium text-muted-foreground">Locked</span>
          ) : (
            <button
              onClick={handleGoToReview}
              disabled={!hasAnyAnswers}
              className={cn(
                'rounded-lg px-4 py-2 text-[15px] font-semibold transition-opacity',
                hasAnyAnswers
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/50 text-primary-foreground/70'
              )}
            >
              Submit
            </button>
          )}
        </div>
        {/* Title area */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h1 className="font-serif text-[34px] text-foreground">{editionTitle}</h1>
          <span className="text-[15px] text-foreground/40">{dueLabel}</span>
        </div>
      </div>

      {/* Content — will be rebuilt in later stories */}
      <MultiCircleSubmissionScreen
        ref={screenRef}
        circles={circles}
        cycleId={cycleId}
        variant="redesign"
      />
    </div>
  )
}
