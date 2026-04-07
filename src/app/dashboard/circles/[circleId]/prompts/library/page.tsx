'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import { PromptLibrary } from '@/components/PromptLibrary'

export default function PromptLibraryPage() {
  const params = useParams()
  const router = useRouter()
  const circleId = params.circleId as Id<'circles'>

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href={`/dashboard/circles/${circleId}/prompts`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Prompt Library</h1>
      </header>

      <div className="safe-area-bottom flex-1 overflow-y-auto px-4 py-4">
        <PromptLibrary
          circleId={circleId}
          onBack={() => router.push(`/dashboard/circles/${circleId}/prompts`)}
          onPromptAdded={() => router.push(`/dashboard/circles/${circleId}/prompts`)}
        />
      </div>
    </div>
  )
}
