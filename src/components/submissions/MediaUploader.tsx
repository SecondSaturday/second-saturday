'use client'

import { useState, useRef } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useMutation, useAction } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '../../../convex/_generated/api'
import { compressImage } from '@/lib/image'
import { Camera as CameraIcon, Image as ImageIcon, X, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import { BlockingModal } from '../ui/blocking-modal'
import { useBlockingUpload } from '@/hooks/useBlockingUpload'

interface MediaThumbnail {
  _id: Id<'media'>
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface MediaUploaderProps {
  responseId?: Id<'responses'>
  onUploadComplete?: (mediaId: Id<'media'>, type: 'image' | 'video') => void
  onUploadError?: (error: string) => void
  onEnsureResponse?: () => Promise<void>
  onMediaRemove?: (mediaId: Id<'media'>) => void
  maxMedia?: number
  currentMediaCount?: number
  existingMedia?: MediaThumbnail[]
  className?: string
}

type UploadStage = 'idle' | 'selecting' | 'compressing' | 'uploading' | 'processing' | 'error'
type MediaType = 'photo' | 'video'

export function MediaUploader({
  responseId,
  onUploadComplete,
  onUploadError,
  onEnsureResponse,
  onMediaRemove,
  maxMedia = 3,
  currentMediaCount = 0,
  existingMedia = [],
  className,
}: MediaUploaderProps) {
  const { user } = useUser()
  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<MediaType | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const videoIdRef = useRef<Id<'videos'> | null>(null)

  // Mutations and actions
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addMediaToResponse = useMutation(api.submissions.addMediaToResponse)
  const uploadVideoToMux = useAction(api.videoActions.uploadVideoToMux)

  // Video upload state
  const videoUpload = useBlockingUpload({
    onComplete: () => {
      setStage('idle')
      setPreview(null)
      setMediaType(null)
      videoIdRef.current = null
    },
    onError: (err) => handleError(err),
    onCancel: () => {
      resetUpload()
    },
  })

  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const canUploadMore = currentMediaCount < maxMedia

  const resetUpload = () => {
    setStage('idle')
    setProgress(0)
    setError(null)
    setPreview(null)
    setMediaType(null)
    videoIdRef.current = null
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (videoUpload.abortController) {
      videoUpload.reset()
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
      // Ensure response exists before starting upload
      await onEnsureResponse?.()

      setStage('selecting')
      setError(null)
      setProgress(0)
      setMediaType('photo')

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
        responseId: responseId!,
        storageId,
        type: 'image',
      })

      setProgress(100)
      setStage('idle')
      setPreview(null)
      onUploadComplete?.(mediaId, 'image')
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

  const handleVideoSelect = async () => {
    if (!canUploadMore) {
      handleError(`Maximum ${maxMedia} media items allowed per response`)
      return
    }
    // Ensure response exists before starting upload
    await onEnsureResponse?.()
    videoInputRef.current?.click()
  }

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset input so the same file can be re-selected
    if (e.target) e.target.value = ''
    if (!file) return

    try {
      setStage('selecting')
      setError(null)
      setProgress(0)
      setMediaType('video')
      videoUpload.setStage('selecting')
      videoUpload.setProgress(10)

      // Show preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      videoUpload.setProgress(20)

      await uploadVideo(file)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage?.includes('User cancelled') || errorMessage?.includes('cancelled')) {
        videoUpload.reset()
        resetUpload()
        return
      }
      handleError('Failed to select video', err)
    }
  }

  const uploadVideo = async (file: File) => {
    const controller = videoUpload.createAbortController()

    try {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Invalid file type. Only videos are supported.')
      }

      // Validate file format (MP4 or MOV)
      if (
        !file.type.includes('mp4') &&
        !file.type.includes('quicktime') &&
        !file.type.includes('mov')
      ) {
        throw new Error('Only MP4 and MOV formats are supported')
      }

      // Check file size (suggest < 100MB for better UX)
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > 500) {
        throw new Error('Video file is too large. Please choose a video under 500MB.')
      }

      if (fileSizeMB > 100) {
        console.warn('Large video file detected:', fileSizeMB.toFixed(2), 'MB')
      }

      videoUpload.setStage('uploading')
      videoUpload.setProgress(30)
      setStage('uploading')
      setProgress(30)

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('You must be signed in to upload videos')
      }

      // Get upload URL from Mux
      const { uploadUrl, videoId } = await uploadVideoToMux({
        title: `Video ${Date.now()}`,
      })

      videoIdRef.current = videoId

      if (controller?.signal.aborted) {
        videoUpload.reset()
        resetUpload()
        return
      }

      videoUpload.setProgress(40)
      setProgress(40)

      // Upload video to Mux
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        signal: controller?.signal,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Video upload failed: ${uploadResponse.statusText}`)
      }

      if (controller?.signal.aborted) {
        videoUpload.reset()
        resetUpload()
        return
      }

      videoUpload.setProgress(80)
      setProgress(80)

      // Save media record to database
      // Note: muxAssetId will be updated via webhook when Mux processes the video
      // For now, we store the uploadId to track the video
      const mediaId = await addMediaToResponse({
        responseId: responseId!,
        type: 'video',
        // Asset ID will be updated via Mux webhook when video is processed
      })

      videoUpload.setProgress(100)
      videoUpload.setStage('complete')
      setProgress(100)
      setStage('idle')
      onUploadComplete?.(mediaId, 'video')

      // Note: Video processing continues on Mux servers
      // Thumbnail and playback will be available after processing completes
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Upload was cancelled
        videoUpload.reset()
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

      handleError(errorMessage || 'Video upload failed', err)
    }
  }

  const handleCancel = () => {
    if (mediaType === 'video') {
      videoUpload.cancel()
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    resetUpload()
  }

  const isUploading =
    stage === 'selecting' ||
    stage === 'compressing' ||
    stage === 'uploading' ||
    stage === 'processing'
  const showProgress = isUploading && progress > 0 && mediaType === 'photo'
  const showBlockingModal = isUploading && mediaType === 'video'

  const [menuOpen, setMenuOpen] = useState(false)

  const MAX_VISIBLE_THUMBS = 3

  return (
    <div className={cn('flex items-end gap-2', className)}>
      {/* Upload Controls — vertical expand + thumbnails row */}
      {!isUploading && !error && (
        <>
          <div className="flex flex-col items-center gap-1.5">
            {/* Expanded options (above the + button) */}
            <div
              className={cn(
                'flex flex-col items-center gap-1.5 overflow-hidden transition-all duration-200',
                menuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  handlePhotoCapture(CameraSource.Camera)
                }}
                className="flex size-12 items-center justify-center rounded-lg border border-border/60 bg-card transition-colors hover:bg-muted/50"
                aria-label="Take photo"
              >
                <CameraIcon className="size-6 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  handlePhotoCapture(CameraSource.Photos)
                }}
                className="flex size-12 items-center justify-center rounded-lg border border-border/60 bg-card transition-colors hover:bg-muted/50"
                aria-label="Choose photo"
              >
                <ImageIcon className="size-6 text-primary" />
              </button>
            </div>

            {/* Main + / X button */}
            <button
              type="button"
              onClick={() => {
                if (!canUploadMore && !menuOpen) return
                setMenuOpen(!menuOpen)
              }}
              className={cn(
                'flex size-14 items-center justify-center rounded-lg transition-all duration-200',
                menuOpen
                  ? 'border-2 border-primary bg-muted hover:bg-muted/80'
                  : 'bg-muted/60 hover:bg-muted',
                !canUploadMore && !menuOpen && 'opacity-30'
              )}
              aria-label={menuOpen ? 'Close media menu' : 'Add media'}
            >
              <div
                className="transition-transform duration-200"
                style={{ transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                <Plus className="size-7 text-muted-foreground" />
              </div>
            </button>

            {/* Limit reached label */}
            {!canUploadMore && !menuOpen && (
              <span className="text-[10px] text-muted-foreground">Media limit reached</span>
            )}
          </div>

          {/* Thumbnails row beside the + button */}
          {existingMedia.length > 0 && (
            <div className="flex items-end gap-1.5">
              {existingMedia.slice(0, MAX_VISIBLE_THUMBS).map((media) => (
                <div key={media._id} className="group relative size-14 rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.thumbnailUrl ?? media.url}
                    alt="Media"
                    className="size-full rounded-lg object-cover"
                  />
                  {onMediaRemove && (
                    <button
                      type="button"
                      onClick={() => onMediaRemove(media._id)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                      aria-label="Remove media"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
              {existingMedia.length > MAX_VISIBLE_THUMBS && (
                <span className="text-xs text-muted-foreground">
                  +{existingMedia.length - MAX_VISIBLE_THUMBS}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Hidden video input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-m4v"
        className="hidden"
        onChange={handleVideoFileChange}
      />

      {/* Uploading indicator (inline, compact) */}
      {isUploading && (
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            {stage === 'selecting' && 'Selecting...'}
            {stage === 'compressing' && 'Compressing...'}
            {stage === 'uploading' && 'Uploading...'}
            {stage === 'processing' && 'Processing...'}
          </span>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded p-0.5 hover:bg-muted"
            aria-label="Cancel upload"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Error (inline) */}
      {error && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-destructive">{error}</span>
          <button
            type="button"
            onClick={resetUpload}
            className="text-xs font-medium text-foreground underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Blocking Modal for Video Upload */}
      <BlockingModal
        open={showBlockingModal}
        title="Uploading Video"
        description="Please wait while your video is being uploaded and processed. Do not close this window."
        progress={videoUpload.progress}
        stage={
          videoUpload.stage === 'selecting'
            ? 'Selecting video...'
            : videoUpload.stage === 'uploading'
              ? 'Uploading to server...'
              : videoUpload.stage === 'processing'
                ? 'Processing video...'
                : 'Uploading...'
        }
        onCancel={handleCancel}
        showCancelButton={videoUpload.stage !== 'processing'}
      />
    </div>
  )
}
