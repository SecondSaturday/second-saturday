'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CircleList } from '@/components/dashboard/CircleList'
import { SubmitFAB } from '@/components/dashboard/SubmitFAB'
import { trackEvent } from '@/lib/analytics'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Id } from '../../../convex/_generated/dataModel'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { NewsletterView } from '@/components/newsletter/NewsletterView'
import { parseNewsletterContent } from '@/lib/newsletter'
import { CircleSettings } from '@/components/CircleSettings'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const SIDEBAR_MIN = 16
const SIDEBAR_MAX = 50
const SIDEBAR_DEFAULT = 25
const STORAGE_KEY = 'dashboard-sidebar-width'

function clampWidth(v: number) {
  return Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, v))
}

function readSavedWidth(): number {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const val = parseFloat(saved)
    if (!isNaN(val)) return clampWidth(val)
  }
  return SIDEBAR_DEFAULT
}

function useSidebarWidth() {
  // Live dragging width — only used during drag, otherwise null
  const [dragWidth, setDragWidth] = useState<number | null>(null)

  // Persisted width from localStorage
  const savedWidth = useSyncExternalStore(
    (callback) => {
      window.addEventListener('storage', callback)
      return () => window.removeEventListener('storage', callback)
    },
    readSavedWidth,
    () => SIDEBAR_DEFAULT
  )

  const width = dragWidth ?? savedWidth

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      setDragWidth(clampWidth((ev.clientX / window.innerWidth) * 100))
    }

    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setDragWidth((w) => {
        if (w !== null) localStorage.setItem(STORAGE_KEY, String(w))
        return null
      })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  return { width, startDrag }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(() =>
    searchParams.get('circle')
  )
  const { width: sidebarWidth, startDrag } = useSidebarWidth()

  const handleCircleSelect = useCallback(
    (id: string) => {
      setSelectedCircleId(id)
      if (window.innerWidth < 768) {
        router.push(`/dashboard/circles/${id}`)
      } else {
        router.push(`/dashboard?circle=${id}`, { scroll: false })
      }
    },
    [router]
  )

  useEffect(() => {
    trackEvent('dashboard_viewed')
  }, [])

  return (
    <div className="safe-area-top relative flex h-dvh bg-background">
      {/* Sidebar: full-width on mobile, resizable on desktop */}
      <div
        className="flex min-h-0 shrink-0 flex-col md:border-r md:border-border"
        style={{ width: isDesktop ? `${sidebarWidth}vw` : '100%' }}
      >
        <DashboardHeader />
        <h1 className="px-4 pb-2 pt-1 font-serif text-4xl text-foreground">Circles</h1>
        <CircleList onCircleSelect={handleCircleSelect} />
        <SubmitFAB sidebarWidthVw={isDesktop ? sidebarWidth : undefined} />
      </div>

      {/* Resize handle (desktop only) */}
      {isDesktop && (
        <div
          className="absolute top-0 bottom-0 z-20 w-2 -ml-1 cursor-col-resize transition-colors hover:bg-primary/20 active:bg-primary/30"
          style={{ left: `${sidebarWidth}vw` }}
          onMouseDown={startDrag}
        />
      )}

      {/* Content area (desktop only) */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        {selectedCircleId ? (
          <DesktopCircleNewsletter circleId={selectedCircleId as Id<'circles'>} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Select a circle</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DesktopCircleNewsletter({ circleId }: { circleId: Id<'circles'> }) {
  const { isAuthenticated } = useConvexAuth()
  const circle = useQuery(api.circles.getCircle, isAuthenticated ? { circleId } : 'skip')
  const newsletters = useQuery(
    api.newsletters.getNewslettersByCircle,
    isAuthenticated ? { circleId } : 'skip'
  )
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Derive the active newsletter: use explicit selection if valid, otherwise latest
  const defaultId = newsletters && newsletters.length > 0 ? newsletters[0]!._id : null
  const activeId =
    selectedNewsletterId && newsletters?.some((n) => n._id === selectedNewsletterId)
      ? selectedNewsletterId
      : defaultId
  const currentNewsletter = newsletters?.find((n) => n._id === activeId)

  const fullNewsletter = useQuery(
    api.newsletters.getNewsletterById,
    currentNewsletter ? { newsletterId: currentNewsletter._id } : 'skip'
  )

  if (circle === undefined || newsletters === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  if (newsletters.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <NewsletterView
            circle={{
              name: circle.name,
              iconUrl: circle.iconUrl ?? null,
              coverUrl: circle.coverUrl ?? null,
              timezone: 'UTC',
            }}
            circleId={circleId}
            issueNumber={0}
            sections={[]}
            onSettingsOpen={() => setSettingsOpen(true)}
          />
        </main>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="flex h-[85vh] w-[90vw] max-w-3xl flex-col overflow-hidden p-0">
            <DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
              <DialogTitle className="font-sans text-2xl">Settings</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <CircleSettings circleId={circleId} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (currentNewsletter && fullNewsletter === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const availableNewsletters = newsletters
    .filter((n) => n.publishedAt)
    .map((n) => ({
      id: n._id,
      issueNumber: n.issueNumber,
      publishedAt: n.publishedAt!,
    }))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {fullNewsletter ? (
        <main className="flex-1 overflow-y-auto">
          <NewsletterView
            circle={{
              name: circle.name,
              iconUrl: circle.iconUrl ?? null,
              coverUrl: circle.coverUrl ?? null,
              timezone: 'UTC',
            }}
            circleId={circleId}
            issueNumber={fullNewsletter.issueNumber}
            publishedAt={fullNewsletter.publishedAt}
            sections={parseNewsletterContent(fullNewsletter.htmlContent)}
            availableNewsletters={availableNewsletters}
            onNewsletterSelect={setSelectedNewsletterId}
            onSettingsOpen={() => setSettingsOpen(true)}
          />
        </main>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-lg font-medium text-foreground">No newsletter selected</p>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="flex h-[85vh] w-[90vw] max-w-3xl flex-col overflow-hidden p-0">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
            <DialogTitle className="font-sans text-2xl">Settings</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <CircleSettings circleId={circleId} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
