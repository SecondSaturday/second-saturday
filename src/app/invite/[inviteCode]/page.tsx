'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useAuth } from '@clerk/nextjs'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import { ProfileHeaderImageLayout } from '@/components/ProfileHeaderImageLayout'

export default function InvitePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const inviteCode = params.inviteCode as string

  const circle = useQuery(api.circles.getCircleByInviteCode, { inviteCode })
  const inviteStatus = useQuery(api.memberships.getInviteStatus, { inviteCode })
  const joinCircle = useMutation(api.memberships.joinCircle)

  const [joining, setJoining] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    if (circle) {
      trackEvent('invite_link_viewed', { inviteCode })
    }
  }, [circle, inviteCode])

  const handleJoin = async () => {
    if (!isSignedIn) return

    setJoining(true)
    try {
      const result = await joinCircle({ inviteCode })

      if (result.alreadyMember) {
        setAlreadyMember(true)
        toast.info('You are already a member of this circle')
      } else {
        trackEvent('circle_joined', { circleId: result.circleId, source: 'invite_link' })
        toast.success('Successfully joined circle!')
        router.push(`/dashboard/circles/${result.circleId}`)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join circle'
      toast.error(errorMessage)
    } finally {
      setJoining(false)
    }
  }

  if (circle === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6">
        <p className="text-muted-foreground">Invalid invite link</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Go to dashboard
        </Link>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Show blocked state if user is blocked
  if (inviteStatus?.status === 'blocked') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-destructive/20 bg-card p-8 text-center">
          {circle?.iconUrl ? (
            <Avatar size="lg">
              <AvatarImage src={circle.iconUrl} alt={circle.name} />
              <AvatarFallback>{getInitials(circle.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar size="lg">
              <AvatarFallback>{circle ? getInitials(circle.name) : '?'}</AvatarFallback>
            </Avatar>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">{circle?.name || 'Circle'}</h1>
            {circle?.description && (
              <p className="text-sm text-muted-foreground">{circle.description}</p>
            )}
          </div>

          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              You have been blocked from this circle
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contact the circle admin if you believe this is an error
            </p>
          </div>

          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (alreadyMember) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border bg-card px-8 pb-8 text-center">
          <ProfileHeaderImageLayout
            coverImageUrl={null}
            iconUrl={circle.iconUrl ?? null}
            className="rounded-t-lg overflow-hidden"
          />

          <h1 className="text-2xl font-semibold text-foreground">
            You've been invited to join {circle.name}
          </h1>

          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <span>{circle.memberCount === 1 ? '1 member' : `${circle.memberCount} members`} sharing monthly updates</span>
            <span>{circle.adminName} started this circle</span>
          </div>

          <p className="text-sm text-muted-foreground">You are already a member of this circle</p>

          <Link href={`/dashboard/circles/${circle._id}`} className="w-full">
            <Button className="w-full">Go to Circle</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border bg-card px-8 pb-8 text-center">
          <ProfileHeaderImageLayout
            coverImageUrl={null}
            iconUrl={circle.iconUrl ?? null}
            className="rounded-t-lg overflow-hidden"
          />

          <h1 className="text-2xl font-semibold text-foreground">
            You've been invited to join {circle.name}
          </h1>

          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <span>{circle.memberCount === 1 ? '1 member' : `${circle.memberCount} members`} sharing monthly updates</span>
            <span>{circle.adminName} started this circle</span>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Link href={`/sign-up?redirect_url=/invite/${inviteCode}`} className="w-full">
              <Button className="w-full">Sign up to Join</Button>
            </Link>
            <Link href={`/sign-in?redirect_url=/invite/${inviteCode}`} className="w-full">
              <Button variant="outline" className="w-full">
                Log in to Join
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border bg-card px-8 pb-8 text-center">
        <ProfileHeaderImageLayout
          coverImageUrl={null}
          iconUrl={circle.iconUrl ?? null}
          className="rounded-t-lg overflow-hidden"
        />

        <h1 className="text-2xl font-semibold text-foreground">
          You've been invited to join {circle.name}
        </h1>

        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <span>{circle.memberCount === 1 ? '1 member' : `${circle.memberCount} members`} sharing monthly updates</span>
          <span>{circle.adminName} started this circle</span>
        </div>

        <Button onClick={handleJoin} className="w-full" disabled={joining}>
          {joining ? 'Joining...' : 'Join Circle'}
        </Button>
      </div>
    </div>
  )
}
