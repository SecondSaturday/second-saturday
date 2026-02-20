'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaveCircleModal({
  circleId,
  isAdmin,
  open,
  onOpenChange,
  onSuccess,
}: LeaveCircleModalProps) {
  const router = useRouter()
  const leaveCircle = useMutation(api.memberships.leaveCircle)
  const transferAdmin = useMutation(api.memberships.transferAdmin)
  const members = useQuery(
    api.memberships.getCircleMembers,
    open && isAdmin ? { circleId } : 'skip'
  )
  const [loading, setLoading] = useState(false)
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<Id<'users'> | null>(null)

  const currentUser = useQuery(api.users.getCurrentUser)
  const otherMembers = members?.filter((m) => m.userId !== currentUser?._id)

  const handleLeave = async () => {
    setLoading(true)
    try {
      await leaveCircle({ circleId })
      toast.success('Left circle')
      trackEvent('circle_left', { circleId })
      onOpenChange(false)
      onSuccess?.()
      router.replace('/dashboard')
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
      await transferAdmin({ circleId, newAdminUserId: selectedNewAdmin })
      await leaveCircle({ circleId })
      toast.success('Admin transferred and left circle')
      trackEvent('circle_left', { circleId, adminTransferred: true })
      onOpenChange(false)
      onSuccess?.()
      router.replace('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer and leave')
    } finally {
      setLoading(false)
    }
  }

  // Admin flow: must transfer first
  if (isAdmin) {
    const noOtherMembers = otherMembers !== undefined && otherMembers.length === 0

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer admin & leave</DialogTitle>
            <DialogDescription>
              {noOtherMembers
                ? 'You are the only member. You must delete the circle to leave.'
                : 'Select a new admin before leaving. They will manage the circle after you leave.'}
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {!noOtherMembers && (
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

  // Regular member flow
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this circle?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose access to this circle&apos;s content. Your past contributions will
            remain visible to other members. You can rejoin later via invite link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
