'use client'

import { useState } from 'react'
import { useUser, useClerk, UserProfile } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { ImageUpload } from '@/components/circles/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import type { Id } from '../../../../convex/_generated/dataModel'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const convexUser = useQuery(api.users.getCurrentUser)
  const updateProfile = useMutation(api.users.updateProfile)
  const deleteAccount = useMutation(api.users.deleteAccount)

  const [name, setName] = useState<string | null>(null)
  const [avatarStorageId, setAvatarStorageId] = useState<Id<'_storage'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteReauthPassword, setDeleteReauthPassword] = useState('')
  const [deleteReauthError, setDeleteReauthError] = useState<string | null>(null)
  const [deleteReauthVerified, setDeleteReauthVerified] = useState(false)
  const [deleteReauthing, setDeleteReauthing] = useState(false)

  const displayName = name ?? convexUser?.name ?? ''
  const hasChanges = name !== null || avatarStorageId !== null

  const handleSave = async () => {
    if (name !== null && name.trim().length < 1) {
      toast.error('Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const args: { name?: string; avatarStorageId?: Id<'_storage'> } = {}
      if (name !== null) args.name = name
      if (avatarStorageId !== null) args.avatarStorageId = avatarStorageId

      await updateProfile(args)

      if (name !== null) trackEvent('profile_updated', { field: 'name' })
      if (avatarStorageId !== null) trackEvent('profile_updated', { field: 'photo' })

      setName(null)
      setAvatarStorageId(null)
    } catch (err) {
      console.error('Failed to save profile:', err)
      toast.error('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleReauthForDelete = async () => {
    setDeleteReauthError(null)
    setDeleteReauthing(true)
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deleteReauthPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Invalid password')
      }
      setDeleteReauthVerified(true)
    } catch (err) {
      setDeleteReauthError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setDeleteReauthing(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      trackEvent('account_deleted')
      await deleteAccount()
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete Clerk account')
      }
      await signOut({ redirectUrl: '/' })
    } catch (err) {
      console.error('Failed to delete account:', err)
      toast.error('Failed to delete account.')
      setDeleting(false)
    }
  }

  if (!convexUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </header>

      <div className="safe-area-bottom flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <div className="mx-auto max-w-lg space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <ImageUpload
                  shape="circle"
                  label="Photo"
                  previewUrl={convexUser.imageUrl}
                  onUpload={(storageId) => setAvatarStorageId(storageId)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input
                  value={convexUser.timezone ?? 'Not detected'}
                  disabled
                  className="text-muted-foreground"
                />
              </div>

              <Button onClick={handleSave} disabled={!hasChanges || saving} className="w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <NotificationPreferences />

          <Card>
            <CardHeader>
              <CardTitle>Email & Password</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfile
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    cardBox: 'shadow-none w-full',
                    card: 'shadow-none w-full',
                    navbar: 'hidden',
                    navbarMobileMenuButton: 'hidden',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    profileSectionPrimaryButton: 'text-primary',
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ redirectUrl: '/sign-in' })}
              >
                <LogOut className="mr-2 size-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                  setDeleteOpen(open)
                  if (!open) {
                    setDeleteConfirm('')
                    setDeleteReauthPassword('')
                    setDeleteReauthError(null)
                    setDeleteReauthVerified(false)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account, leave all circles, and remove your
                      data. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  {!deleteReauthVerified ? (
                    <div className="space-y-4">
                      {clerkUser?.passwordEnabled ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Enter your password to continue
                          </label>
                          <Input
                            type="password"
                            value={deleteReauthPassword}
                            onChange={(e) => setDeleteReauthPassword(e.target.value)}
                            placeholder="Current password"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            You signed in with an external provider. Confirm your email to continue.
                          </p>
                          <Input
                            value={clerkUser?.primaryEmailAddress?.emailAddress ?? ''}
                            disabled
                            className="text-muted-foreground"
                          />
                        </div>
                      )}
                      {deleteReauthError && (
                        <p className="text-sm text-destructive">{deleteReauthError}</p>
                      )}
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={
                            clerkUser?.passwordEnabled
                              ? !deleteReauthPassword || deleteReauthing
                              : deleteReauthing
                          }
                          onClick={
                            clerkUser?.passwordEnabled
                              ? handleReauthForDelete
                              : () => setDeleteReauthVerified(true)
                          }
                        >
                          {deleteReauthing ? 'Verifying...' : 'Verify Identity'}
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </label>
                        <Input
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={deleteConfirm !== 'DELETE' || deleting}
                          onClick={handleDeleteAccount}
                        >
                          {deleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
