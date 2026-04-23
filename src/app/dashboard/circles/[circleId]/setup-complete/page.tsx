'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Copy, Check, PartyPopper, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { CreationLayout } from '@/components/circles/CreationLayout'
import { toast } from 'sonner'
import { InviteQRCode } from '@/components/InviteQRCode'

export default function SetupCompletePage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

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
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <CreationLayout
      step={4}
      backHref={`/dashboard/circles/${circleId}/prompts?setup=true`}
      footer={
        <Link href="/dashboard">
          <Button variant="outline" className="w-full">
            Go to Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <PartyPopper className="size-12 text-primary" />

        <h1 className="mt-6 font-serif text-[28px] text-foreground md:text-[32px]">
          {circle.name} is live!
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Your circle is ready — share the link to invite friends.
        </p>

        <div className="mt-8 flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="flex-1 truncate text-sm text-muted-foreground">{inviteLink}</p>
          <button
            onClick={handleCopyLink}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowQR((v) => !v)}
          className="mt-3 text-sm text-muted-foreground hover:underline"
        >
          {showQR ? 'Hide QR code' : 'Show QR code'}
        </button>

        {showQR && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <InviteQRCode value={inviteLink} size={192} />
            <p className="font-mono text-xs text-muted-foreground break-all text-center">
              {inviteLink}
            </p>
          </div>
        )}
      </div>
    </CreationLayout>
  )
}
