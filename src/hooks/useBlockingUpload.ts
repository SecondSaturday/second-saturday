'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type UploadStage =
  | 'idle'
  | 'selecting'
  | 'compressing'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error'

export interface UseBlockingUploadOptions {
  onComplete?: () => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export interface UseBlockingUploadReturn {
  // State
  stage: UploadStage
  progress: number
  error: string | null
  isBlocking: boolean

  // Actions
  setStage: (stage: UploadStage) => void
  setProgress: (progress: number) => void
  setError: (error: string | null) => void
  reset: () => void
  cancel: () => void

  // AbortController
  abortController: AbortController | null
  createAbortController: () => AbortController
}

/**
 * useBlockingUpload - Hook for managing blocking upload state
 *
 * Features:
 * - Tracks upload stage and progress
 * - Prevents page navigation during upload
 * - Provides AbortController for cancellation
 * - Handles cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const upload = useBlockingUpload({
 *   onComplete: () => console.log('Upload complete'),
 *   onError: (err) => console.error(err),
 * })
 *
 * const handleUpload = async () => {
 *   const controller = upload.createAbortController()
 *   upload.setStage('uploading')
 *   upload.setProgress(0)
 *   // ... upload logic
 * }
 * ```
 */
export function useBlockingUpload(options: UseBlockingUploadOptions = {}): UseBlockingUploadReturn {
  const { onComplete, onError, onCancel } = options

  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // State copy of the controller so it can be safely returned during render
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  // Ref for synchronous access inside callbacks without triggering re-render
  const abortControllerRef = useRef<AbortController | null>(null)

  // Determine if we should block navigation
  const isBlocking =
    stage === 'selecting' ||
    stage === 'compressing' ||
    stage === 'uploading' ||
    stage === 'processing'

  // Prevent navigation during upload
  useEffect(() => {
    if (!isBlocking) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Chrome requires returnValue to be set
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isBlocking])

  // Create a new AbortController for the upload
  const createAbortController = useCallback(() => {
    // Cancel any existing controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setAbortController(controller)
    return controller
  }, [])

  // Cancel the current upload
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setAbortController(null)
    setStage('idle')
    setProgress(0)
    setError(null)
    onCancel?.()
  }, [onCancel])

  // Reset upload state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setAbortController(null)
    setStage('idle')
    setProgress(0)
    setError(null)
  }, [])

  // Handle stage changes
  useEffect(() => {
    if (stage === 'complete') {
      onComplete?.()
      // Auto-reset after completion
      const timer = setTimeout(() => {
        reset()
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (stage === 'error' && error) {
      onError?.(error)
    }
  }, [stage, error, onComplete, onError, reset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    stage,
    progress,
    error,
    isBlocking,

    // Actions
    setStage,
    setProgress,
    setError,
    reset,
    cancel,

    // AbortController
    abortController,
    createAbortController,
  }
}
