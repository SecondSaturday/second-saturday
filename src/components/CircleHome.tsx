'use client'

import { useQuery } from 'convex/react'
import { useEffect } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Settings, Users, ClipboardList, ArrowLeft, PenLine, Newspaper } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import Link from 'next/link'
import { NewsletterArchive } from './newsletter/NewsletterArchive'

export function CircleHome({
  circleId,
  onBack,
  onSettingsClick,
}: {
  circleId: Id<'circles'>
  onBack?: () => void
  onSettingsClick?: () => void
}) {
  const circle = useQuery(api.circles.getCircle, { circleId })
  const prompts = useQuery(api.prompts.getCirclePrompts, { circleId })

  // If circle not found (e.g., user left the circle), call onBack to clear selection
  useEffect(() => {
    if (circle === null && onBack) {
      onBack()
    }
  }, [circle, onBack])

  // Track newsletter_read when the user actually views the circle
  useEffect(() => {
    if (circle) {
      trackEvent('newsletter_read', { circleId })
    }
  }, [circle, circleId])

  if (circle === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  const isAdmin = circle.role === 'admin'

  return (
    <div className="flex flex-1 flex-col">
      {onBack && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={onBack}>
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{circle.name}</h1>
          {onSettingsClick && (
            <button onClick={onSettingsClick}>
              <Settings className="size-5 text-muted-foreground" />
            </button>
          )}
        </header>
      )}
      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        {/* Circle info */}
        <div className="flex gap-6 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="text-sm font-medium text-foreground">{circle.memberCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Issues sent</p>
            <p className="text-sm font-medium text-foreground">{circle.newsletterCount}</p>
          </div>
        </div>

        {/* Prompts */}
        {prompts && prompts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Current Prompts</h2>
            <div className="flex flex-col gap-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt._id}
                  className="rounded-lg border border-border bg-card p-3 text-sm text-foreground"
                >
                  {prompt.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex flex-col gap-2">
          {circle.memberCount < 3 ? (
            <div className="flex items-center gap-3 rounded-lg border border-border p-4 opacity-50 pointer-events-none">
              <PenLine className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Make Submission</p>
                <p className="text-xs text-muted-foreground">Need 3+ members to submit</p>
              </div>
            </div>
          ) : (
            <Link
              href={`/dashboard/circles/${circleId}/submit`}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
            >
              <PenLine className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Make Submission</p>
                <p className="text-xs text-muted-foreground">Write your responses for this cycle</p>
              </div>
            </Link>
          )}

          <Link
            href={`/dashboard/circles/${circleId}/members`}
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
          >
            <Users className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Members</p>
              <p className="text-xs text-muted-foreground">{circle.memberCount} members</p>
            </div>
          </Link>

          {isAdmin && (
            <>
              <Link
                href={`/dashboard/circles/${circleId}/submissions`}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <ClipboardList className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Submission Status</p>
                  <p className="text-xs text-muted-foreground">View who has submitted</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Newsletter Archive */}
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Newspaper className="size-4" />
            Newsletters
          </h2>
          <NewsletterArchive circleId={circleId} />
        </div>
      </div>
    </div>
  )
}
