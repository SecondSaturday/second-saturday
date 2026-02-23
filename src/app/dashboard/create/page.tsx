'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/circles/ImageUpload'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Id } from '../../../../convex/_generated/dataModel'
import { trackEvent } from '@/lib/analytics'

export default function CreateCirclePage() {
  const router = useRouter()
  const createCircle = useMutation(api.circles.createCircle)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconImageId, setIconImageId] = useState<Id<'_storage'> | undefined>()
  const [coverImageId, setCoverImageId] = useState<Id<'_storage'> | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.length < 3) {
      setError('Name must be at least 3 characters')
      return
    }

    setSubmitting(true)
    try {
      const circleId = await createCircle({
        name,
        description: description || undefined,
        iconImageId,
        coverImageId,
        timezone,
      })
      toast.success('Circle created!')
      trackEvent('circle_created', { circleId })
      router.push(`/dashboard/circles/${circleId}/prompts?setup=true`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create circle'
      toast.error(message)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Create Circle</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="safe-area-bottom flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
      >
        {/* Images */}
        <div className="flex flex-col items-center gap-4">
          <ImageUpload shape="circle" label="Icon" onUpload={setIconImageId} />
          <ImageUpload shape="rectangle" label="Cover Image" onUpload={setCoverImageId} />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Circle Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Fake Frems"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{name.length}/50</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="What's this circle about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="mt-auto">
          <Button type="submit" className="w-full" disabled={submitting || name.length < 3}>
            {submitting ? 'Creating...' : 'Create Circle'}
          </Button>
        </div>
      </form>
    </div>
  )
}
