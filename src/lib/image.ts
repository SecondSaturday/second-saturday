'use client'

import imageCompression from 'browser-image-compression'

export interface CompressImageOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
}

const DEFAULT_OPTIONS: CompressImageOptions = {
  maxSizeMB: 1, // Max 1MB
  maxWidthOrHeight: 1920, // Max 1920px on longest side
  useWebWorker: true,
}

// Compress an image file before upload
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
    })

    console.log(
      `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    )

    return compressedFile
  } catch (err) {
    console.error('Image compression failed:', err)
    // Return original file if compression fails
    return file
  }
}

export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

// Apply a pixel crop to an image file using canvas
export async function cropImage(file: File, crop: PixelCrop): Promise<File> {
  const img = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(new File([blob!], file.name, { type: file.type || 'image/jpeg' }))
      },
      file.type || 'image/jpeg',
      0.92
    )
  })
}

// Check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// Check if file is a video
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

// Get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// Generate a thumbnail preview URL
export function createThumbnailUrl(file: File): string {
  return URL.createObjectURL(file)
}

// Clean up a thumbnail URL when done
export function revokeThumbnailUrl(url: string): void {
  URL.revokeObjectURL(url)
}
