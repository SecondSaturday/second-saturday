'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { ArrowLeft, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RemoveMemberModal } from '@/components/RemoveMemberModal'

export default function MembersPage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })
  const members = useQuery(api.memberships.getCircleMembers, { circleId })
  const currentUser = useQuery(api.users.getCurrentUser)

  // All hooks must be called before any early returns
  const [removeTarget, setRemoveTarget] = useState<{ userId: Id<'users'>; name: string } | null>(
    null
  )

  if (circle === undefined || members === undefined || currentUser === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle || !currentUser) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background">
        <p className="text-muted-foreground">Circle not found</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const isAdmin = circle.role === 'admin'

  // Sort members: admin first, then alphabetical by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    return a.name.localeCompare(b.name)
  })

  const handleRemoveClick = (userId: Id<'users'>, name: string) => {
    setRemoveTarget({ userId, name })
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href={`/dashboard?circle=${circleId}`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 text-lg font-semibold text-foreground">Members</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>{members.length}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        {sortedMembers.map((member) => {
          const isSelf = member.userId === currentUser._id
          const canRemove = isAdmin && !isSelf

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Avatar>
                <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                {member.role === 'admin' && (
                  <Badge variant="secondary" className="mt-1 gap-1">
                    <Shield className="size-3" />
                    Admin
                  </Badge>
                )}
              </div>

              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveClick(member.userId, member.name)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {removeTarget && (
        <RemoveMemberModal
          circleId={circleId}
          targetUserId={removeTarget.userId}
          targetName={removeTarget.name}
          open={!!removeTarget}
          onOpenChange={(open) => {
            if (!open) setRemoveTarget(null)
          }}
        />
      )}
    </div>
  )
}
