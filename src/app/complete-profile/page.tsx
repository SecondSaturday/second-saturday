'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AuthLayout } from '@/components/auth'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ImageUpload } from '@/components/circles/ImageUpload'
import type { Id } from '../../../convex/_generated/dataModel'
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput'
import { useUser } from '@clerk/nextjs'

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  // Only allow internal relative paths to prevent open redirect
  const redirectUrl =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateProfile = useMutation(api.users.updateProfile)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarStorageId, setAvatarStorageId] = useState<Id<'_storage'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasPrePopulated = useRef(false)

  // If user already has a name, skip to destination
  useEffect(() => {
    if (currentUser && currentUser.name) {
      router.replace(redirectUrl || '/dashboard')
    }
  }, [currentUser, router, redirectUrl])

  // SSO pre-population - only run once when user data is available
  const { user } = useUser()
  useEffect(() => {
    if (user && !hasPrePopulated.current) {
      hasPrePopulated.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (user.firstName) setFirstName(user.firstName)

      if (user.lastName) setLastName(user.lastName)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst) return

    setSaving(true)
    setError(null)
    try {
      const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ')
      await updateProfile({
        name: fullName,
        ...(avatarStorageId ? { avatarStorageId } : {}),
      })
      router.replace(redirectUrl || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      setSaving(false)
    }
  }

  if (currentUser === undefined) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} className="md:hidden" />
        <div className="w-full space-y-2">
          <h1 className="font-serif text-3xl text-center">Set up your profile!</h1>
          <p className="text-sm text-muted-foreground text-center">
            This is how you&apos;ll appear to other members.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex flex-col items-center gap-2">
            <ImageUpload
              shape="circle"
              label="Add photo"
              onUpload={(id) => setAvatarStorageId(id)}
            />
          </div>
          <FloatingLabelInput
            id="first-name"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />
          <FloatingLabelInput
            id="last-name"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!firstName.trim() || saving} className="w-full">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
