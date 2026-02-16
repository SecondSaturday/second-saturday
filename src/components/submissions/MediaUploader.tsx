'use client'

import { useState, useRef } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { compressImage } from '@/lib/image'
import { Camera as CameraIcon, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'

interface MediaUploaderProps {
  responseId: Id<'responses'>
  onUploadComplete?: (mediaId: Id<'media'>) => void
  onUploadError?: (error: string) => void
  maxMedia?: number
  currentMediaCount?: number
  className?: string
}

type UploadStage = 'idle' | 'selecting' | 'compressing' | 'uploading' | 'error'

export function MediaUploader({
  responseId,
  onUploadComplete,
  onUploadError,
  maxMedia = 3,
  currentMediaCount = 0,
  className,
}: MediaUploaderProps) {
  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addMediaToResponse = useMutation(api.submissions.addMediaToResponse)

  const canUploadMore = currentMediaCount < maxMedia

  const resetUpload = () => {
    setStage('idle')
    setProgress(0)
    setError(null)
    setPreview(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const handleError = (message: string, err?: unknown) => {
    console.error('MediaUploader error:', message, err)
    setError(message)
    setStage('error')
    onUploadError?.(message)
  }

  const handlePhotoCapture = async (source: CameraSource) => {
    if (!canUploadMore) {
      handleError(`Maximum ${maxMedia} media items allowed per response`)
      return
    }

    try {
      setStage('selecting')
      setError(null)
      setProgress(0)

      // Request photo from camera or gallery
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      })

      if (!photo.webPath) {
        throw new Error('No photo path returned')
      }

      // Convert photo to blob/file for upload
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      const file = new File([blob], `photo-${Date.now()}.${photo.format}`, {
        type: `image/${photo.format}`,
      })

      // Show preview
      setPreview(photo.webPath)
      setProgress(10)

      await uploadPhoto(file)
    } catch (err: unknown) {
      // Handle specific permission errors
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage?.includes('User cancelled') || errorMessage?.includes('cancelled')) {
        // User cancelled, just reset
        resetUpload()
        return
      }

      if (errorMessage?.includes('permission') || errorMessage?.includes('denied')) {
        handleError(
          'Camera permission denied. Please enable camera access in your device settings.'
        )
        return
      }

      handleError('Failed to capture photo', err)
    }
  }

  const uploadPhoto = async (file: File) => {
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are supported.')
      }

      // Validate file format (JPEG or PNG)
      if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png')) {
        throw new Error('Only JPEG and PNG formats are supported')
      }

      setStage('compressing')
      setProgress(20)

      // Compress image to <200KB with max 1200px width
      const compressed = await compressImage(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })

      // Check if upload was cancelled
      if (controller.signal.aborted) {
        resetUpload()
        return
      }

      setProgress(50)
      setStage('uploading')

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl()

      if (controller.signal.aborted) {
        resetUpload()
        return
      }

      setProgress(60)

      // Upload compressed image to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': compressed.type },
        body: compressed,
        signal: controller.signal,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const { storageId } = await uploadResponse.json()

      if (controller.signal.aborted) {
        resetUpload()
        return
      }

      setProgress(80)

      // Save media record to database
      const mediaId = await addMediaToResponse({
        responseId,
        storageId,
        type: 'image',
      })

      setProgress(100)
      setStage('idle')
      setPreview(null)
      onUploadComplete?.(mediaId)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Upload was cancelled
        resetUpload()
        return
      }

      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        handleError('Network error. Please check your connection and try again.')
        return
      }

      // Handle Convex mutation errors
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage?.includes('Response can have up to 3 media items')) {
        handleError('Maximum 3 media items reached')
        return
      }

      if (errorMessage?.includes('locked submission')) {
        handleError('Cannot add media to locked submission')
        return
      }

      handleError(errorMessage || 'Upload failed', err)
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    resetUpload()
  }

  const isUploading = stage === 'selecting' || stage === 'compressing' || stage === 'uploading'
  const showProgress = isUploading && progress > 0

  return (
    <div className={cn('space-y-2', className)}>
      {/* Upload Controls */}
      {!isUploading && !error && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePhotoCapture(CameraSource.Camera)}
            disabled={!canUploadMore}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted',
              !canUploadMore && 'cursor-not-allowed opacity-50'
            )}
          >
            <CameraIcon className="size-5" />
            <span>Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handlePhotoCapture(CameraSource.Photos)}
            disabled={!canUploadMore}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted',
              !canUploadMore && 'cursor-not-allowed opacity-50'
            )}
          >
            <ImageIcon className="size-5" />
            <span>Choose Photo</span>
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {showProgress && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
          {preview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="size-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium">
                {stage === 'selecting' && 'Selecting photo...'}
                {stage === 'compressing' && 'Compressing image...'}
                {stage === 'uploading' && 'Uploading...'}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Cancel upload"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1 text-sm text-destructive">{error}</div>
            <button
              type="button"
              onClick={resetUpload}
              className="rounded-md p-1 hover:bg-destructive/20"
              aria-label="Dismiss error"
            >
              <X className="size-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={resetUpload}
            className="w-full rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Media Count Indicator */}
      {!canUploadMore && !isUploading && !error && (
        <div className="text-center text-sm text-muted-foreground">
          Maximum {maxMedia} media items reached
        </div>
      )}
    </div>
  )
}
