'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MediaUploader } from './MediaUploader'
import { MediaGrid } from './MediaGrid'
import type { MediaItem } from './MediaGrid'
import type { Id } from '../../../convex/_generated/dataModel'

const EMPTY_MEDIA: MediaItem[] = []

interface PromptResponseCardProps {
  promptId: string
  promptText: string
  promptLabel?: string
  responseId?: Id<'responses'>
  initialValue?: string
  existingMedia?: MediaItem[]
  onValueChange?: (value: string) => void
  onMediaUpload?: (mediaId: Id<'media'>, type: 'image' | 'video') => void
  onMediaRemove?: (mediaId: Id<'media'>) => void
  onMediaError?: (error: string) => void
  onEnsureResponse?: () => Promise<Id<'responses'> | undefined>
  disabled?: boolean
  maxMedia?: number
  variant?: 'legacy' | 'card'
}

export function PromptResponseCard({
  promptId,
  promptText,
  promptLabel,
  responseId,
  initialValue = '',
  existingMedia = EMPTY_MEDIA,
  onValueChange,
  onMediaUpload,
  onMediaRemove,
  onMediaError,
  onEnsureResponse,
  disabled = false,
  maxMedia = 3,
  variant = 'legacy',
}: PromptResponseCardProps) {
  const [value, setValue] = useState(initialValue)
  const [mediaCount, setMediaCount] = useState(existingMedia.length)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    setMediaCount(existingMedia.length)
  }, [existingMedia.length])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onValueChange?.(newValue)
  }

  const handleMediaUploadComplete = (mediaId: Id<'media'>, type: 'image' | 'video') => {
    setMediaCount((prev) => prev + 1)
    onMediaUpload?.(mediaId, type)
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border',
          isFocused ? 'border-2 border-primary' : 'border-border'
        )}
        style={{ height: 'var(--card-height, 480px)' }}
      >
        {/* Prompt zone */}
        <div className="flex shrink-0 flex-col gap-2 bg-card p-5 md:px-7 md:py-6">
          {promptLabel && (
            <span className="text-xs font-medium text-muted-foreground">{promptLabel}</span>
          )}
          <h3 className="font-serif text-2xl text-foreground md:text-[26px]">{promptText}</h3>
        </div>

        {/* Input zone */}
        <div className="flex flex-1 flex-col justify-between bg-white px-5 py-4 md:px-7 md:py-5">
          {/* Textarea */}
          <textarea
            id={`prompt-${promptId}`}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder="Type your response here..."
            className={cn(
              'flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-foreground/25 focus:outline-none',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          />

          {/* Bottom bar: + button + thumbnails */}
          <div className="flex items-end gap-2 pt-2">
            <MediaUploader
              responseId={responseId}
              onUploadComplete={handleMediaUploadComplete}
              onUploadError={onMediaError}
              onEnsureResponse={onEnsureResponse}
              maxMedia={maxMedia}
              currentMediaCount={mediaCount}
              existingMedia={existingMedia}
              onMediaRemove={disabled ? undefined : onMediaRemove}
            />
          </div>
        </div>
      </div>
    )
  }

  // Legacy variant (unchanged)
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-lg font-semibold text-foreground">{promptText}</h3>

      {existingMedia.length > 0 && (
        <MediaGrid
          media={existingMedia}
          onRemove={disabled ? undefined : onMediaRemove}
          onBrokenMedia={() => setMediaCount((prev) => Math.max(0, prev - 1))}
          disabled={disabled}
        />
      )}

      <div className="relative rounded-xl border border-border bg-card">
        <textarea
          id={`prompt-${promptId}`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Add text or tap + for photos..."
          className={cn(
            'min-h-[80px] w-full resize-none rounded-xl border-0 bg-transparent p-3 pb-10 pr-16 text-sm shadow-none focus:outline-none focus:ring-0',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />

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
      </div>
    </div>
  )
}
