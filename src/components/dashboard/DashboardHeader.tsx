'use client'

import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Bell, MoreVertical, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  onDatePickerOpen?: () => void
  onMenuOpen?: () => void
  dateLabel?: string
}

export function DashboardHeader({ onDatePickerOpen, onMenuOpen, dateLabel }: DashboardHeaderProps) {
  const { user } = useUser()

  const displayDate =
    dateLabel ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <Avatar size="lg">
        <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? 'User'} />
        <AvatarFallback>{user?.firstName?.charAt(0) ?? 'U'}</AvatarFallback>
      </Avatar>

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
