'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MediaUploader } from './MediaUploader'
import { MediaGrid } from './MediaGrid'
import type { MediaItem } from './MediaGrid'
import type { Id } from '../../../convex/_generated/dataModel'

interface PromptResponseCardProps {
  promptId: string
  promptText: string
  responseId?: Id<'responses'>
  initialValue?: string
  existingMedia?: MediaItem[]
  onValueChange?: (value: string) => void
  onMediaUpload?: (mediaId: Id<'media'>, type: 'image' | 'video') => void
  onMediaRemove?: (mediaId: Id<'media'>) => void
  onMediaError?: (error: string) => void
  onEnsureResponse?: () => Promise<void>
  disabled?: boolean
  maxLength?: number
  maxMedia?: number
}

export function PromptResponseCard({
  promptId,
  promptText,
  responseId,
  initialValue = '',
  existingMedia = [],
  onValueChange,
  onMediaUpload,
  onMediaRemove,
  onMediaError,
  onEnsureResponse,
  disabled = false,
  maxLength = 500,
  maxMedia = 3,
}: PromptResponseCardProps) {
  const [value, setValue] = useState(initialValue)
  const [mediaCount, setMediaCount] = useState(existingMedia.length)
  const [isFocused, setIsFocused] = useState(false)
  const charCount = value.length

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Sync mediaCount when server data changes (e.g. on reload)
  useEffect(() => {
    setMediaCount(existingMedia.length)
  }, [existingMedia.length])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setValue(newValue)
      onValueChange?.(newValue)
    }
  }

  const getCounterColor = () => {
    if (charCount >= maxLength) return 'text-destructive'
    if (charCount >= maxLength * 0.9) return 'text-amber-600 dark:text-amber-500'
    return 'text-muted-foreground'
  }

  const handleMediaUploadComplete = (mediaId: Id<'media'>, type: 'image' | 'video') => {
    setMediaCount((prev) => prev + 1)
    onMediaUpload?.(mediaId, type)
  }

  return (
    <div className="space-y-2">
      {/* Prompt title */}
      <h3 className="font-serif text-lg font-semibold text-foreground">{promptText}</h3>

      {/* Media Grid - above textarea */}
      {existingMedia.length > 0 && (
        <MediaGrid
          media={existingMedia}
          onRemove={disabled ? undefined : onMediaRemove}
          disabled={disabled}
        />
      )}

      {/* Text Input Area with embedded "+" button */}
      <div className="relative rounded-xl border border-border bg-card">
        <Textarea
          id={`prompt-${promptId}`}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Add text or tap + for photos..."
          className={cn(
            'min-h-[80px] resize-none border-0 bg-transparent pb-10 pr-16 shadow-none focus-visible:ring-0',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          maxLength={maxLength}
        />

        {/* "+" button at bottom-left */}
        <div className="absolute bottom-2 left-2">
          <MediaUploader
            responseId={responseId}
            onUploadComplete={handleMediaUploadComplete}
            onUploadError={onMediaError}
            onEnsureResponse={onEnsureResponse}
            maxMedia={maxMedia}
            currentMediaCount={mediaCount}
          />
        </div>

        {/* Character Counter - only visible on focus */}
        {isFocused && (
          <div
            className={cn(
              'absolute bottom-3 right-3 text-xs font-medium transition-colors',
              getCounterColor()
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  )
}
