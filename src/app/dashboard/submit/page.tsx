'use client'

import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { MultiCircleSubmissionScreen } from '@/screens/submissions/MultiCircleSubmissionScreen'
import type { Circle } from '@/components/submissions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SubmitPage() {
  const cycleId = useMemo(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  }, [])

  const userCircles = useQuery(api.circles.getCirclesByUser)

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
          <Link href="/dashboard">
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Make Submission</h1>
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

  const circles: Circle[] = userCircles.map((c) => ({
    id: c._id,
    name: c.name,
    iconUrl: c.iconUrl ?? null,
    status: 'not-started' as const,
  }))

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Make Submission</h1>
      </header>
      <MultiCircleSubmissionScreen circles={circles} cycleId={cycleId} />
    </div>
  )
}
