'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { getSecondSaturdayDeadline } from '@/lib/dates'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

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

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatSubmittedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

type CircleStatus = 'ready' | 'submitted' | 'unsubmitted-changes' | 'empty'

interface CircleReviewData {
  circleId: Id<'circles'>
  circleName: string
  circleIconUrl: string | null
  totalPrompts: number
  answeredCount: number
  submissionId: Id<'submissions'> | null
  submittedAt: number | null
  lockedAt: number | null
  updatedAt: number | null
}

function getCircleStatus(circle: CircleReviewData): CircleStatus {
  if (circle.answeredCount === 0) return 'empty'
  // Still locked = submitted
  if (circle.lockedAt) return 'submitted'
  // Was submitted but now unlocked (edited after submit)
  if (circle.submittedAt && !circle.lockedAt) return 'unsubmitted-changes'
  return 'ready'
}

export default function ReviewPage() {
  const cycleId = useMemo(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  }, [])

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const editionTitle = useMemo(() => getEditionTitle(), [])
  const dueLabel = getDueLabel()
  const reviewData = useQuery(api.submissions.getReviewData, { cycleId })
  const lockSubmission = useMutation(api.submissions.lockSubmission)

  const [submittingCircles, setSubmittingCircles] = useState<Set<string>>(new Set())

  if (reviewData === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const isLocked = dueLabel === 'Submissions locked'
  const allSubmitted =
    reviewData.length > 0 &&
    reviewData.every((c) => {
      const status = getCircleStatus(c)
      return status === 'submitted' || status === 'empty'
    })
  const hasSubmittableCircles = reviewData.some((c) => {
    const status = getCircleStatus(c)
    return status === 'ready' || status === 'unsubmitted-changes'
  })

  async function handleSubmitCircle(circle: CircleReviewData) {
    if (!circle.submissionId) return
    setSubmittingCircles((prev) => new Set(prev).add(circle.circleId))
    try {
      await lockSubmission({ submissionId: circle.submissionId })
      toast.success(`${circle.circleName} submitted!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmittingCircles((prev) => {
        const next = new Set(prev)
        next.delete(circle.circleId)
        return next
      })
    }
  }

  async function handleSubmitAll() {
    if (!reviewData) return

    const submittable = reviewData.filter((c) => {
      const status = getCircleStatus(c)
      return (status === 'ready' || status === 'unsubmitted-changes') && c.submissionId
    })

    if (submittable.length === 0) return

    const ids = new Set(submittable.map((c) => c.circleId))
    setSubmittingCircles(ids)

    const results = await Promise.allSettled(
      submittable.map((circle) => lockSubmission({ submissionId: circle.submissionId! }))
    )
    let successCount = 0
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        toast.error(`Failed to submit ${submittable[i]!.circleName}`)
      }
    })

    setSubmittingCircles(new Set())

    if (successCount === submittable.length) {
      toast.success("You're all set for this month!")
    } else if (successCount > 0) {
      toast.success(`${successCount} of ${submittable.length} circles submitted`)
    }
  }

  if (isDesktop) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        {/* Desktop header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-8 py-3">
          <Link
            href="/dashboard/submit"
            className="flex items-center gap-1 text-[15px] text-primary"
          >
            <ChevronLeft className="size-5" />
            Back to Contributions
          </Link>
          <h1 className="font-serif text-[24px] text-foreground">Review & Submit</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[15px] text-primary">
              Dashboard
            </Link>
            {!isLocked && (
              <button
                onClick={handleSubmitAll}
                disabled={!hasSubmittableCircles || submittingCircles.size > 0}
                className={cn(
                  'rounded-lg px-4 py-2 text-[15px] font-semibold transition-opacity',
                  hasSubmittableCircles
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/50 text-primary-foreground/70'
                )}
              >
                Submit All
              </button>
            )}
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[700px] px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-serif text-[28px] text-foreground">{editionTitle}</h2>
              <span className="text-[13px] text-foreground/40">{dueLabel}</span>
            </div>

            {allSubmitted && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center dark:border-green-900 dark:bg-green-950">
                <p className="text-[15px] font-medium text-green-700 dark:text-green-300">
                  You&apos;re all set for this month!
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {reviewData.map((circle) => (
                <CircleStatusCard
                  key={circle.circleId}
                  circle={circle}
                  isSubmitting={submittingCircles.has(circle.circleId)}
                  isLocked={isLocked}
                  onSubmit={() => handleSubmitCircle(circle)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      {/* Mobile nav bar */}
      <div className="shrink-0 bg-card">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/dashboard/submit" className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-6" />
            <span className="text-[17px]">Back</span>
          </Link>
          <Link href="/dashboard" className="text-[15px] text-primary">
            Dashboard
          </Link>
        </div>
        {/* Title area */}
        <div className="px-5 pb-4 pt-1">
          <h1 className="font-serif text-[28px] text-foreground">Review & Submit</h1>
          <p className="mt-0.5 text-[13px] text-foreground/40">
            {editionTitle} · {dueLabel}
          </p>
        </div>
      </div>

      {/* Circle cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {allSubmitted && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center dark:border-green-900 dark:bg-green-950">
            <p className="text-[15px] font-medium text-green-700 dark:text-green-300">
              You&apos;re all set for this month!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {reviewData.map((circle) => (
            <CircleStatusCard
              key={circle.circleId}
              circle={circle}
              isSubmitting={submittingCircles.has(circle.circleId)}
              isLocked={isLocked}
              onSubmit={() => handleSubmitCircle(circle)}
            />
          ))}
        </div>
      </div>

      {/* Submit All bar */}
      {!isLocked && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 safe-area-bottom">
          <button
            onClick={handleSubmitAll}
            disabled={!hasSubmittableCircles || submittingCircles.size > 0}
            className={cn(
              'w-full rounded-lg py-3 text-[15px] font-semibold transition-opacity',
              hasSubmittableCircles
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/50 text-primary-foreground/70'
            )}
          >
            Submit All Circles
          </button>
        </div>
      )}
    </div>
  )
}

function CircleStatusCard({
  circle,
  isSubmitting,
  isLocked,
  onSubmit,
}: {
  circle: CircleReviewData
  isSubmitting: boolean
  isLocked: boolean
  onSubmit: () => void
}) {
  const status = getCircleStatus(circle)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 md:px-5 md:py-4">
      {/* Avatar */}
      <Avatar className="size-9 shrink-0 md:size-10">
        <AvatarImage src={circle.circleIconUrl ?? undefined} alt={circle.circleName} />
        <AvatarFallback className="text-sm">
          {circle.circleName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {status === 'unsubmitted-changes' && (
            <span className="size-2 shrink-0 rounded-full bg-amber-500" />
          )}
          <span className="truncate text-[15px] font-semibold text-foreground">
            {circle.circleName}
          </span>
        </div>
        <span className="text-[12px] text-muted-foreground">
          {circle.answeredCount} of {circle.totalPrompts} answered
        </span>
        <StatusLabel circle={circle} status={status} />
      </div>

      {/* Action button */}
      {!isLocked && (
        <SubmitButton status={status} isSubmitting={isSubmitting} onSubmit={onSubmit} />
      )}
    </div>
  )
}

function StatusLabel({ circle, status }: { circle: CircleReviewData; status: CircleStatus }) {
  switch (status) {
    case 'submitted':
      return (
        <span className="flex items-center gap-1 text-[12px] text-green-600 dark:text-green-400">
          <Check className="size-3" />
          Submitted on {formatSubmittedDate(circle.submittedAt!)}
        </span>
      )
    case 'unsubmitted-changes':
      return (
        <span className="text-[12px] text-amber-600 dark:text-amber-400">
          Unsubmitted changes · Last edited {formatRelativeTime(circle.updatedAt!)}
        </span>
      )
    case 'ready':
      return (
        <span className="text-[12px] text-muted-foreground">
          Last edited {formatRelativeTime(circle.updatedAt!)}
        </span>
      )
    case 'empty':
      return <span className="text-[12px] text-muted-foreground">No entries yet</span>
  }
}

function SubmitButton({
  status,
  isSubmitting,
  onSubmit,
}: {
  status: CircleStatus
  isSubmitting: boolean
  onSubmit: () => void
}) {
  if (status === 'empty') {
    return (
      <span className="shrink-0 rounded-lg bg-muted px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground/50">
        Submit
      </span>
    )
  }

  if (status === 'submitted') {
    return (
      <span className="shrink-0 rounded-lg bg-muted px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground">
        Submitted
      </span>
    )
  }

  return (
    <button
      onClick={onSubmit}
      disabled={isSubmitting}
      className="shrink-0 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
    >
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )
}
