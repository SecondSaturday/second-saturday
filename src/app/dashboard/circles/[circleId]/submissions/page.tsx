'use client'

import { useParams, useRouter } from 'next/navigation'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { AdminSubmissionDashboard } from '@/components/AdminSubmissionDashboard'
import { DeadlineCountdown } from '@/components/submissions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSecondSaturdayDeadline } from '@/lib/dates'
import { useMemo } from 'react'

function getDeadlineTimestamp(): number {
  const now = new Date()
  const deadline = getSecondSaturdayDeadline(now)
  if (now.getTime() > deadline.getTime()) {
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return getSecondSaturdayDeadline(nextMonth).getTime()
  }
  return deadline.getTime()
}

export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>

  const isDesktop = useIsDesktop()
  const circle = useQuery(api.circles.getCircle, { circleId })
  const deadlineTimestamp = useMemo(() => getDeadlineTimestamp(), [])

  if (circle === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  if (circle.role !== 'admin') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background">
        <p className="text-muted-foreground">Only admins can view submissions</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          onClick={() => {
            if (isDesktop) {
              router.push(`/dashboard?circle=${circleId}`)
            } else {
              router.push(`/dashboard/circles/${circleId}`)
            }
          }}
          aria-label="Back"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Submission Status</h1>
      </header>

      <div className="safe-area-bottom flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        <DeadlineCountdown deadlineTimestamp={deadlineTimestamp} />
        <AdminSubmissionDashboard circleId={circleId} />
      </div>
    </div>
  )
}
