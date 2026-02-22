'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, GripVertical, X } from 'lucide-react'
import Link from 'next/link'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PromptItem {
  id: string
  dbId?: Id<'prompts'>
  text: string
}

function SortablePrompt({
  prompt,
  onRemove,
  onChange,
}: {
  prompt: PromptItem
  onRemove: () => void
  onChange: (text: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: prompt.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        value={prompt.text}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        placeholder="Enter prompt..."
      />
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export default function PromptsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'
  const circleId = params.circleId as Id<'circles'>

  const existingPrompts = useQuery(api.prompts.getCirclePrompts, { circleId })
  const promptLibrary = useQuery(api.prompts.getPromptLibrary)
  const updatePrompts = useMutation(api.prompts.updatePrompts)

  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Populate from existing prompts
  useEffect(() => {
    if (existingPrompts && prompts.length === 0) {
      setPrompts(
        existingPrompts.map((p, i) => ({
          id: `prompt-${i}`,
          dbId: p._id,
          text: p.text,
        }))
      )
    }
  }, [existingPrompts, prompts.length])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setPrompts((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const addPrompt = (text: string) => {
    if (prompts.length >= 8) return
    if (
      text.trim() &&
      prompts.some((p) => p.text.trim().toLowerCase() === text.trim().toLowerCase())
    ) {
      toast.error('This prompt already exists')
      return
    }
    setPrompts((prev) => [...prev, { id: `prompt-${Date.now()}`, text }])
  }

  const removePrompt = (id: string) => {
    if (prompts.length <= 1) return
    setPrompts((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePromptText = (id: string, text: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, text } : p)))
  }

  const handleSave = async () => {
    setError(null)
    const validPrompts = prompts.filter((p) => p.text.trim())
    if (validPrompts.length < 1) {
      setError('At least 1 prompt is required')
      return
    }

    // Check for duplicate prompt texts
    const texts = validPrompts.map((p) => p.text.trim().toLowerCase())
    const uniqueTexts = new Set(texts)
    if (uniqueTexts.size !== texts.length) {
      setError('Duplicate prompts are not allowed')
      return
    }

    setSaving(true)
    try {
      await updatePrompts({
        circleId,
        prompts: validPrompts.map((p, i) => ({
          id: p.dbId,
          text: p.text.trim(),
          order: i,
        })),
      })
      toast.success('Prompts saved!')
      router.push(isSetup ? `/dashboard/circles/${circleId}/setup-complete` : '/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save prompts'
      toast.error(message)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  // Check if any library prompts are still available
  const allLibraryPrompts = promptLibrary ? Object.values(promptLibrary).flat() : []
  const hasAvailableLibrary = allLibraryPrompts.some((lp) => !prompts.some((p) => p.text === lp))

  if (existingPrompts === undefined || promptLibrary === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {isSetup ? 'Set Up Prompts' : 'Prompts'}
        </h1>
        <span className="ml-auto text-sm text-muted-foreground">{prompts.length}/8</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        {/* Sortable prompt list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={prompts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {prompts.map((prompt) => (
                <SortablePrompt
                  key={prompt.id}
                  prompt={prompt}
                  onRemove={() => removePrompt(prompt.id)}
                  onChange={(text) => updatePromptText(prompt.id, text)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add custom prompt */}
        {prompts.length < 8 && (
          <button
            type="button"
            onClick={() => addPrompt('')}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/30"
          >
            <Plus className="size-4" />
            Add custom prompt
          </button>
        )}

        {/* Prompt library */}
        {hasAvailableLibrary && promptLibrary && prompts.length < 8 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">Prompt Library</h2>
            {Object.entries(promptLibrary).map(([category, categoryPrompts]) => {
              const available = categoryPrompts.filter((lp) => !prompts.some((p) => p.text === lp))
              if (available.length === 0) return null
              return (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-medium capitalize text-muted-foreground/70">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {available.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => addPrompt(text)}
                        className={cn(
                          'rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent',
                          prompts.length >= 8 && 'pointer-events-none opacity-50'
                        )}
                      >
                        + {text}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={saving || prompts.filter((p) => p.text.trim()).length < 1}
        >
          {saving ? 'Saving...' : isSetup ? 'Continue' : 'Save Prompts'}
        </Button>
      </div>
    </div>
  )
}
