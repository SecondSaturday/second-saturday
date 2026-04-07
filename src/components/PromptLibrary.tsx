'use client'

import { useQuery, useMutation } from 'convex/react'
import { ArrowLeft, Plus } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<string, string> = {
  fun: 'Fun',
  gratitude: 'Gratitude',
  reflection: 'Reflection',
  deep: 'Check-in',
}

interface PromptLibraryProps {
  circleId: Id<'circles'>
  onBack: () => void
  onPromptAdded?: () => void
}

export function PromptLibrary({ circleId, onBack, onPromptAdded }: PromptLibraryProps) {
  const promptLibrary = useQuery(api.prompts.getPromptLibrary)
  const existingPrompts = useQuery(api.prompts.getCirclePrompts, { circleId })
  const updatePrompts = useMutation(api.prompts.updatePrompts)

  const handleAddPrompt = async (text: string) => {
    if (!existingPrompts) return

    if (existingPrompts.length >= 8) {
      toast.error('Maximum 8 prompts allowed')
      return
    }

    if (existingPrompts.some((p) => p.text.toLowerCase() === text.toLowerCase())) {
      toast.error('This prompt already exists')
      return
    }

    try {
      await updatePrompts({
        circleId,
        prompts: [
          ...existingPrompts.map((p, i) => ({
            id: p._id,
            text: p.text,
            order: i,
          })),
          {
            text,
            order: existingPrompts.length,
          },
        ],
      })
      toast.success('Prompt added!')
      onPromptAdded?.()
    } catch {
      toast.error('Failed to add prompt')
    }
  }

  if (promptLibrary === undefined || existingPrompts === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const categories = Object.keys(promptLibrary)

  return (
    <div className="flex flex-col">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Prompts
      </button>

      <Tabs defaultValue={categories[0]} className="flex flex-col">
        <TabsList variant="line">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {CATEGORY_LABELS[category] || category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categoryPrompts = promptLibrary[category] || []
          return (
            <TabsContent key={category} value={category} className="flex flex-col gap-2 py-4">
              {categoryPrompts.map((text) => {
                const isAdded = existingPrompts.some(
                  (p) => p.text.toLowerCase() === text.toLowerCase()
                )
                const isDisabled = isAdded || existingPrompts.length >= 8

                return (
                  <div
                    key={text}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <p className="flex-1 text-sm text-foreground">{text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      disabled={isDisabled}
                      onClick={() => handleAddPrompt(text)}
                    >
                      <Plus
                        className={`size-4 ${isAdded ? 'text-muted-foreground' : 'text-foreground'}`}
                      />
                    </Button>
                  </div>
                )
              })}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
