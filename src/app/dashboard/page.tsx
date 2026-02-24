'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CircleList } from '@/components/dashboard/CircleList'
import { CreateCircleFAB } from '@/components/dashboard/CreateCircleFAB'
import { DatePicker } from '@/components/dashboard/DatePicker'
import { getNextSecondSaturday, formatShortDate } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'
import type { Id } from '../../../convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'
import { Settings } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(() =>
    searchParams.get('circle')
  )
  const [selectedDate, setSelectedDate] = useState(() => getNextSecondSaturday())
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
        <CreateCircleFAB />
      </div>

      {/* Content area (desktop only) */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        {selectedCircleId ? (
          <DesktopCircleNewsletter circleId={selectedCircleId as Id<'circles'>} />
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

function DesktopCircleNewsletter({ circleId }: { circleId: Id<'circles'> }) {
  const circle = useQuery(api.circles.getCircle, { circleId })
  const newsletter = useQuery(api.newsletters.getLatestNewsletter, { circleId })

  if (circle === undefined || newsletter === undefined) {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{circle.name}</h1>
        <Link href={`/dashboard/circles/${circleId}/settings`}>
          <Settings className="size-5 text-muted-foreground" />
        </Link>
      </header>

      {newsletter ? (
        <main className="flex-1 overflow-y-auto">
          <NewsletterView
            circle={{ name: circle.name, iconUrl: null, coverUrl: null, timezone: 'UTC' }}
            issueNumber={newsletter.issueNumber}
            publishedAt={newsletter.publishedAt}
            sections={parseNewsletterContent(newsletter.htmlContent)}
          />
        </main>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-lg font-medium text-foreground">No newsletters yet</p>
          <p className="text-sm text-muted-foreground">
            Submissions are open — newsletters will appear here after the deadline.
          </p>
        </div>
      )}
    </div>
  )
}
