'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Palette } from 'lucide-react'
import { toast } from 'sonner'
import { ProfileHeaderImageLayout } from '@/components/ProfileHeaderImageLayout'
import { CreationLayout } from '@/components/circles/CreationLayout'
import { TipPill } from '@/components/circles/TipPill'
import { compressImage } from '@/lib/image'

export default function CustomizeCirclePage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>

  const { isAuthenticated } = useConvexAuth()
  const circle = useQuery(api.circles.getCircle, isAuthenticated ? { circleId } : 'skip')
  const updateCircle = useMutation(api.circles.updateCircle)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const [description, setDescription] = useState<string | null>(null)
  const [iconImageId, setIconImageId] = useState<Id<'_storage'> | undefined>()
  const [coverImageId, setCoverImageId] = useState<Id<'_storage'> | undefined>()
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      if (iconPreview) URL.revokeObjectURL(iconPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileUpload = async (file: File, field: 'icon' | 'cover') => {
    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
      })

      // Show preview immediately
      const previewUrl = URL.createObjectURL(compressed)
      if (field === 'cover') {
        if (coverPreview) URL.revokeObjectURL(coverPreview)
        setCoverPreview(previewUrl)
      } else {
        if (iconPreview) URL.revokeObjectURL(iconPreview)
        setIconPreview(previewUrl)
      }

      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': compressed.type },
        body: compressed,
      })
      const { storageId } = await result.json()

      if (field === 'cover') setCoverImageId(storageId)
      else setIconImageId(storageId)
    } catch {
      toast.error('Failed to upload image')
    }
  }

  const handleNext = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const updates: Record<string, unknown> = { circleId }
      if (iconImageId) updates.iconImageId = iconImageId
      if (coverImageId) updates.coverImageId = coverImageId
      if (description !== null && description !== (circle?.description ?? '')) {
        updates.description = description
      }

      if (Object.keys(updates).length > 1) {
        await updateCircle(updates as Parameters<typeof updateCircle>[0])
      }

      router.push(`/dashboard/circles/${circleId}/prompts?setup=true`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update circle')
    } finally {
      setSubmitting(false)
    }
  }

  if (circle === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const displayCover = coverPreview ?? circle?.coverUrl ?? null
  const displayIcon = iconPreview ?? circle?.iconUrl ?? null
  const displayDescription = description ?? circle?.description ?? ''

  return (
    <CreationLayout
      step={2}
      backHref="/dashboard/create"
      footer={
        <Button className="w-full" disabled={submitting} onClick={handleNext}>
          {submitting ? 'Saving...' : 'Next'}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col">
        <h1 className="font-serif text-[28px] text-foreground md:text-[32px]">Make it yours</h1>

        <div className="mt-6">
          <ProfileHeaderImageLayout
            coverImageUrl={displayCover}
            iconUrl={displayIcon}
            editable
            onCoverUpload={(file) => handleFileUpload(file, 'cover')}
            onIconUpload={(file) => handleFileUpload(file, 'icon')}
            className="-mx-1"
          />
        </div>

        <h2 className="mt-4 text-center font-serif text-2xl text-foreground">{circle?.name}</h2>

        <div className="mt-6 space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="What's this circle about?"
            value={displayDescription}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
          />
        </div>

        <div className="mt-auto pt-8">
          <TipPill
            icon={<Palette className="size-5" />}
            text="Give your circle an avatar and cover, something everyone would be fond of"
          />
        </div>
      </div>
    </CreationLayout>
  )
}
