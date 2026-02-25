'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Copy, Check, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator'

export default function SetupCompletePage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })
  const memberCount = useQuery(api.memberships.getMembershipCount, { circleId })

  const [copied, setCopied] = useState(false)

  if (circle === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${circle.inviteCode}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const needsMoreMembers = memberCount !== undefined && memberCount < 3
  const membersNeeded = 3 - (memberCount ?? 1)

  return (
    <div className="safe-area-top flex min-h-dvh flex-col bg-background">
      <StepProgressIndicator steps={['Basic Info', 'Prompts', 'Members']} currentStep={4} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-8 pt-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{circle.name} is live!</h1>
          <p className="mt-2 text-muted-foreground">
            Your circle is ready — time to invite your friends.
          </p>
        </div>

        {needsMoreMembers && (
          <div className="flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Users className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Invite at least {membersNeeded} more friend{membersNeeded !== 1 ? 's' : ''} to start
              your newsletter. Circles need 3 members before the first issue is sent.
            </p>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <p className="flex-1 truncate text-sm text-muted-foreground">{inviteLink}</p>
            <Button variant="ghost" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <Button onClick={handleCopyLink} className="w-full">
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </Button>
        </div>
      </div>

      <div className="safe-area-bottom border-t border-border px-4 py-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full">
            Go to Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
