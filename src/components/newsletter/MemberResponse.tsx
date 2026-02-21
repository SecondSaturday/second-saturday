'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface MemberResponseProps {
  memberName: string
  text: string
  media?: MediaItem[]
}

export function MemberResponse({ memberName, text, media }: MemberResponseProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <p className="text-base font-semibold text-foreground">{memberName}</p>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{text}</p>

      {media && media.length > 0 && (
        <div className={cn('grid gap-2 pt-1', media.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {media.map((item, index) => (
            <div
              key={index}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg bg-muted',
                media.length === 3 && index === 0 && 'col-span-2'
              )}
            >
              {item.type === 'image' ? (
                <button
                  type="button"
                  className="size-full"
                  onClick={() => setExpandedImage(item.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`Photo by ${memberName}`}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block size-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl ?? item.url}
                    alt={`Video by ${memberName}`}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="rounded-full bg-white/90 p-3">
                      <Play className="size-6 text-black" fill="black" />
                    </div>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for expanded image */}
      {expandedImage && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage}
            alt="Full size"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </button>
      )}
    </div>
  )
}
