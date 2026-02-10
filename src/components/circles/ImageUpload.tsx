'use client'

import { useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { compressImage } from '@/lib/image'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'

interface ImageUploadProps {
  shape?: 'circle' | 'rectangle'
  label: string
  onUpload: (storageId: Id<'_storage'>) => void
  previewUrl?: string | null
  className?: string
}

export function ImageUpload({
  shape = 'circle',
  label,
  onUpload,
  previewUrl,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Show preview immediately
      setPreview(URL.createObjectURL(file))

      // Compress
      const compressed = await compressImage(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
      })

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': compressed.type },
        body: compressed,
      })
      const { storageId } = await result.json()
      onUpload(storageId)
    } catch (err) {
      console.error('Upload failed:', err)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const isCircle = shape === 'circle'

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted',
        isCircle ? 'size-24 rounded-full' : 'aspect-[3/1] w-full rounded-xl',
        uploading && 'opacity-60',
        className
      )}
    >
      {preview ? (
        <Image src={preview} alt={label} fill unoptimized className="object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Camera className="size-5" />
          <span className="text-xs">{label}</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </button>
  )
}
