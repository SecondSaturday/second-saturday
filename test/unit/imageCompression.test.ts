import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage } from '@/lib/image'
import imageCompression from 'browser-image-compression'

// Mock browser-image-compression
vi.mock('browser-image-compression')

const mockImageCompression = vi.mocked(imageCompression)

describe('Image Compression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console.log/error mocks
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('compresses image with specified options', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockCompressedFile = new File(['compressed'], 'test.jpg', { type: 'image/jpeg' })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    const result = await compressImage(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
    })

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    })
    expect(result).toBe(mockCompressedFile)
  })

  it('uses default options when not specified', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockCompressedFile = new File(['compressed'], 'test.jpg', { type: 'image/jpeg' })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    await compressImage(mockFile)

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })
  })

  it('merges custom options with defaults', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockCompressedFile = new File(['compressed'], 'test.jpg', { type: 'image/jpeg' })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    await compressImage(mockFile, {
      maxSizeMB: 0.5,
    })

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })
  })

  it('returns original file on compression failure', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    mockImageCompression.mockRejectedValue(new Error('Compression failed'))

    const result = await compressImage(mockFile)

    expect(result).toBe(mockFile)
    expect(console.error).toHaveBeenCalledWith('Image compression failed:', expect.any(Error))
  })

  it('logs compression results', async () => {
    const mockFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'test.jpg', {
      type: 'image/jpeg',
    })
    const mockCompressedFile = new File([new ArrayBuffer(200 * 1024)], 'test.jpg', {
      type: 'image/jpeg',
    })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    await compressImage(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
    })

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Image compressed:'))
  })

  it('works with PNG format', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    const mockCompressedFile = new File(['compressed'], 'test.png', { type: 'image/png' })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    const result = await compressImage(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
    })

    expect(result).toBe(mockCompressedFile)
  })

  it('passes useWebWorker option correctly', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockCompressedFile = new File(['compressed'], 'test.jpg', { type: 'image/jpeg' })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    await compressImage(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
      useWebWorker: false,
    })

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
      useWebWorker: false,
    })
  })

  it('achieves target compression size for MediaUploader use case', async () => {
    // Simulate a 2MB image being compressed to 200KB
    const mockFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'photo.jpg', {
      type: 'image/jpeg',
    })
    const mockCompressedFile = new File([new ArrayBuffer(200 * 1024)], 'photo.jpg', {
      type: 'image/jpeg',
    })

    mockImageCompression.mockResolvedValue(mockCompressedFile)

    const result = await compressImage(mockFile, {
      maxSizeMB: 0.2, // 200KB
      maxWidthOrHeight: 1200,
    })

    expect(result.size).toBeLessThanOrEqual(0.2 * 1024 * 1024) // 200KB
    expect(imageCompression).toHaveBeenCalledWith(
      mockFile,
      expect.objectContaining({
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
      })
    )
  })
})
