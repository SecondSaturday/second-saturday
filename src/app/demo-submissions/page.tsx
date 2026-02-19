'use client'

import { MediaUploader } from '@/components/submissions/MediaUploader'
import type { Id } from '../../../convex/_generated/dataModel'

export default function DemoSubmissionsPage() {
  // Use a mock response ID for demo purposes
  const mockResponseId = 'demo-response-123' as Id<'responses'>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Demo Video Upload</h1>
        <p className="text-muted-foreground">
          This page demonstrates the video upload functionality with blocking modal and progress
          tracking.
        </p>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Upload Media</h2>
          <MediaUploader responseId={mockResponseId} maxMedia={3} currentMediaCount={0} />
        </div>
      </div>
    </div>
  )
}
