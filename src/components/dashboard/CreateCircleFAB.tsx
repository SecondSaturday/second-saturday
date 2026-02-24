'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getNextSecondSaturday, formatShortDate } from '@/lib/dates'

interface CreateCircleFABProps {
  nextDeadlineLabel?: string
}

export function CreateCircleFAB({ nextDeadlineLabel }: CreateCircleFABProps) {
  const label = nextDeadlineLabel ?? formatShortDate(getNextSecondSaturday())

  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center md:left-0 md:right-auto md:w-[380px]">
      <Link
        href="/dashboard/create"
        data-testid="create-circle-button"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-5 stroke-[3]" />
        {label}
      </Link>
    </div>
  )
}
