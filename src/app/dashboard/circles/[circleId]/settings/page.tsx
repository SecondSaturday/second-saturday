'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '../../../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/circles/ImageUpload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Check,
  Settings,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { trackEvent } from '@/lib/analytics'

export default function CircleSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const circleId = params.circleId as Id<'circles'>

  const circle = useQuery(api.circles.getCircle, { circleId })
  const updateCircle = useMutation(api.circles.updateCircle)
  const regenerateInviteCode = useMutation(api.circles.regenerateInviteCode)

  const [name, setName] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenDialog, setShowRegenDialog] = useState(false)

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

  if (circle.role !== 'admin') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background">
        <p className="text-muted-foreground">Only admins can access settings</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const displayName = name ?? circle.name
  const displayDescription = description ?? circle.description ?? ''

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${circle.inviteCode}`

  const handleCopyLink = async () => {
    const userName = user?.firstName ?? user?.fullName ?? 'Someone'
    const shareText = `${userName} invited you to ${circle.name} - ${inviteLink}`
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    toast.success('Invite link copied!')
    trackEvent('invite_link_copied', { circleId })
    setTimeout(() => setCopied(false), 2000)
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
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    (name !== null && name !== circle.name) ||
    (description !== null && description !== (circle.description ?? ''))

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Circle Settings</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        {/* Images */}
        <div className="flex flex-col items-center gap-4">
          <ImageUpload
            shape="circle"
            label="Icon"
            previewUrl={circle.iconUrl}
            onUpload={(storageId) => updateCircle({ circleId, iconImageId: storageId })}
          />
          <ImageUpload
            shape="rectangle"
            label="Cover"
            previewUrl={circle.coverUrl}
            onUpload={(storageId) => updateCircle({ circleId, coverImageId: storageId })}
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Circle Name</Label>
          <Input
            id="name"
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Description */}
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

        {/* Circle Info */}
        <div className="flex gap-6 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(circle.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Issues sent</p>
            <p className="text-sm font-medium text-foreground">{circle.newsletterCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="text-sm font-medium text-foreground">{circle.memberCount}</p>
          </div>
        </div>

        {/* 3-member warning */}
        {circle.memberCount < 3 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Invite {3 - circle.memberCount} more member{circle.memberCount < 2 ? 's' : ''} to
              start sending newsletters.
            </p>
          </div>
        )}

        {/* Invite Link */}
        <div className="space-y-3">
          <Label>Invite Link</Label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <p className="flex-1 truncate text-sm text-muted-foreground">{inviteLink}</p>
            <Button variant="ghost" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            </Button>
          </div>

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
                  The current invite link will stop working immediately. Anyone who has the old link
                  will no longer be able to join. You&apos;ll need to share the new link.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegenDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Prompts link */}
        <Link
          href={`/dashboard/circles/${circleId}/prompts`}
          className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
        >
          <Settings className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Configure Prompts</p>
            <p className="text-xs text-muted-foreground">Edit, reorder, or add prompts</p>
          </div>
        </Link>

        {/* Submission status link (admin only) */}
        <Link
          href={`/dashboard/circles/${circleId}/submissions`}
          className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
        >
          <ClipboardList className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Submission Status</p>
            <p className="text-xs text-muted-foreground">View who has submitted</p>
          </div>
        </Link>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {hasChanges && (
          <div className="mt-auto">
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
