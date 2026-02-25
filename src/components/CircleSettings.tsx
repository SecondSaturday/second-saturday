'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProfileHeaderImageLayout } from '@/components/ProfileHeaderImageLayout'
import { compressImage } from '@/lib/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Copy, RefreshCw, Check, AlertTriangle, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { Id } from '../../convex/_generated/dataModel'
import { trackEvent } from '@/lib/analytics'
import { LeaveCircleModal } from '@/components/LeaveCircleModal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PromptsEditor } from '@/components/PromptsEditor'
import { AdminSubmissionDashboard } from '@/components/AdminSubmissionDashboard'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RemoveMemberModal } from '@/components/RemoveMemberModal'

interface CircleSettingsProps {
  circleId: Id<'circles'>
}

export function CircleSettings({ circleId }: CircleSettingsProps) {
  const router = useRouter()
  const { user } = useUser()

  const circle = useQuery(api.circles.getCircle, { circleId })
  const members = useQuery(api.memberships.getCircleMembers, { circleId })
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateCircle = useMutation(api.circles.updateCircle)
  const regenerateInviteCode = useMutation(api.circles.regenerateInviteCode)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const [name, setName] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenDialog, setShowRegenDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ userId: Id<'users'>; name: string } | null>(
    null
  )

  if (circle === undefined || members === undefined || currentUser === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!circle || !currentUser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    )
  }

  const isAdmin = circle.role === 'admin'
  const displayName = name ?? circle.name
  const displayDescription = description ?? circle.description ?? ''

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${circle.inviteCode}`

  const handleCopyLink = async () => {
    try {
      const userName = user?.firstName ?? user?.fullName ?? 'Someone'
      const shareText = `${userName} invited you to ${circle.name} - ${inviteLink}`
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Invite link copied!')
      trackEvent('invite_link_copied', { circleId })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link.')
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await regenerateInviteCode({ circleId })
      toast.success('Invite link regenerated')
      trackEvent('invite_link_generated', { circleId })
      setShowRegenDialog(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  const handleSave = async () => {
    // Validate name
    if (name !== null && name.trim().length < 3) {
      toast.error('Name must be at least 3 characters')
      return
    }

    setError(null)
    setSaving(true)
    try {
      const updates: { circleId: Id<'circles'>; name?: string; description?: string } = {
        circleId: circleId as Id<'circles'>,
      }
      if (name !== null && name !== circle.name) updates.name = name
      if (description !== null && description !== (circle.description ?? ''))
        updates.description = description

      if (Object.keys(updates).length > 1) {
        await updateCircle(updates)
        toast.success('Circle updated')
        trackEvent('circle_updated', { circleId })
      }

      // Reset local state
      setName(null)
      setDescription(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (storageId: Id<'_storage'>, field: 'icon' | 'cover') => {
    try {
      if (field === 'icon') {
        await updateCircle({ circleId, iconImageId: storageId })
      } else {
        await updateCircle({ circleId, coverImageId: storageId })
      }
    } catch (err) {
      toast.error('Failed to upload image.')
    }
  }

  const handleFileUpload = async (file: File, field: 'icon' | 'cover') => {
    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
      })
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': compressed.type },
        body: compressed,
      })
      const { storageId } = await result.json()
      await handleImageUpload(storageId, field)
    } catch (err) {
      toast.error('Failed to upload image.')
    }
  }

  const hasChanges =
    (name !== null && name !== circle.name) ||
    (description !== null && description !== (circle.description ?? ''))

  // Sort members: admin first, then alphabetical by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    return a.name.localeCompare(b.name)
  })

  const handleRemoveClick = (userId: Id<'users'>, name: string) => {
    setRemoveTarget({ userId, name })
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats tiles (ABOVE tabs — always visible) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{circle.memberCount}</p>
          <p className="text-sm text-muted-foreground">Members</p>
        </div>
        <div className="rounded-lg bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{circle.newsletterCount}</p>
          <p className="text-sm text-muted-foreground">Issues Sent</p>
        </div>
        <div className="rounded-lg bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {new Date(circle.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm text-muted-foreground">Created</p>
        </div>
      </div>

      {/* 3-member warning (admin only, above tabs) */}
      {isAdmin && circle.memberCount < 3 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Invite {3 - circle.memberCount} more member{circle.memberCount < 2 ? 's' : ''} to start
            sending newsletters.
          </p>
        </div>
      )}

      {/* Tab layout */}
      <Tabs defaultValue="details">
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="members">Members ({members?.length ?? 0})</TabsTrigger>
          {isAdmin && <TabsTrigger value="status">Status</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="flex flex-col gap-6">
          {/* Images */}
          <ProfileHeaderImageLayout
            coverImageUrl={circle.coverUrl}
            iconUrl={circle.iconUrl}
            editable={isAdmin}
            onCoverUpload={(file) => handleFileUpload(file, 'cover')}
            onIconUpload={(file) => handleFileUpload(file, 'icon')}
            className="-mx-4 -mt-4"
          />

          {/* Name (admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="name">Circle Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          {/* Description (admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={displayDescription}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>
          )}

          {/* Invite Link */}
          <div className="space-y-3">
            <Label>Invite Link</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <p className="flex-1 truncate text-sm text-muted-foreground">{inviteLink}</p>
              <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copy invite link">
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>

            {isAdmin && (
              <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-destructive hover:underline"
                  >
                    <RefreshCw className="size-3" />
                    Regenerate invite link
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Regenerate Invite Link?</DialogTitle>
                    <DialogDescription>
                      The current invite link will stop working immediately. Anyone who has the old
                      link will no longer be able to join. You&apos;ll need to share the new link.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRegenDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                    >
                      {regenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Leave Circle section */}
          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowLeaveDialog(true)}
            >
              Leave this circle
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {isAdmin && hasChanges && (
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="prompts">
          <PromptsEditor
            circleId={circleId}
            mode="settings"
            onComplete={() => toast.success('Prompts saved!')}
          />
        </TabsContent>

        <TabsContent value="members" className="flex flex-col gap-2">
          {sortedMembers.map((member) => {
            const isSelf = member.userId === currentUser._id
            const canRemove = isAdmin && !isSelf

            return (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Avatar>
                  <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {isSelf ? 'You' : member.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>

                {canRemove && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Member actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRemoveClick(member.userId, member.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}

          {sortedMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No members yet</p>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="status">
            <AdminSubmissionDashboard circleId={circleId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Leave Circle Modal (stays outside tabs) */}
      <LeaveCircleModal
        circleId={circleId}
        isAdmin={isAdmin}
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onSuccess={() => router.push('/dashboard')}
      />

      {/* Remove Member Modal */}
      {removeTarget && (
        <RemoveMemberModal
          circleId={circleId}
          targetUserId={removeTarget.userId}
          targetName={removeTarget.name}
          open={!!removeTarget}
          onOpenChange={(open) => {
            if (!open) setRemoveTarget(null)
          }}
        />
      )}
    </div>
  )
}
