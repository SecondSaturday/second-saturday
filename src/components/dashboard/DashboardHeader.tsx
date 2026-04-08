'use client'

import { UserButton } from '@clerk/nextjs'
import { MoreVertical, PlusCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export function DashboardHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between bg-background pl-4 pr-2.5 py-3">
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-10',
          },
        }}
      />

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9" aria-label="Menu">
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
