'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface MemberResponseProps {
  memberName: string
  memberAvatarUrl?: string | null
  text: string
  media?: MediaItem[]
  showDivider?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function MemberResponse({
  memberName,
  memberAvatarUrl,
  text,
  media,
  showDivider = false,
}: MemberResponseProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  return (
    <div>
      {/* Inset divider between responses */}
      {showDivider && (
        <div className="px-6">
          <div className="h-px bg-border" />
        </div>
      )}

      <div className="flex flex-col gap-3 px-6 py-5">
        {/* Media on top */}
        {media && media.length > 0 && (
          <div
            className="flex gap-1.5 overflow-x-auto rounded-lg"
            style={{ scrollbarWidth: 'none' }}
          >
            {media.map((item, index) => (
              <div
                key={index}
                className="relative h-[160px] shrink-0 overflow-hidden rounded-lg bg-muted md:h-[220px]"
              >
                {item.type === 'image' ? (
                  <button
                    type="button"
                    className="h-full"
                    onClick={() => setExpandedImage(item.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Photo by ${memberName}`}
                      className="h-full w-auto object-cover"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl ?? item.url}
                      alt={`Video by ${memberName}`}
                      className="h-full w-auto object-cover"
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

        {/* Response text */}
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{text}</p>

        {/* Avatar + name at bottom */}
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={memberAvatarUrl ?? undefined} alt={memberName} />
            <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
              {getInitials(memberName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{memberName}</span>
        </div>
      </div>

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
            alt="Expanded"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </button>
      )}
    </div>
  )
}
