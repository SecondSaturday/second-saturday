'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { MultiCircleSubmissionScreen } from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

export default function SubmitPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  const cycleId = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const circle = useQuery(api.circles.getCircle, { circleId })
  const submission = useQuery(api.submissions.getSubmissionForCircle, { circleId, cycleId })

  if (circle === undefined || submission === undefined) {
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

  const status: Circle['status'] = submission?.submittedAt
    ? 'submitted'
    : submission
      ? 'in-progress'
      : 'not-started'

  const circles: Circle[] = [
    {
      id: circleId,
      name: circle.name,
      iconUrl: circle.iconUrl,
      status,
    },
  ]

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href={`/dashboard?circle=${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Make Submission</h1>
      </header>
      <MultiCircleSubmissionScreen circles={circles} cycleId={cycleId} />
    </div>
  )
}
