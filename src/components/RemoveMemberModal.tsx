'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
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

interface RemoveMemberModalProps {
  circleId: Id<'circles'>
  targetUserId: Id<'users'>
  targetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveMemberModal({
  circleId,
  targetUserId,
  targetName,
  open,
  onOpenChange,
}: RemoveMemberModalProps) {
  const removeMember = useMutation(api.memberships.removeMember)
  const [loading, setLoading] = useState(false)

  const handleRemove = async (keepContributions: boolean) => {
    setLoading(true)
    try {
      await removeMember({ circleId, targetUserId, keepContributions })
      toast.success('Member removed')
      trackEvent('member_removed', { circleId, keepContributions })
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {targetName}?</DialogTitle>
          <DialogDescription>Choose how to remove this member from the circle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">Remove</p>
            <p className="text-xs text-muted-foreground">Member can rejoin. Contributions stay.</p>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => handleRemove(true)}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove'}
            </Button>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-foreground">Remove & Block</p>
            <p className="text-xs text-muted-foreground">
              Member cannot rejoin. Contributions removed.
            </p>
            <Button
              variant="destructive"
              className="mt-2 w-full"
              onClick={() => handleRemove(false)}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove & Block'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
