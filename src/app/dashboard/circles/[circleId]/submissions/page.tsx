'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { AdminSubmissionDashboard } from '@/components/AdminSubmissionDashboard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SubmissionsPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })

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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/dashboard?circle=${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Submission Status</h1>
      </header>

      <div className="flex flex-1 flex-col px-6 py-6">
        <AdminSubmissionDashboard circleId={circleId} />
      </div>
    </div>
  )
}
