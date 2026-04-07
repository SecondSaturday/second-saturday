'use client'

import Image from 'next/image'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface CircleListItemProps {
  name: string
  iconUrl: string | null
  memberNames: string[]
  memberCount: number
  hasUnread: boolean
  onClick?: () => void
}

export function CircleListItem({
  name,
  iconUrl,
  memberNames,
  memberCount,
  hasUnread,
  onClick,
}: CircleListItemProps) {
  const membersText = memberNames.join(', ')

  return (
    <button
      onClick={onClick}
      data-testid="circle-card"
      className="flex w-full items-center gap-4 border-b border-border/50 px-4 py-4 text-left transition-colors hover:bg-muted/30"
    >
      <Avatar className="size-14 ring-2 ring-background">
        <AvatarImage src={iconUrl ?? undefined} alt={name} />
        <AvatarFallback className="text-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
        <p className="truncate text-sm text-muted-foreground">{membersText}</p>
        {/* TODO: restore to < 3 after testing */}
        {memberCount < 1 && (
          <p className="text-xs text-amber-600">
            Invite {3 - memberCount} more to start newsletter
          </p>
        )}
      </div>

      <div className="relative shrink-0 flex items-center justify-center size-6">
        <Image
          src={hasUnread ? '/indicators/unread.svg' : '/indicators/read.svg'}
          alt={hasUnread ? 'Unread' : 'Read'}
          width={hasUnread ? 24 : 20}
          height={hasUnread ? 24 : 20}
          className="object-contain"
        />
      </div>
    </button>
  )
}
