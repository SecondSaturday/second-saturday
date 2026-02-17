'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Loader2, Play, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'

interface VideoThumbnailProps {
  videoId: Id<'videos'>
  className?: string
  onError?: (error: string) => void
}

/**
 * VideoThumbnail - Displays video thumbnail with processing status
 *
 * Features:
 * - Shows processing status while video is being processed by Mux
 * - Displays thumbnail when video is ready
 * - Shows error state if video processing fails
 * - Polls for video status updates
 *
 * Usage:
 * ```tsx
 * <VideoThumbnail videoId={videoId} />
 * ```
 */
export function VideoThumbnail({ videoId, className, onError }: VideoThumbnailProps) {
  const video = useQuery(api.videos.getVideo, { id: videoId })
  const [thumbnailError, setThumbnailError] = useState(false)

  // Notify parent of errors
  useEffect(() => {
    if (video?.status === 'error' && video.error) {
      onError?.(video.error)
    }
  }, [video?.status, video?.error, onError])

  // Video is still being fetched
  if (video === undefined) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted aspect-video',
          className
        )}
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Video not found
  if (video === null) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 p-6 aspect-video',
          className
        )}
      >
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">Video not found</p>
      </div>
    )
  }

  // Video processing failed
  if (video.status === 'error') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 p-6 aspect-video',
          className
        )}
      >
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">Video processing failed</p>
        {video.error && <p className="text-xs text-muted-foreground">{video.error}</p>}
      </div>
    )
  }

  // Video is still uploading or processing
  if (video.status === 'uploading' || !video.playbackId) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg bg-muted p-6 aspect-video',
          className
        )}
      >
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {video.status === 'uploading' ? 'Uploading video...' : 'Processing video...'}
          </p>
          <p className="text-xs text-muted-foreground">This may take a few minutes</p>
        </div>
      </div>
    )
  }

  // Video is ready - show thumbnail
  const thumbnailUrl = `https://image.mux.com/${video.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`

  return (
    <div className={cn('group relative overflow-hidden rounded-lg aspect-video', className)}>
      {!thumbnailError ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="size-full object-cover transition-transform group-hover:scale-105"
            onError={() => setThumbnailError(true)}
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="size-8 text-gray-900" fill="currentColor" />
            </div>
          </div>
          {/* Duration badge (if available) */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </div>
          )}
        </>
      ) : (
        <div className="flex size-full items-center justify-center bg-muted">
          <div className="text-center">
            <AlertCircle className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Failed to load thumbnail</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
