'use client'

import { useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'
import { trackEvent } from '@/lib/analytics'
import { getLastSecondSaturday } from '@/lib/dates'

export default function CircleLandingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const circleId = params.circleId as Id<'circles'>

  // Parse month from searchParams or default to last second Saturday
  const monthParam = searchParams.get('month') // e.g., "2026-02"
  const selectedDate = monthParam ? new Date(monthParam + '-01') : getLastSecondSaturday()

  const circle = useQuery(api.circles.getCircle, { circleId })
  const newsletters = useQuery(api.newsletters.getNewslettersByCircle, { circleId })

  // Find newsletter matching selected month
  const matchedNewsletter = newsletters?.find((n) => {
    const pubDate = new Date(n.publishedAt ?? n.createdAt)
    return (
      pubDate.getMonth() === selectedDate.getMonth() &&
      pubDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Get full newsletter data with htmlContent
  const newsletter = useQuery(
    api.newsletters.getNewsletterById,
    matchedNewsletter ? { newsletterId: matchedNewsletter._id } : 'skip'
  )
  const markRead = useMutation(api.newsletterReads.markNewsletterRead)
  const hasMarkedRead = useRef(false)

  // Mark newsletter as read on mount
  useEffect(() => {
    if (newsletter && !newsletter.isRead && !hasMarkedRead.current) {
      hasMarkedRead.current = true
      markRead({ circleId, newsletterId: newsletter._id }).catch(() => {})
      trackEvent('newsletter_opened', {
        circle_id: circleId,
        newsletter_id: newsletter._id,
        issue_number: newsletter.issueNumber,
      })
    }
  }, [newsletter, circleId, markRead])

  // Loading
  if (
    circle === undefined ||
    newsletters === undefined ||
    (matchedNewsletter && newsletter === undefined)
  ) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard">
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Loading...</h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  // Circle not found
  if (!circle) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard">
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Circle not found</h1>
        </header>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-muted-foreground">This circle may have been removed.</p>
        </div>
      </div>
    )
  }

  // No newsletter for selected month
  if (!newsletter) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="absolute left-0 top-0 z-10 p-4">
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-lg font-medium text-foreground">No newsletter for this month</p>
          <p className="text-sm text-muted-foreground">
            Try selecting a different month from the date picker.
          </p>
        </div>
      </div>
    )
  }

  const sections = parseNewsletterContent(newsletter.htmlContent)
  const circleInfo = {
    name: circle.name,
    iconUrl: circle.iconUrl ?? null,
    coverUrl: circle.coverUrl ?? null,
    timezone: 'UTC',
  }

  return (
    <div className="safe-area-top relative flex h-dvh flex-col bg-background">
      <header className="absolute left-0 top-0 z-10 p-4">
        <Link
          href="/dashboard"
          className="flex size-9 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
      </header>

      <main className="safe-area-bottom flex-1 overflow-y-auto">
        <NewsletterView
          circle={circleInfo}
          circleId={circleId}
          issueNumber={newsletter.issueNumber}
          publishedAt={newsletter.publishedAt}
          sections={sections}
        />
      </main>
    </div>
  )
}
