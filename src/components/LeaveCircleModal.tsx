'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface LeaveCircleModalProps {
  circleId: Id<'circles'>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaveCircleModal({
  circleId,
  open,
  onOpenChange,
  onSuccess,
}: LeaveCircleModalProps) {
  const router = useRouter()
  const leaveCircle = useMutation(api.memberships.leaveCircle)
  const [loading, setLoading] = useState(false)

  const handleLeave = async () => {
    setLoading(true)
    try {
      await leaveCircle({ circleId })
      toast.success('Left circle')
      trackEvent('circle_left', { circleId })
      onOpenChange(false)
      // Call success callback to close parent modals/sheets
      onSuccess?.()
      // Clear any circle selection and redirect to dashboard
      router.replace('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave circle')
    } finally {
      setLoading(false)
    }
  }

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
