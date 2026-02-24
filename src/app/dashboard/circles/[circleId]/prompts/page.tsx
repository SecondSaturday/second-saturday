'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { PromptsEditor } from '@/components/PromptsEditor'

export default function PromptsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'
  const circleId = params.circleId as Id<'circles'>

  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {isSetup ? 'Set Up Prompts' : 'Prompts'}
        </h1>
      </header>

      <PromptsEditor
        circleId={circleId}
        mode={isSetup ? 'setup' : 'settings'}
        onComplete={() =>
          router.push(isSetup ? `/dashboard/circles/${circleId}/setup-complete` : '/dashboard')
        }
      />
    </div>
  )
}
