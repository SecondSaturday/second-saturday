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

// Convert HEIC/HEIF to JPEG for cross-browser compatibility
async function convertHeicIfNeeded(file: File): Promise<File> {
  const heicTypes = ['image/heic', 'image/heif']
  const isHeic = heicTypes.includes(file.type) || /\.hei[cf]$/i.test(file.name)
  if (!isHeic) return file

  try {
    const { default: heic2any } = await import('heic2any')
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const converted = Array.isArray(result) ? result[0] : result
    if (!converted) return file
    return new File([converted], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' })
  } catch (err) {
    console.error('HEIC conversion failed:', err)
    return file
  }
}

// Compress an image file before upload
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    // Convert HEIC to JPEG first for non-Apple browser support
    const inputFile = await convertHeicIfNeeded(file)
    const compressedFile = await imageCompression(inputFile, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
    })

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
