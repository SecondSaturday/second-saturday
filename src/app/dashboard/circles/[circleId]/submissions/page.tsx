'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { AdminSubmissionDashboard } from '@/components/AdminSubmissionDashboard'
import { DeadlineCountdown } from '@/components/submissions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getNextSecondSaturday } from '@/lib/dates'
import { useMemo } from 'react'

function getDeadlineTimestamp(): number {
  const d = getNextSecondSaturday(new Date())
  d.setUTCHours(10, 59, 0, 0)
  return d.getTime()
}

export default function SubmissionsPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

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
        <Link href={`/dashboard?circle=${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Submission Status</h1>
      </header>

      <div className="safe-area-bottom flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        <DeadlineCountdown deadlineTimestamp={deadlineTimestamp} />
        <AdminSubmissionDashboard circleId={circleId} />
      </div>
    </div>
  )
}
