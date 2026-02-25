'use client'

import { X, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'

export interface MediaItem {
  _id: Id<'media'>
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
}

interface MediaGridProps {
  media: MediaItem[]
  onRemove?: (mediaId: Id<'media'>) => void
  disabled?: boolean
  className?: string
}

export function MediaGrid({ media, onRemove, disabled = false, className }: MediaGridProps) {
  if (media.length === 0) {
    return null
  }

  const getGridLayout = () => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2'
      default:
        return 'grid-cols-2'
    }
  }

  return (
    <div className={cn('grid gap-2', getGridLayout(), className)}>
      {media.map((item, index) => (
        <div
          key={item._id}
          className={cn(
            'group relative aspect-square overflow-hidden rounded-lg bg-muted',
            media.length === 3 && index === 0 && 'col-span-2'
          )}
        >
          {/* Media Display */}
          {item.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={`Media ${index + 1}`}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="relative size-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnailUrl ?? item.url}
                alt={`Video ${index + 1}`}
                className="size-full object-cover"
              />
              {/* Video Play Indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="rounded-full bg-white/90 p-3">
                  <Play className="size-6 text-black" fill="black" />
                </div>
              </div>
            </div>
          )}

          {/* Remove Button */}
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={() => onRemove(item._id)}
              className={cn(
                'absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-white opacity-0 shadow-lg transition-opacity hover:bg-destructive group-hover:opacity-100',
                'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2'
              )}
              aria-label={`Remove ${item.type} ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          )}

          {/* Disabled Overlay */}
          {disabled && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />}
        </div>
      ))}
    </div>
  )
}
