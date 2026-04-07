'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import { CreationLayout } from '@/components/circles/CreationLayout'
import { TipPill } from '@/components/circles/TipPill'

export default function CreateCirclePage() {
  const router = useRouter()
  const createCircle = useMutation(api.circles.createCircle)

  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const handleNext = async () => {
    if (name.length < 3 || submitting) return
    setSubmitting(true)
    try {
      const circleId = await createCircle({ name, timezone })
      toast.success('Circle created!')
      trackEvent('circle_created', { circleId })
      router.push(`/dashboard/circles/${circleId}/customize`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create circle')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CreationLayout
      step={1}
      backHref="/dashboard"
      footer={
        <Button className="w-full" disabled={submitting || name.length < 3} onClick={handleNext}>
          {submitting ? 'Creating...' : 'Next'}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col">
        <h1 className="font-serif text-[28px] text-foreground md:text-[32px]">Name your circle</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          That&apos;s all you need to get started. Everything else can wait.
        </p>

        <div className="mt-8 space-y-2">
          <Label htmlFor="name">Circle name</Label>
          <Input
            id="name"
            placeholder="e.g. Friday Friends"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
          />
        </div>

        <div className="mt-auto pt-8">
          <TipPill
            icon={<Calendar className="size-5" />}
            text="Your circle sends a newsletter every 2nd Saturday of the month"
          />
        </div>
      </div>
    </CreationLayout>
  )
}
