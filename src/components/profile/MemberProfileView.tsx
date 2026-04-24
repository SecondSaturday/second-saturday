'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { MemberResponse } from '@/components/newsletter/MemberResponse'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { trackEvent } from '@/lib/analytics'

interface MemberProfileViewProps {
  circleId: Id<'circles'>
  userId: Id<'users'>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function formatMonthYear(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function formatCycleMonthYear(cycleId: string): string {
  const [year, month] = cycleId.split('-')
  if (!year || !month) return cycleId
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export function MemberProfileView({ circleId, userId }: MemberProfileViewProps) {
  const profile = useQuery(api.memberProfiles.getMemberProfile, { circleId, userId })
  const circle = useQuery(api.circles.getCircle, { circleId })
  const currentUser = useQuery(api.users.getCurrentUser)
  const isDesktop = useIsDesktop()
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get('returnTo') ?? null

  // Key the once-guard on `${circleId}:${userId}` so navigating between
  // different profiles in the same mounted page still fires a fresh event.
  const trackedKey = useRef<string | null>(null)
  useEffect(() => {
    if (profile === undefined || currentUser === undefined) return
    const key = `${circleId}:${userId}`
    if (trackedKey.current === key) return
    trackedKey.current = key
    trackEvent('member_profile_viewed', {
      circleId,
      targetUserId: userId,
      isSelf: currentUser?._id === userId,
    })
  }, [circleId, userId, profile, currentUser])

  const backHref =
    returnTo ?? (isDesktop ? `/dashboard?circle=${circleId}` : `/dashboard/circles/${circleId}`)
  const backLabel = returnTo ? 'Members' : (circle?.name ?? 'Back')

  const headerBar = (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Link href={backHref} aria-label="Back" className="flex items-center gap-2">
        <ArrowLeft className="size-5 text-foreground" />
        <span className="text-sm font-medium text-foreground">{backLabel}</span>
      </Link>
    </header>
  )

  if (profile === undefined) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        {headerBar}
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        {headerBar}
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-muted-foreground">This member&apos;s profile isn&apos;t available.</p>
        </div>
      </div>
    )
  }

  const roleLabel =
    profile.membership.role === 'admin'
      ? profile.membership.isOwner
        ? 'Admin · Owner'
        : 'Admin'
      : 'Member'

  const statsLine = (() => {
    if (profile.stats.submissionCount === 0) return null
    const parts: string[] = [
      `${profile.stats.submissionCount} ${profile.stats.submissionCount === 1 ? 'update' : 'updates'}`,
    ]
    if (profile.stats.firstSubmittedAt) {
      parts.push(`First: ${formatMonthYear(profile.stats.firstSubmittedAt)}`)
    }
    if (profile.stats.lastSubmittedAt) {
      parts.push(`Latest: ${formatMonthYear(profile.stats.lastSubmittedAt)}`)
    }
    return parts.join(' · ')
  })()

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      {headerBar}
      <main className="safe-area-bottom flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 pb-6 text-center">
            <Avatar className="size-24">
              <AvatarImage src={profile.user.imageUrl ?? undefined} alt={profile.user.name} />
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {getInitials(profile.user.name)}
              </AvatarFallback>
            </Avatar>
            <h1 className="font-serif text-3xl font-normal text-foreground">{profile.user.name}</h1>
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              <span>{roleLabel}</span>
              <span>Joined {formatMonthYear(profile.membership.joinedAt)}</span>
              {profile.membership.leftAt && (
                <span>Left {formatMonthYear(profile.membership.leftAt)}</span>
              )}
            </div>
            {statsLine && <p className="text-xs text-muted-foreground">{statsLine}</p>}
          </div>

          {/* Entries */}
          {profile.entries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {profile.user.name} hasn&apos;t shared an update in this circle yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.entries.map((entry) => {
                const isPublished = entry.issueNumber !== undefined
                const monthLabel = formatCycleMonthYear(entry.cycleId)
                const headerText = isPublished
                  ? `Issue #${entry.issueNumber} · ${monthLabel}`
                  : `Draft · ${monthLabel}`
                return (
                  <section key={entry.cycleId} className="space-y-3">
                    <h2 className="font-serif text-xl font-normal text-foreground">{headerText}</h2>
                    <div className="rounded-2xl bg-card">
                      {entry.responses.map((r, idx) => (
                        <MemberResponse
                          key={r.responseId}
                          responseId={r.responseId}
                          memberName={profile.user.name}
                          memberAvatarUrl={profile.user.imageUrl}
                          text={r.text}
                          media={r.media}
                          promptText={r.promptText}
                          showDivider={idx > 0}
                          showReactions={false}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
