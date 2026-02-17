'use client'

import * as React from 'react'
import { Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Progress } from './progress'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface BlockingModalProps {
  open: boolean
  title: string
  description?: string
  progress: number
  stage?: string
  onCancel?: () => void
  cancelLabel?: string
  showCancelButton?: boolean
  className?: string
}

/**
 * BlockingModal - A modal that prevents user interaction and navigation
 *
 * Features:
 * - Cannot be closed by clicking outside or pressing Escape
 * - Full-screen overlay that blocks all interaction
 * - Shows progress bar and current stage
 * - Optional cancellation with confirmation
 *
 * Usage:
 * ```tsx
 * <BlockingModal
 *   open={isUploading}
 *   title="Uploading Video"
 *   description="Please wait while your video is being uploaded"
 *   progress={uploadProgress}
 *   stage="Uploading to server..."
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function BlockingModal({
  open,
  title,
  description,
  progress,
  stage,
  onCancel,
  cancelLabel = 'Cancel Upload',
  showCancelButton = true,
  className,
}: BlockingModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)

  // Prevent closing via escape key or outside click
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing if explicitly requested via cancel button
    if (!newOpen && showCancelConfirm) {
      setShowCancelConfirm(false)
    }
  }

  const handleCancelClick = () => {
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel?.()
  }

  const handleCancelConfirmation = () => {
    setShowCancelConfirm(false)
  }

  // Reset confirmation state when modal closes
  React.useEffect(() => {
    if (!open) {
      setShowCancelConfirm(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('sm:max-w-md', className)}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {!showCancelConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                {title}
              </DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Progress value={progress} showLabel label={stage || 'Processing...'} />

              {stage && <div className="text-center text-sm text-muted-foreground">{stage}</div>}
            </div>

            {showCancelButton && onCancel && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelClick}
                  className="gap-2"
                >
                  <X className="size-4" />
                  {cancelLabel}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Cancel Upload?</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this upload? Your progress will be lost.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleCancelConfirmation}>
                Continue Upload
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                className="gap-2"
              >
                <X className="size-4" />
                Cancel Upload
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
