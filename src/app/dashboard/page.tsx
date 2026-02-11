'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CircleList } from '@/components/dashboard/CircleList'
import { CreateCircleFAB } from '@/components/dashboard/CreateCircleFAB'
import { DatePicker } from '@/components/dashboard/DatePicker'
import { CircleHome } from '@/components/CircleHome'
import { CircleSettings } from '@/components/CircleSettings'
import { getNextSecondSaturday, formatShortDate } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'
import type { Id } from '../../../convex/_generated/dataModel'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(() =>
    searchParams.get('circle')
  )
  const [selectedDate, setSelectedDate] = useState(() => getNextSecondSaturday())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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
    <div className="flex h-dvh bg-background">
      {/* Sidebar (full-screen on mobile, fixed-width on desktop) */}
      <div className="flex w-full flex-col md:w-[380px] md:border-r md:border-border">
        <DashboardHeader
          dateLabel={formatShortDate(selectedDate)}
          onDatePickerOpen={() => setDatePickerOpen(true)}
        />
        <CircleList onCircleSelect={handleCircleSelect} />
        <CreateCircleFAB />
      </div>

      {/* Content area (desktop only) */}
      <div className="hidden flex-1 flex-col md:flex">
        {selectedCircleId ? (
          <CircleHome
            circleId={selectedCircleId as Id<'circles'>}
            onBack={() => {
              setSelectedCircleId(null)
              router.replace('/dashboard')
            }}
            onSettingsClick={() => setShowSettings(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Select a circle to view details</p>
          </div>
        )}
      </div>

      <DatePicker
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
      />

      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Circle Settings</SheetTitle>
          </SheetHeader>
          {selectedCircleId && (
            <div className="mt-6">
              <CircleSettings
                circleId={selectedCircleId as Id<'circles'>}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
