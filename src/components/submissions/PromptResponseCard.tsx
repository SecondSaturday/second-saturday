'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MediaUploader } from './MediaUploader'
import { MediaGrid } from './MediaGrid'
import type { MediaItem } from './MediaGrid'
import type { Id } from '../../../convex/_generated/dataModel'

interface PromptResponseCardProps {
  promptId: string
  promptText: string
  responseId: Id<'responses'>
  initialValue?: string
  existingMedia?: MediaItem[]
  onValueChange?: (value: string) => void
  onMediaUpload?: (mediaId: Id<'media'>, type: 'image' | 'video') => void
  onMediaRemove?: (mediaId: Id<'media'>) => void
  onMediaError?: (error: string) => void
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
  disabled = false,
  maxLength = 500,
  maxMedia = 3,
}: PromptResponseCardProps) {
  const [value, setValue] = useState(initialValue)
  const [mediaCount, setMediaCount] = useState(existingMedia.length)
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{promptText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Input Area */}
        <div className="relative">
          <Textarea
            id={`prompt-${promptId}`}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Share your thoughts..."
            className={cn('min-h-[120px] resize-none', disabled && 'cursor-not-allowed opacity-60')}
            maxLength={maxLength}
          />

          {/* Character Counter */}
          <div
            className={cn(
              'absolute bottom-3 right-3 text-xs font-medium transition-colors',
              getCounterColor()
            )}
          >
            {charCount}/{maxLength}
          </div>
        </div>

        {/* Existing Media Preview */}
        {existingMedia.length > 0 && (
          <MediaGrid
            media={existingMedia}
            onRemove={disabled ? undefined : onMediaRemove}
            disabled={disabled}
          />
        )}

        {/* Media Upload Area — only available after a response has been saved */}
        {typeof responseId === 'string' && !responseId.startsWith('temp-') ? (
          <MediaUploader
            responseId={responseId}
            onUploadComplete={handleMediaUploadComplete}
            onUploadError={onMediaError}
            maxMedia={maxMedia}
            currentMediaCount={mediaCount}
          />
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Start typing to enable photo &amp; video uploads
          </p>
        )}
      </CardContent>
    </Card>
  )
}
