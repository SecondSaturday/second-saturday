'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16">
      <p className="text-center text-muted-foreground">
        No circles yet. Create one to get started!
      </p>
      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
      >
        <Plus className="size-5" />
        Create a circle
      </Link>
    </div>
  )
}
