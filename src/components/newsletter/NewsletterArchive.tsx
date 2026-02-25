'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Newspaper } from 'lucide-react'
import Link from 'next/link'

export function NewsletterArchive({ circleId }: { circleId: Id<'circles'> }) {
  const newsletters = useQuery(api.newsletters.getNewslettersByCircle, { circleId })

  if (newsletters === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (newsletters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Newspaper className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No newsletters yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {newsletters.map((newsletter, index) => {
        const isLatest = index === 0
        const date = new Date(newsletter.publishedAt ?? newsletter.createdAt)

        return (
          <Link
            key={newsletter._id}
            href={`/dashboard/circles/${circleId}/newsletter/${newsletter._id}`}
            className={`relative flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30 ${
              isLatest ? 'bg-card' : ''
            }`}
          >
            {!newsletter.isRead && (
              <span className="absolute right-3 top-3 size-2.5 rounded-full bg-primary" />
            )}
            <Newspaper className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {isLatest ? 'Latest: ' : ''}Issue #{newsletter.issueNumber}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                {' \u00B7 '}
                {newsletter.submissionCount} submission{newsletter.submissionCount !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
