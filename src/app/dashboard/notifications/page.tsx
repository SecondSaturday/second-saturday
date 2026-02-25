'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NotificationPreferences } from '@/components/NotificationPreferences'

export default function NotificationsPage() {
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
      </header>

      <div className="safe-area-bottom flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-lg">
          <NotificationPreferences />
        </div>
      </div>
    </div>
  )
}
