'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NewsletterView } from '@/components/newsletter/NewsletterView'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface Response {
  memberName: string
  text: string
  media?: MediaItem[]
}

interface Section {
  promptTitle: string
  responses: Response[]
}

interface ParsedContent {
  sections: Section[]
}

function parseNewsletterContent(htmlContent?: string | null): Section[] {
  if (!htmlContent) return []
  try {
    const parsed: ParsedContent = JSON.parse(htmlContent)
    return parsed.sections ?? []
  } catch {
    return []
  }
}

export default function NewsletterPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>
  const newsletterId = params.newsletterId as Id<'newsletters'>

  const newsletter = useQuery(api.newsletters.getNewsletterById, { newsletterId })
  const markRead = useMutation(api.newsletterReads.markNewsletterRead)
  const hasMarkedRead = useRef(false)

  // Mark as read on mount
  useEffect(() => {
    if (newsletter && !newsletter.isRead && !hasMarkedRead.current) {
      hasMarkedRead.current = true
      markRead({ circleId, newsletterId }).catch(() => {
        // Silently fail - not critical
      })
    }
  }, [newsletter, circleId, newsletterId, markRead])

  // Loading state
  if (newsletter === undefined) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link href={`/dashboard/circles/${circleId}`}>
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Newsletter</h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  // Not found state
  if (!newsletter) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link href={`/dashboard/circles/${circleId}`}>
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Newsletter</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
          <p className="text-lg font-medium text-foreground">Newsletter not found</p>
          <p className="text-sm text-muted-foreground">
            This newsletter may have been removed or you may not have access.
          </p>
          <Link
            href={`/dashboard/circles/${circleId}`}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Back to circle
          </Link>
        </div>
      </div>
    )
  }

  const sections = parseNewsletterContent(newsletter.htmlContent)
  const circle = newsletter.circle ?? {
    name: 'Unknown Circle',
    iconUrl: null,
    coverUrl: null,
    timezone: 'UTC',
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/dashboard/circles/${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">
          {newsletter.title ?? `Issue #${newsletter.issueNumber}`}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <NewsletterView
          circle={circle}
          issueNumber={newsletter.issueNumber}
          publishedAt={newsletter.publishedAt}
          sections={sections}
        />
      </main>
    </div>
  )
}
