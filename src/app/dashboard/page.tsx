'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CircleList } from '@/components/dashboard/CircleList'
import { SubmitFAB } from '@/components/dashboard/SubmitFAB'
import { DatePicker } from '@/components/dashboard/DatePicker'
import { getLastSecondSaturday, formatShortDate } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'
import type { Id } from '../../../convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(() =>
    searchParams.get('circle')
  )
  const [selectedDate, setSelectedDate] = useState(() => getLastSecondSaturday())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const handleCircleSelect = useCallback(
    (id: string) => {
      setSelectedCircleId(id)
      // On mobile (sidebar is full-width), navigate to the dedicated page
      if (window.innerWidth < 768) {
        router.push(`/dashboard/circles/${id}`)
      } else {
        // On desktop, update URL with query param for split view
        router.push(`/dashboard?circle=${id}`, { scroll: false })
      }
    },
    [router]
  )

  useEffect(() => {
    trackEvent('dashboard_viewed')
  }, [])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    trackEvent('date_filter_changed', {
      date: date.toISOString(),
      month: date.getMonth(),
      year: date.getFullYear(),
    })
  }

  return (
    <div className="safe-area-top flex h-dvh bg-background">
      {/* Sidebar (full-screen on mobile, fixed-width on desktop) */}
      <div className="flex min-h-0 w-full flex-col md:w-[380px] md:border-r md:border-border">
        <DashboardHeader
          dateLabel={formatShortDate(selectedDate)}
          onDatePickerOpen={() => setDatePickerOpen(true)}
        />
        <CircleList onCircleSelect={handleCircleSelect} />
        <SubmitFAB />
      </div>

      {/* Content area (desktop only) */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        {selectedCircleId ? (
          <DesktopCircleNewsletter
            circleId={selectedCircleId as Id<'circles'>}
            selectedDate={selectedDate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Select a circle</p>
          </div>
        )}
      </div>

      <DatePicker
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
      />
    </div>
  )
}

function DesktopCircleNewsletter({
  circleId,
  selectedDate,
}: {
  circleId: Id<'circles'>
  selectedDate: Date
}) {
  const circle = useQuery(api.circles.getCircle, { circleId })
  const newsletters = useQuery(api.newsletters.getNewslettersByCircle, { circleId })

  // Find newsletter matching selected month
  const newsletter = newsletters?.find((n) => {
    const pubDate = new Date(n.publishedAt ?? n.createdAt)
    return (
      pubDate.getMonth() === selectedDate.getMonth() &&
      pubDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Need full newsletter data with htmlContent
  const fullNewsletter = useQuery(
    api.newsletters.getNewsletterById,
    newsletter ? { newsletterId: newsletter._id } : 'skip'
  )

  if (circle === undefined || newsletters === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  // Loading full newsletter content
  if (newsletter && fullNewsletter === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {fullNewsletter ? (
        <main className="flex-1 overflow-y-auto">
          <NewsletterView
            circle={{
              name: circle.name,
              iconUrl: circle.iconUrl ?? null,
              coverUrl: circle.coverUrl ?? null,
              timezone: 'UTC',
            }}
            circleId={circleId}
            issueNumber={fullNewsletter.issueNumber}
            publishedAt={fullNewsletter.publishedAt}
            sections={parseNewsletterContent(fullNewsletter.htmlContent)}
          />
        </main>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-lg font-medium text-foreground">No newsletter for this month</p>
          <p className="text-sm text-muted-foreground">
            Try selecting a different month from the date picker.
          </p>
        </div>
      )}
    </div>
  )
}
