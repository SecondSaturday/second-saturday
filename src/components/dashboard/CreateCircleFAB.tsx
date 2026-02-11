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
    <div className="flex justify-center px-4 pb-6 pt-2">
      <Link
        href="/dashboard/create"
        data-testid="create-circle-button"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-5 stroke-[3]" />
        {label}
      </Link>
    </div>
  )
}
