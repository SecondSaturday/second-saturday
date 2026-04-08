'use client'

import { Suspense, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { PromptsEditor, type PromptsEditorHandle } from '@/components/PromptsEditor'
import { Button } from '@/components/ui/button'
import { CreationLayout } from '@/components/circles/CreationLayout'
import { TipPill } from '@/components/circles/TipPill'

function PromptsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'
  const circleId = params.circleId as Id<'circles'>
  const editorRef = useRef<PromptsEditorHandle>(null)

  if (isSetup) {
    return (
      <CreationLayout
        step={3}
        backHref={`/dashboard/circles/${circleId}/customize`}
        footer={
          <Button className="w-full" onClick={() => editorRef.current?.save()}>
            Next
          </Button>
        }
      >
        <div className="flex flex-1 flex-col">
          <h1 className="font-serif text-[28px] text-foreground md:text-[32px]">Set up prompts</h1>

          <div className="mt-6">
            <PromptsEditor
              ref={editorRef}
              circleId={circleId}
              mode="setup"
              onComplete={() => router.push(`/dashboard/circles/${circleId}/setup-complete`)}
              hideButton
            >
              <TipPill
                icon={<BookOpen className="size-5" />}
                text="Choose the prompts that will appear in your newsletter. Members will answer these each cycle and you can change them every month if you want!"
              />
            </PromptsEditor>
          </div>
        </div>
      </CreationLayout>
    )
  }

  // Settings mode — simple layout
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href={`/dashboard/circles/${circleId}/settings`}>
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Prompts</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <PromptsEditor
          circleId={circleId}
          mode="settings"
          onComplete={() => router.push('/dashboard')}
        />
      </div>
    </div>
  )
}

export default function PromptsPage() {
  return (
    <Suspense>
      <PromptsContent />
    </Suspense>
  )
}
