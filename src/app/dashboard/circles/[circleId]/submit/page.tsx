'use client'

import { useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  MultiCircleSubmissionScreen,
  type MultiCircleSubmissionScreenHandle,
} from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { getDueLabel, getActiveCycleId } from '@/lib/dates'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { CircleSidebar } from '@/components/submissions/CircleSidebar'

function getEditionTitle(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long' }) + ' Edition'
}

export default function SubmitPage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>
  const isDesktop = useIsDesktop()

  const cycleId = useMemo(() => getActiveCycleId(), [])

  const editionTitle = useMemo(() => getEditionTitle(), [])
  const dueLabel = getDueLabel()

  const circle = useQuery(api.circles.getCircle, { circleId })
  const submission = useQuery(
    api.submissions.getSubmissionForCircle,
    circle ? { circleId, cycleId } : 'skip'
  )
  const hasAnyAnswers = useQuery(api.submissions.hasAnyResponses, { cycleId }) ?? false

  const screenRef = useRef<MultiCircleSubmissionScreenHandle>(null)

  const backHref = isDesktop ? `/dashboard?circle=${circleId}` : `/dashboard/circles/${circleId}`

  const handleGoToReview = async () => {
    if (!hasAnyAnswers) return
    await screenRef.current?.flushPendingChanges()
    router.push('/dashboard/submit/review')
  }

  if (circle === undefined || submission === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-5" />
            <span className="text-[17px]">Back</span>
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Circle not found</p>
        </div>
      </div>
    )
  }

  const status: Circle['status'] = submission?.submittedAt
    ? 'submitted'
    : submission?.lockedAt
      ? 'locked'
      : submission
        ? 'in-progress'
        : 'not-started'

  const circles: Circle[] = [
    {
      id: circleId,
      name: circle.name,
      iconUrl: circle.iconUrl ?? null,
      status,
    },
  ]

  const reviewButton =
    dueLabel === 'Submissions locked' ? (
      <span className="text-sm font-medium text-muted-foreground">
        {isDesktop ? 'Submissions locked' : 'Locked'}
      </span>
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
    )

  if (isDesktop) {
    return (
      <div className="safe-area-top flex h-dvh bg-background">
        {/* Desktop sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex flex-col gap-5 px-5 pb-6 pt-7">
            <Link href={backHref} className="flex items-center gap-1 text-primary text-[15px]">
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
            activeCircleId={circleId}
            onCircleChange={() => {}}
            cycleId={cycleId}
          />
        </div>

        {/* Main content area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-end border-b border-border bg-card px-8 py-2.5">
            {reviewButton}
          </div>

          <MultiCircleSubmissionScreen
            ref={screenRef}
            circles={circles}
            cycleId={cycleId}
            variant="redesign"
            activeCircleId={circleId}
          />
        </div>
      </div>
    )
  }

  // Mobile layout
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <div className="shrink-0 bg-card">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href={backHref} className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-6" />
            <span className="text-[17px]">Back</span>
          </Link>
          {reviewButton}
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <h1 className="font-serif text-[34px] text-foreground">{editionTitle}</h1>
          <span className="text-[15px] text-foreground/40">{dueLabel}</span>
        </div>
      </div>

      <MultiCircleSubmissionScreen
        ref={screenRef}
        circles={circles}
        cycleId={cycleId}
        variant="redesign"
        activeCircleId={circleId}
      />
    </div>
  )
}
