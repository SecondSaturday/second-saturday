'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import Link from 'next/link'
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
import { Copy, RefreshCw, Check, MoreVertical } from 'lucide-react'
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
import { TransferAdminModal } from '@/components/TransferAdminModal'
import { InviteQRCode } from '@/components/InviteQRCode'

interface CircleSettingsProps {
  circleId: Id<'circles'>
}

export function CircleSettings({ circleId }: CircleSettingsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDesktop = useIsDesktop()
  const tabFromUrl = searchParams?.get('tab') ?? 'details'
  const profileReturnTo = isDesktop
    ? `/dashboard?circle=${circleId}&settings=open&tab=members`
    : `/dashboard/circles/${circleId}/settings?tab=members`
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (value === 'details') params.delete('tab')
    else params.set('tab', value)
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }
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
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [circle?.inviteCode])
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenDialog, setShowRegenDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteCircle = useMutation(api.circles.deleteCircle)
  const promoteToAdmin = useMutation(api.memberships.promoteToAdmin)
  const demoteFromAdmin = useMutation(api.memberships.demoteFromAdmin)
  const [removeTarget, setRemoveTarget] = useState<{ userId: Id<'users'>; name: string } | null>(
    null
  )
  const [showTransferPicker, setShowTransferPicker] = useState(false)

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
  const isOwner = currentUser._id === circle.adminId
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
    } catch {
      toast.error('Failed to copy link.')
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setShowQR(false)
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
    } catch {
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
    } catch {
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
      {/* Tab layout */}
      <Tabs value={tabFromUrl} onValueChange={handleTabChange}>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                aria-label="Copy invite link"
              >
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowQR((v) => !v)}
              className="text-sm text-muted-foreground hover:underline"
            >
              {showQR ? 'Hide QR code' : 'Show QR code'}
            </button>

            {showQR && (
              <div className="flex flex-col items-center gap-2 pt-1">
                <InviteQRCode value={inviteLink} size={320} />
                <p className="font-mono text-xs text-muted-foreground break-all text-center">
                  {inviteLink}
                </p>
              </div>
            )}

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

          {/* Leave / Delete Circle section */}
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setShowLeaveDialog(true)}
            >
              Leave this circle
            </Button>

            {isOwner && (
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete this circle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Circle?</DialogTitle>
                    <DialogDescription>
                      This will archive <strong>{circle.name}</strong>. Members will no longer be
                      able to access the circle or submit responses. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true)
                        try {
                          await deleteCircle({ circleId })
                          setShowDeleteDialog(false)
                          toast.success('Circle deleted')
                          router.replace('/dashboard')
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : 'Failed to delete circle'
                          )
                        } finally {
                          setDeleting(false)
                        }
                      }}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isOwner && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <Label>Ownership</Label>
              <p className="text-xs text-muted-foreground">
                You are the owner of this circle. Transfer ownership to another member if you want
                someone else to be the circle&apos;s owner.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTransferPicker(true)}
              >
                Transfer ownership...
              </Button>
            </div>
          )}

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
          <p className="py-2 text-xs text-muted-foreground">
            Tip: tap a member to see their past contributions.
          </p>
          {members === undefined ? (
            // Loading skeleton
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="size-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {sortedMembers.map((member) => {
                const isSelf = member.userId === currentUser._id
                const memberIsOwner = member.userId === circle.adminId
                const canManage = isAdmin && !isSelf
                const canPromote = canManage && member.role !== 'admin'
                const canDemote = canManage && member.role === 'admin' && !memberIsOwner && isOwner

                const roleLabel =
                  member.role === 'admin' ? (memberIsOwner ? 'Admin · Owner' : 'Admin') : 'Member'

                const rowInner = (
                  <>
                    <Avatar>
                      <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {isSelf ? 'You' : member.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {roleLabel}
                        {member.blocked && (
                          <span className="ml-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                            Blocked
                          </span>
                        )}
                      </span>
                    </div>
                  </>
                )

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    {member.blocked ? (
                      <div className="flex flex-1 items-center gap-3 min-w-0 opacity-60">
                        {rowInner}
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/circles/${circleId}/members/${member.userId}?returnTo=${encodeURIComponent(profileReturnTo)}`}
                        className="flex flex-1 items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                      >
                        {rowInner}
                      </Link>
                    )}

                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Member actions"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canPromote && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await promoteToAdmin({
                                    circleId,
                                    targetUserId: member.userId,
                                  })
                                  toast.success(`${member.name} is now a co-admin`)
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : 'Failed to promote'
                                  )
                                }
                              }}
                            >
                              Make co-admin
                            </DropdownMenuItem>
                          )}
                          {canDemote && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await demoteFromAdmin({
                                    circleId,
                                    targetUserId: member.userId,
                                  })
                                  toast.success(`${member.name} is no longer a co-admin`)
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : 'Failed to demote'
                                  )
                                }
                              }}
                            >
                              Remove co-admin
                            </DropdownMenuItem>
                          )}
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
            </>
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
        isOwner={isOwner}
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onSuccess={() => router.replace('/dashboard')}
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

      {/* Transfer Ownership picker */}
      {showTransferPicker && (
        <TransferAdminModal
          circleId={circleId}
          currentUserId={currentUser._id}
          open={showTransferPicker}
          onOpenChange={setShowTransferPicker}
        />
      )}
    </div>
  )
}
