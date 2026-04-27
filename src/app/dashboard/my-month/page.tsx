'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useConvexAuth } from 'convex/react'
import { ArrowLeft, BookHeart, PlusCircle } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'

export default function YourMonthIndexPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const data = useQuery(api.yourMonth.listYourMonthsAvailable, isAuthenticated ? {} : 'skip')

  useEffect(() => {
    if (!data) return
    const target = data.months[0]?.cycleId
    if (target) {
      router.replace(`/dashboard/my-month/${target}`)
    }
  }, [data, router])

  // Keep the spinner visible while Clerk hydrates so we don't flash the
  // "Join or create" CTA at someone whose auth simply hasn't resolved yet.
  if (authLoading || data === undefined) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!data.hasActiveMembership) {
    return (
      <div className="safe-area-top safe-area-bottom flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 px-4 py-3">
          <button onClick={() => router.replace('/dashboard')} aria-label="Back">
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Your Month</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <PlusCircle className="size-8 text-primary" />
          </div>
          <p className="text-base text-muted-foreground">
            Join or create a circle to start your monthly journal.
          </p>
          <Link
            href="/dashboard/create"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Create a circle
          </Link>
        </div>
      </div>
    )
  }

  if (data.months.length === 0) {
    return (
      <div className="safe-area-top safe-area-bottom flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 px-4 py-3">
          <button onClick={() => router.replace('/dashboard')} aria-label="Back">
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Your Month</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <BookHeart className="size-8 text-primary" />
          </div>
          <p className="text-base text-muted-foreground">
            Your Month will appear here after you&apos;ve written your first update.
          </p>
          <Link
            href="/dashboard/submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Write your first update
          </Link>
        </div>
      </div>
    )
  }

  // Redirecting; render a spinner while navigation completes.
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  )
}
