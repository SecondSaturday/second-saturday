'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Bell, MoreVertical, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardHeaderProps {
  onDatePickerOpen?: () => void
  onMenuOpen?: () => void
  dateLabel?: string
}

export function DashboardHeader({ onDatePickerOpen, onMenuOpen, dateLabel }: DashboardHeaderProps) {
  const { user } = useUser()
  const convexUser = useQuery(api.users.getCurrentUser)

  const avatarUrl = convexUser?.imageUrl ?? user?.imageUrl
  const displayName = convexUser?.name ?? user?.fullName ?? 'User'

  const displayDate =
    dateLabel ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <Link href="/dashboard/settings">
        <Avatar size="lg" className="cursor-pointer transition-opacity hover:opacity-80">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{(convexUser?.name ?? user?.firstName)?.[0] ?? 'U'}</AvatarFallback>
        </Avatar>
      </Link>

      <button
        onClick={onDatePickerOpen}
        className="flex items-center gap-1 rounded-lg bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground"
      >
        {displayDate}
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-9">
          <Bell className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-9" onClick={onMenuOpen}>
          <MoreVertical className="size-5" />
        </Button>
      </div>
    </header>
  )
}
