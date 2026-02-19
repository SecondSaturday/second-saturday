'use client'

import { useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { compressImage, cropImage } from '@/lib/image'
import type { PixelCrop } from '@/lib/image'
import { ImageCropModal } from './ImageCropModal'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Area } from 'react-easy-crop'

interface ImageUploadProps {
  shape?: 'circle' | 'rectangle'
  label: string
  onUpload: (storageId: Id<'_storage'>) => void
  previewUrl?: string | null
  className?: string
  enableCrop?: boolean
}

export function ImageUpload({
  shape = 'circle',
  label,
  onUpload,
  previewUrl,
  className,
  enableCrop = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropUrl, setCropUrl] = useState<string | null>(null)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
      })

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (enableCrop) {
      const url = URL.createObjectURL(file)
      setCropFile(file)
      setCropUrl(url)
    } else {
      setPreview(URL.createObjectURL(file))
      await uploadFile(file)
    }

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleCropComplete = async (croppedArea: Area) => {
    if (!cropFile) return

    const pixelCrop: PixelCrop = {
      x: croppedArea.x,
      y: croppedArea.y,
      width: croppedArea.width,
      height: croppedArea.height,
    }

    const cropped = await cropImage(cropFile, pixelCrop)
    setPreview(URL.createObjectURL(cropped))

    // Clean up crop state
    if (cropUrl) URL.revokeObjectURL(cropUrl)
    setCropFile(null)
    setCropUrl(null)

    await uploadFile(cropped)
  }

  const handleCropClose = () => {
    if (cropUrl) URL.revokeObjectURL(cropUrl)
    setCropFile(null)
    setCropUrl(null)
  }

  const isCircle = shape === 'circle'

  return (
    <>
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

      {cropUrl && (
        <ImageCropModal
          imageUrl={cropUrl}
          open={!!cropUrl}
          onClose={handleCropClose}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  )
}
