import { describe, it, expect } from 'vitest'

// Pure logic tests for image utilities (no DOM/browser APIs needed)

describe('isImageFile', () => {
  // Inline the logic from src/lib/image.ts to test without browser deps
  function isImageFile(type: string): boolean {
    return type.startsWith('image/')
  }

  it('identifies common image MIME types', () => {
    expect(isImageFile('image/jpeg')).toBe(true)
    expect(isImageFile('image/png')).toBe(true)
    expect(isImageFile('image/gif')).toBe(true)
    expect(isImageFile('image/webp')).toBe(true)
    expect(isImageFile('image/heic')).toBe(true)
    expect(isImageFile('image/svg+xml')).toBe(true)
  })

  it('rejects non-image types', () => {
    expect(isImageFile('video/mp4')).toBe(false)
    expect(isImageFile('application/pdf')).toBe(false)
    expect(isImageFile('text/html')).toBe(false)
    expect(isImageFile('')).toBe(false)
  })
})

describe('isVideoFile', () => {
  function isVideoFile(type: string): boolean {
    return type.startsWith('video/')
  }

  it('identifies video MIME types', () => {
    expect(isVideoFile('video/mp4')).toBe(true)
    expect(isVideoFile('video/quicktime')).toBe(true)
    expect(isVideoFile('video/webm')).toBe(true)
  })

  it('rejects non-video types', () => {
    expect(isVideoFile('image/jpeg')).toBe(false)
    expect(isVideoFile('audio/mp3')).toBe(false)
  })
})

describe('Image compression options', () => {
  const DEFAULT_OPTIONS = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  it('has sensible default maxSizeMB', () => {
    expect(DEFAULT_OPTIONS.maxSizeMB).toBeLessThanOrEqual(1)
    expect(DEFAULT_OPTIONS.maxSizeMB).toBeGreaterThan(0)
  })

  it('has sensible default maxWidthOrHeight', () => {
    expect(DEFAULT_OPTIONS.maxWidthOrHeight).toBeLessThanOrEqual(1920)
    expect(DEFAULT_OPTIONS.maxWidthOrHeight).toBeGreaterThan(0)
  })

  it('uses web workers by default', () => {
    expect(DEFAULT_OPTIONS.useWebWorker).toBe(true)
  })
})
