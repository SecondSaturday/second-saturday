'use client'

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
        {memberCount < 3 && (
          <p className="text-xs text-amber-600">
            Invite {3 - memberCount} more to start newsletter
          </p>
        )}
      </div>

      <div className="shrink-0">
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={hasUnread ? 'drop-shadow-md' : 'drop-shadow-sm'}
        >
          <path
            d="M50 8 C56 8, 58 18, 62 22 C66 26, 76 24, 78 30 C80 36, 72 42, 72 48 C72 54, 80 60, 78 66 C76 72, 66 70, 62 74 C58 78, 56 88, 50 88 C44 88, 42 78, 38 74 C34 70, 24 72, 22 66 C20 60, 28 54, 28 48 C28 42, 20 36, 22 30 C24 24, 34 26, 38 22 C42 18, 44 8, 50 8Z"
            className={hasUnread ? 'fill-primary' : 'fill-muted-foreground/30'}
          />
          <path
            d="M50 8 C56 8, 58 18, 62 22 C66 26, 76 24, 78 30 C80 36, 72 42, 72 48 C72 54, 80 60, 78 66 C76 72, 66 70, 62 74 C58 78, 56 88, 50 88 C44 88, 42 78, 38 74 C34 70, 24 72, 22 66 C20 60, 28 54, 28 48 C28 42, 20 36, 22 30 C24 24, 34 26, 38 22 C42 18, 44 8, 50 8Z"
            fill="white"
            opacity={hasUnread ? 0.2 : 0.15}
            clipPath="inset(0 0 50% 0)"
          />
        </svg>
      </div>
    </button>
  )
}
