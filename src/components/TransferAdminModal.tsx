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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import type { Id } from '../../convex/_generated/dataModel'

interface TransferAdminModalProps {
  circleId: Id<'circles'>
  currentUserId?: Id<'users'>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferAdminModal({
  circleId,
  currentUserId,
  open,
  onOpenChange,
}: TransferAdminModalProps) {
  const transferAdmin = useMutation(api.memberships.transferAdmin)
  const members = useQuery(api.memberships.getCircleMembers, { circleId })
  const [loading, setLoading] = useState(false)
  const [pickedId, setPickedId] = useState<Id<'users'> | null>(null)
  const [pickedName, setPickedName] = useState<string | null>(null)

  const handleTransfer = async () => {
    if (!pickedId || !pickedName) return
    setLoading(true)
    try {
      await transferAdmin({ circleId, newAdminUserId: pickedId })
      toast.success(`${pickedName} is now the owner`)
      trackEvent('admin_transferred', { circleId })
      onOpenChange(false)
      setPickedId(null)
      setPickedName(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer ownership')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const eligibleMembers = members?.filter((m) => m.userId !== currentUserId) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
          <DialogDescription>
            The new owner becomes the sole owner of this circle. You will remain an admin.
          </DialogDescription>
        </DialogHeader>

        {!pickedId && (
          <div className="flex flex-col gap-2 py-2 max-h-72 overflow-y-auto">
            {members === undefined ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : eligibleMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other members to transfer to.</p>
            ) : (
              eligibleMembers.map((m) => (
                <button
                  type="button"
                  key={m.userId}
                  onClick={() => {
                    setPickedId(m.userId)
                    setPickedName(m.name)
                  }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 text-left hover:bg-accent"
                >
                  <Avatar>
                    <AvatarImage src={m.imageUrl || undefined} alt={m.name} />
                    <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{m.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {pickedId && pickedName && (
          <p className="py-2 text-sm">
            Transfer ownership to <strong>{pickedName}</strong>?
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
              setPickedId(null)
              setPickedName(null)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          {pickedId && (
            <Button onClick={handleTransfer} disabled={loading}>
              {loading ? 'Transferring...' : 'Transfer ownership'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
