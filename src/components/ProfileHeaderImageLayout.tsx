'use client'

import { useRef } from 'react'
import { Pencil, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ProfileHeaderImageLayoutProps {
  coverImageUrl?: string | null
  iconUrl?: string | null
  onCoverUpload?: (file: File) => void
  onIconUpload?: (file: File) => void
  editable?: boolean
  className?: string
  centered?: boolean
  fallbackInitial?: string
}

export function ProfileHeaderImageLayout({
  coverImageUrl,
  iconUrl,
  onCoverUpload,
  onIconUpload,
  editable = false,
  className,
  fallbackInitial,
}: ProfileHeaderImageLayoutProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCoverUpload?.(file)
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onIconUpload?.(file)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Cover image */}
      <div className="relative mx-4 mt-4 h-[150px] overflow-hidden rounded-2xl bg-muted md:mx-8 md:mt-6 md:h-[180px]">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="Cover" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Camera className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {editable && (
          <>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              aria-label="Edit cover image"
              className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
            >
              <Pencil className="size-4 text-foreground" />
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </>
        )}
      </div>

      {/* Circle icon overlapping cover bottom edge */}
      <div className="relative -mt-[30px] flex justify-center">
        <div className="relative">
          <Avatar className="!size-[100px] border-4 border-background">
            <AvatarImage src={iconUrl ?? undefined} alt="Circle icon" />
            <AvatarFallback>
              {fallbackInitial ? (
                <span className="text-2xl font-semibold text-muted-foreground">
                  {fallbackInitial}
                </span>
              ) : (
                <Camera className="size-6 text-muted-foreground/40" />
              )}
            </AvatarFallback>
          </Avatar>

          {editable && (
            <>
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                aria-label="Edit circle icon"
                className="absolute -bottom-1 -right-1 rounded-full bg-background/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
              >
                <Pencil className="size-3.5 text-foreground" />
              </button>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
