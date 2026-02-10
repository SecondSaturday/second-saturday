'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CircleList } from '@/components/dashboard/CircleList'
import { CreateCircleFAB } from '@/components/dashboard/CreateCircleFAB'
import { DatePicker } from '@/components/dashboard/DatePicker'
import { getNextSecondSaturday, formatShortDate } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'

export default function DashboardPage() {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => getNextSecondSaturday())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

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
    <div className="flex h-dvh bg-background">
      {/* Sidebar (full-screen on mobile, fixed-width on desktop) */}
      <div className="flex w-full flex-col md:w-[380px] md:border-r md:border-border">
        <DashboardHeader
          dateLabel={formatShortDate(selectedDate)}
          onDatePickerOpen={() => setDatePickerOpen(true)}
        />
        <CircleList onCircleSelect={setSelectedCircleId} />
        <CreateCircleFAB />
      </div>

      {/* Content area (desktop only) */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        {selectedCircleId ? (
          <p className="text-muted-foreground">Newsletter view coming soon</p>
        ) : (
          <p className="text-muted-foreground">No issues yet</p>
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
