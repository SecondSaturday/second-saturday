'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'
import { trackEvent } from '@/lib/analytics'

export default function CircleLandingPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>
  const circle = useQuery(api.circles.getCircle, { circleId })
  const newsletter = useQuery(api.newsletters.getLatestNewsletter, { circleId })
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
  if (circle === undefined || newsletter === undefined) {
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

  // No newsletter yet
  if (!newsletter) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard">
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{circle.name}</h1>
          <Link href={`/dashboard/circles/${circleId}/settings`}>
            <Settings className="size-5 text-muted-foreground" />
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-lg font-medium text-foreground">No newsletters yet</p>
          <p className="text-sm text-muted-foreground">
            Submissions are open — newsletters will appear here after the deadline.
          </p>
        </div>
      </div>
    )
  }

  const sections = parseNewsletterContent(newsletter.htmlContent)
  const circleInfo = {
    name: circle.name,
    iconUrl: null,
    coverUrl: null,
    timezone: 'UTC',
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{circle.name}</h1>
        <Link href={`/dashboard/circles/${circleId}/settings`}>
          <Settings className="size-5 text-muted-foreground" />
        </Link>
      </header>

      <main className="safe-area-bottom flex-1 overflow-y-auto">
        <NewsletterView
          circle={circleInfo}
          issueNumber={newsletter.issueNumber}
          publishedAt={newsletter.publishedAt}
          sections={sections}
        />
      </main>
    </div>
  )
}
