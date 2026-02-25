'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ImageCropModalProps {
  imageUrl: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedArea: Area) => void
  aspect?: number
}

export function ImageCropModal({
  imageUrl,
  open,
  onClose,
  onCropComplete,
  aspect = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Photo</DialogTitle>
        </DialogHeader>
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: aspect }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Apply Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
