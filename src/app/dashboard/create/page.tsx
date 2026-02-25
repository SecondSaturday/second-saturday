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
import { StepProgressIndicator } from '@/components/ui/StepProgressIndicator'

export default function CreateCirclePage() {
  const router = useRouter()
  const createCircle = useMutation(api.circles.createCircle)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconImageId, setIconImageId] = useState<Id<'_storage'> | undefined>()
  const [coverImageId, setCoverImageId] = useState<Id<'_storage'> | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)

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

  if (showSplash) {
    return (
      <div className="safe-area-top flex h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Link href="/dashboard">
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl font-semibold text-foreground">Create Your Group</h1>
            <p className="text-lg text-muted-foreground">
              Every second Saturday, connect meaningfully
            </p>
            <p className="text-sm text-muted-foreground">
              Set prompts, invite friends, and receive monthly newsletters
            </p>
          </div>
          <Button className="w-full max-w-xs" onClick={() => setShowSplash(false)}>
            Get Started
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Create Circle</h1>
      </header>

      <StepProgressIndicator steps={['Basic Info', 'Prompts', 'Members']} currentStep={1} />

      <form
        id="create-circle-form"
        onSubmit={handleSubmit}
        className="safe-area-bottom flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 pb-24"
      >
        <div className="mx-auto w-full max-w-lg">
          {/* Images */}
          <div className="flex flex-col items-center gap-4">
            <ImageUpload shape="circle" label="Icon" onUpload={setIconImageId} />
            <ImageUpload shape="rectangle" label="Cover Image" onUpload={setCoverImageId} />
          </div>

          {/* Name */}
          <div className="mt-6 space-y-2">
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
          <div className="mt-6 space-y-2">
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

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        </div>
      </form>

      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
        <div className="mx-auto max-w-lg">
          <Button
            form="create-circle-form"
            type="submit"
            className="w-full"
            disabled={submitting || name.length < 3}
          >
            {submitting ? 'Creating...' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
