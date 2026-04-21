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

interface TransferAdminModalProps {
  circleId: Id<'circles'>
  targetUserId: Id<'users'>
  targetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferAdminModal({
  circleId,
  targetUserId,
  targetName,
  open,
  onOpenChange,
}: TransferAdminModalProps) {
  const transferAdmin = useMutation(api.memberships.transferAdmin)
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    setLoading(true)
    try {
      await transferAdmin({ circleId, newAdminUserId: targetUserId })
      toast.success(`${targetName} is now the admin`)
      trackEvent('admin_transferred', { circleId })
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make {targetName} admin?</DialogTitle>
          <DialogDescription>
            {targetName} will become the circle admin and can manage members, prompts, and settings.
            You will be demoted to a regular member.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? 'Transferring...' : 'Make admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
