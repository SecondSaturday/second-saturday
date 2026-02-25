'use client'

import { UserButton } from '@clerk/nextjs'
import { MoreVertical, ChevronDown, PlusCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface DashboardHeaderProps {
  onDatePickerOpen?: () => void
  dateLabel?: string
}

export function DashboardHeader({ onDatePickerOpen, dateLabel }: DashboardHeaderProps) {
  const displayDate =
    dateLabel ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <header className="flex shrink-0 items-center justify-between bg-background px-4 py-3">
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-10',
          },
        }}
      />

      <button
        onClick={onDatePickerOpen}
        className="flex items-center gap-1 rounded-lg bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground"
      >
        {displayDate}
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9">
            <MoreVertical className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications" className="flex items-center gap-2">
              <Bell className="size-4" />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/create" className="flex items-center gap-2">
              <PlusCircle className="size-4" />
              Create a circle
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
