'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'
import { trackEvent } from '@/lib/analytics'

export default function CircleLandingPage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>

  const { isAuthenticated } = useConvexAuth()
  const circle = useQuery(api.circles.getCircle, isAuthenticated ? { circleId } : 'skip')
  const newsletters = useQuery(
    api.newsletters.getNewslettersByCircle,
    isAuthenticated && circle ? { circleId } : 'skip'
  )
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null)

  // Auto-select latest newsletter
  const defaultId = newsletters && newsletters.length > 0 ? newsletters[0]!._id : null
  const activeId =
    selectedNewsletterId && newsletters?.some((n) => n._id === selectedNewsletterId)
      ? selectedNewsletterId
      : defaultId

  const newsletter = useQuery(
    api.newsletters.getNewsletterById,
    activeId ? { newsletterId: activeId as Id<'newsletters'> } : 'skip'
  )

  const markRead = useMutation(api.newsletterReads.markNewsletterRead)
  const hasMarkedRead = useRef<string | null>(null)

  // Auto-hide header on scroll
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollTop = useRef(0)
  const mainRef = useRef<HTMLElement>(null)

  const handleScroll = useCallback(() => {
    const el = mainRef.current
    if (!el) return
    const st = el.scrollTop
    setHeaderVisible(st <= 10 || st < lastScrollTop.current)
    lastScrollTop.current = st
  }, [])

  // Mark newsletter as read
  useEffect(() => {
    if (newsletter && !newsletter.isRead && hasMarkedRead.current !== newsletter._id) {
      hasMarkedRead.current = newsletter._id
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
    (circle && newsletters === undefined) ||
    (activeId && newsletter === undefined)
  ) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <button onClick={() => router.replace('/dashboard')} aria-label="Back">
            <ArrowLeft className="size-5 text-foreground" />
          </button>
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
          <button onClick={() => router.replace('/dashboard')} aria-label="Back">
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Circle not found</h1>
        </header>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-muted-foreground">This circle may have been removed.</p>
        </div>
      </div>
    )
  }

  // No newsletters — still show full circle page with cover/avatar/settings
  if (!newsletters || newsletters.length === 0 || !newsletter) {
    const emptyCircleInfo = {
      name: circle.name,
      iconUrl: circle.iconUrl ?? null,
      coverUrl: circle.coverUrl ?? null,
      timezone: 'UTC',
    }

    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <main className="safe-area-bottom relative flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 bg-background px-4 py-3">
            <button
              onClick={() => router.replace('/dashboard')}
              className="flex size-9 items-center justify-center rounded-full"
              aria-label="Back"
            >
              <ArrowLeft className="size-5 text-foreground" />
            </button>
          </header>
          <NewsletterView
            circle={emptyCircleInfo}
            circleId={circleId}
            issueNumber={0}
            sections={[]}
          />
        </main>
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

  const availableNewsletters = (newsletters ?? [])
    .filter((n) => n.publishedAt)
    .map((n) => ({
      id: n._id,
      issueNumber: n.issueNumber,
      publishedAt: n.publishedAt!,
    }))

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="safe-area-bottom relative flex-1 overflow-y-auto"
      >
        {/* Sticky auto-hide header */}
        <header
          className="sticky top-0 z-10 bg-background px-4 py-3 transition-transform duration-300"
          style={{ transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)' }}
        >
          <button
            onClick={() => router.replace('/dashboard')}
            className="flex size-9 items-center justify-center rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>
        </header>
        <NewsletterView
          circle={circleInfo}
          circleId={circleId}
          issueNumber={newsletter.issueNumber}
          publishedAt={newsletter.publishedAt}
          sections={sections}
          availableNewsletters={availableNewsletters}
          onNewsletterSelect={setSelectedNewsletterId}
        />
      </main>
    </div>
  )
}
