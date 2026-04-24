'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import type { Id } from '../../convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LeaveCircleModalProps {
  circleId: Id<'circles'>
  isAdmin?: boolean
  isOwner?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaveCircleModal({
  circleId,
  isAdmin,
  isOwner,
  open,
  onOpenChange,
  onSuccess,
}: LeaveCircleModalProps) {
  const leaveCircle = useMutation(api.memberships.leaveCircle)
  const transferAdminAndLeave = useMutation(api.memberships.transferAdminAndLeave)
  const members = useQuery(
    api.memberships.getCircleMembers,
    open && (isAdmin || isOwner) ? { circleId } : 'skip'
  )
  const [loading, setLoading] = useState(false)
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<Id<'users'> | null>(null)

  const currentUser = useQuery(api.users.getCurrentUser)
  const otherMembers = members?.filter((m) => m.userId !== currentUser?._id)
  const otherActiveAdmins = members?.filter(
    (m) => m.role === 'admin' && m.userId !== currentUser?._id
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setSelectedNewAdmin(null)
    onOpenChange(newOpen)
  }

  const handleLeave = async () => {
    setLoading(true)
    try {
      await leaveCircle({ circleId })
      handleOpenChange(false)
      toast.success('Left circle')
      trackEvent('circle_left', { circleId })
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave circle')
    } finally {
      setLoading(false)
    }
  }

  const handleTransferAndLeave = async () => {
    if (!selectedNewAdmin) return
    setLoading(true)
    try {
      await transferAdminAndLeave({ circleId, newAdminUserId: selectedNewAdmin })
      handleOpenChange(false)
      toast.success('Ownership transferred and left circle')
      trackEvent('circle_left', { circleId, adminTransferred: true })
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer and leave')
    } finally {
      setLoading(false)
    }
  }

  // Owner flow: must transfer ownership before leaving (or cascade-delete if alone).
  if (isOwner) {
    const noOtherMembers = otherMembers !== undefined && otherMembers.length === 0

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noOtherMembers ? 'Delete circle & leave' : 'Transfer ownership & leave'}
            </DialogTitle>
            <DialogDescription>
              {noOtherMembers
                ? 'You are the only member. Leaving will permanently delete this circle and all its data (newsletters, submissions, media). This cannot be undone.'
                : 'Pick a new owner before leaving. They will own and manage the circle after you leave.'}
            </DialogDescription>
          </DialogHeader>

          {!noOtherMembers && otherMembers && (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {otherMembers.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setSelectedNewAdmin(member.userId)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedNewAdmin === member.userId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                </button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {noOtherMembers ? (
              <Button variant="destructive" onClick={handleLeave} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete & Leave'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleTransferAndLeave}
                disabled={loading || !selectedNewAdmin}
              >
                {loading ? 'Transferring...' : 'Transfer & Leave'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // For admin users, wait for members to load before deciding which dialog to show,
  // otherwise a last-remaining admin would briefly see the plain Leave button and hit
  // a server error instead of the "promote another admin first" guidance.
  if (isAdmin && members === undefined) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this circle?</DialogTitle>
            <DialogDescription>Loading…</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled>
              Leave Circle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Co-admin who is the last remaining admin: can't leave without promoting someone first.
  if (isAdmin && otherActiveAdmins !== undefined && otherActiveAdmins.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote another admin first</DialogTitle>
            <DialogDescription>
              You&apos;re the only admin right now. Promote another member to co-admin from the
              Members tab before leaving, so the circle still has an admin after you go.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Regular member, or non-owner admin with other admins still present: plain leave.
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this circle?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose access to this circle&apos;s content. Your past contributions will
            remain visible to other members. You can rejoin later via invite link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? 'Leaving...' : 'Leave Circle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
