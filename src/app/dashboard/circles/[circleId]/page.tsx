'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ArrowLeft, Settings, Users, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function CircleHomePage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })
  const prompts = useQuery(api.prompts.getCirclePrompts, { circleId })

  if (circle === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{circle.name}</h1>
        {isAdmin && (
          <Link href={`/dashboard/circles/${circleId}/settings`}>
            <Settings className="size-5 text-muted-foreground" />
          </Link>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        {/* Circle info */}
        <div className="flex gap-6 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="text-sm font-medium text-foreground">{circle.memberCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Issues sent</p>
            <p className="text-sm font-medium text-foreground">{circle.newsletterCount}</p>
          </div>
        </div>

        {/* Prompts */}
        {prompts && prompts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Current Prompts</h2>
            <div className="flex flex-col gap-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt._id}
                  className="rounded-lg border border-border bg-card p-3 text-sm text-foreground"
                >
                  {prompt.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/circles/${circleId}/members`}
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
          >
            <Users className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Members</p>
              <p className="text-xs text-muted-foreground">{circle.memberCount} members</p>
            </div>
          </Link>

          {isAdmin && (
            <>
              <Link
                href={`/dashboard/circles/${circleId}/submissions`}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <ClipboardList className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Submission Status</p>
                  <p className="text-xs text-muted-foreground">View who has submitted</p>
                </div>
              </Link>

              <Link
                href={`/dashboard/circles/${circleId}/settings`}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <Settings className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Circle Settings</p>
                  <p className="text-xs text-muted-foreground">
                    Edit circle details and invite link
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
