'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useConvexAuth } from 'convex/react'
import { ArrowLeft, BookHeart, ChevronDown } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { MemberResponse } from '@/components/newsletter/MemberResponse'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { trackEvent } from '@/lib/analytics'

interface YourMonthViewProps {
  cycleId: string
}

function formatMonthYear(cycleId: string): string {
  const parts = cycleId.split('-').map(Number)
  const year = parts[0]
  const month = parts[1]
  if (!year || !month) return cycleId
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

type CircleEntry = NonNullable<ReturnType<typeof useGetYourMonth>>['circles'][number]

function useGetYourMonth(cycleId: string) {
  const { isAuthenticated } = useConvexAuth()
  return useQuery(api.yourMonth.getYourMonth, isAuthenticated ? { cycleId } : 'skip')
}

function deriveStatusChip(
  entry: CircleEntry,
  deadline: number,
  now: number
): { label: string; tone: 'published' | 'draft' | 'skipped' | 'submitted' | 'idle' | 'missed' } {
  const ns = entry.newsletter?.status
  if (ns === 'published') return { label: 'Published', tone: 'published' }
  if (ns === 'skipped') return { label: 'Skipped', tone: 'skipped' }
  const sub = entry.submission
  if (sub) {
    if (sub.submittedAt) return { label: 'Submitted', tone: 'submitted' }
    if (now < deadline) return { label: 'Draft', tone: 'draft' }
    // Past-deadline draft: newsletter compile DOES include locked-with-content
    // submissions, so when the user has any non-empty response, the chip should
    // reflect that the content shipped — not the lower-level lock state.
    if (entry.responses.length > 0) return { label: 'Submitted', tone: 'submitted' }
    return { label: 'Missed', tone: 'missed' }
  }
  if (now < deadline) return { label: 'Not started', tone: 'idle' }
  return { label: 'Missed', tone: 'missed' }
}

const TONE_CLASSES: Record<string, string> = {
  published: 'bg-primary/10 text-primary',
  draft: 'bg-amber-100 text-amber-800',
  skipped: 'bg-muted text-muted-foreground',
  submitted: 'bg-emerald-100 text-emerald-800',
  idle: 'bg-muted text-muted-foreground',
  missed: 'bg-rose-100 text-rose-800',
}

export function YourMonthView({ cycleId }: YourMonthViewProps) {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const data = useGetYourMonth(cycleId)
  const months = useQuery(api.yourMonth.listYourMonthsAvailable, isAuthenticated ? {} : 'skip')
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip')

  const monthLabel = useMemo(() => `Your ${formatMonthYear(cycleId)}`, [cycleId])
  // Snapshot "now" but refresh it when the tab regains focus so a user who
  // keeps the page open across the cycle deadline doesn't see stale chips.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    window.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // AC #9: emit once per cycle on mount. Reactive refetches from Convex
  // would otherwise refire this on every websocket tick.
  const trackedCycleRef = useRef<string | null>(null)
  useEffect(() => {
    if (data && trackedCycleRef.current !== cycleId) {
      trackedCycleRef.current = cycleId
      trackEvent('your_month_viewed', {
        cycleId,
        circlesCount: data.circles.length,
      })
    }
  }, [data, cycleId])

  // If the user has no active memberships at all, route them back to the
  // index so they see the "Join or create a circle" empty state — not a
  // blank cycle view.
  useEffect(() => {
    if (months && !months.hasActiveMembership) {
      router.replace('/dashboard/my-month')
    }
  }, [months, router])

  if (data === undefined) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  const hasUnfinishedDraft =
    data.deadline > now && data.circles.some((c) => !c.submission || !c.submission.submittedAt)

  const userName = currentUser?.name ?? currentUser?.email ?? 'You'
  const userImage = currentUser?.imageUrl ?? null

  return (
    <div className="safe-area-top safe-area-bottom flex h-dvh flex-col bg-background">
      <main className="relative flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-4 py-3">
          <button
            onClick={() => router.replace('/dashboard')}
            className="flex size-9 items-center justify-center rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="flex-1 font-serif text-xl font-normal text-foreground">{monthLabel}</h1>

          {months && months.months.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground"
                aria-label="Pick a month"
              >
                Months
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {months.months.map((m) => (
                  <DropdownMenuItem
                    key={m.cycleId}
                    onSelect={() => router.push(`/dashboard/my-month/${m.cycleId}`)}
                    className={m.cycleId === cycleId ? 'font-semibold' : undefined}
                  >
                    {formatMonthYear(m.cycleId)}
                    {m.hasPublishedNewsletter && (
                      <span className="ml-2 text-xs text-muted-foreground">published</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {data.circles.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookHeart className="size-8 text-primary" />
            </div>
            <p className="text-base text-muted-foreground">Nothing to show for this month yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4">
            {data.circles.map((c) => {
              const chip = deriveStatusChip(c, data.deadline, now)
              const newsletterHref =
                c.newsletter?.status === 'published'
                  ? `/dashboard/circles/${c.circleId}/newsletter/${c.newsletter.newsletterId}`
                  : null
              const titleNode = (
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={c.circleIconUrl ?? undefined} alt={c.circleName} />
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {c.circleName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-serif text-lg text-foreground">{c.circleName}</div>
                </div>
              )

              return (
                <section
                  key={c.circleId}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    {newsletterHref ? (
                      <Link
                        href={newsletterHref}
                        className="flex-1 transition-opacity hover:opacity-80"
                      >
                        {titleNode}
                      </Link>
                    ) : (
                      <div className="flex-1">{titleNode}</div>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        TONE_CLASSES[chip.tone] ?? TONE_CLASSES.idle
                      }`}
                    >
                      {chip.label}
                    </span>
                  </div>

                  {c.responses.length > 0 ? (
                    <div className="flex flex-col">
                      {c.responses.map((r, idx) => (
                        <MemberResponse
                          key={r.responseId}
                          responseId={r.responseId}
                          memberName={userName}
                          memberAvatarUrl={userImage}
                          text={r.text}
                          media={r.media}
                          promptText={r.promptText}
                          showReactions={false}
                          showDivider={idx > 0}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="px-6 pb-5 text-sm italic text-muted-foreground">
                      Nothing this month.
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {hasUnfinishedDraft && (
          <div className="px-4 pb-6">
            <Link
              href="/dashboard/submit"
              className="block rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Finish your {formatMonthYear(cycleId)} update →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
