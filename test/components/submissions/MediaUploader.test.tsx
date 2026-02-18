import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaUploader } from '@/components/submissions/MediaUploader'
import type { Id } from '../../../convex/_generated/dataModel'

// Mock Capacitor Camera
const mockGetPhoto = vi.fn()
vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: (...args: unknown[]) => mockGetPhoto(...args),
  },
  CameraResultType: {
    Uri: 'uri',
    Base64: 'base64',
    DataUrl: 'dataUrl',
  },
  CameraSource: {
    Camera: 'CAMERA',
    Photos: 'PHOTOS',
    Prompt: 'PROMPT',
  },
}))

// Mock Convex mutations and actions
const mockGenerateUploadUrl = vi.fn()
const mockAddMediaToResponse = vi.fn()
const mockUploadVideoToMux = vi.fn()
let mutationCallCount = 0
vi.mock('convex/react', () => ({
  useMutation: vi.fn(() => {
    // First call is generateUploadUrl, second is addMediaToResponse
    const count = mutationCallCount++
    if (count === 0) return mockGenerateUploadUrl
    if (count === 1) return mockAddMediaToResponse
    return vi.fn()
  }),
  useAction: vi.fn(() => mockUploadVideoToMux),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}))

// Mock image compression
vi.mock('@/lib/image', () => ({
  compressImage: vi.fn((file: File) =>
    Promise.resolve(new File([file], file.name, { type: file.type }))
  ),
}))

// Mock fetch
global.fetch = vi.fn()

describe('MediaUploader', () => {
  const defaultProps = {
    responseId: 'test-response-id' as unknown as Id<'responses'>,
    currentMediaCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutationCallCount = 0
  })

  it('renders camera and gallery buttons', () => {
    render(<MediaUploader {...defaultProps} />)

    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /choose photo/i })).toBeInTheDocument()
  })

  it('disables buttons when max media count reached', () => {
    render(<MediaUploader {...defaultProps} currentMediaCount={3} maxMedia={3} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    const galleryButton = screen.getByRole('button', { name: /choose photo/i })

    expect(cameraButton).toBeDisabled()
    expect(galleryButton).toBeDisabled()
    expect(screen.getByText(/maximum 3 media items reached/i)).toBeInTheDocument()
  })

  it('handles camera capture successfully', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ storageId: 'test-storage-id' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')
    mockAddMediaToResponse.mockResolvedValue('test-media-id')

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(mockGetPhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'CAMERA',
        })
      )
    })

    await waitFor(() => {
      expect(mockAddMediaToResponse).toHaveBeenCalledWith({
        responseId: 'test-response-id',
        storageId: 'test-storage-id',
        type: 'image',
      })
    })
  })

  it('handles gallery selection successfully', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'png',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ storageId: 'test-storage-id' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')
    mockAddMediaToResponse.mockResolvedValue('test-media-id')

    render(<MediaUploader {...defaultProps} />)

    const galleryButton = screen.getByRole('button', { name: /choose photo/i })
    await user.click(galleryButton)

    await waitFor(() => {
      expect(mockGetPhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'PHOTOS',
        })
      )
    })

    await waitFor(() => {
      expect(mockAddMediaToResponse).toHaveBeenCalledWith({
        responseId: 'test-response-id',
        storageId: 'test-storage-id',
        type: 'image',
      })
    })
  })

  it('handles user cancellation gracefully', async () => {
    const user = userEvent.setup()

    mockGetPhoto.mockRejectedValue(new Error('User cancelled photos app'))

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(mockGetPhoto).toHaveBeenCalled()
    })

    // Should not show error for user cancellation
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
    expect(mockAddMediaToResponse).not.toHaveBeenCalled()
  })

  it('handles permission denial', async () => {
    const user = userEvent.setup()

    mockGetPhoto.mockRejectedValue(new Error('Camera permission denied'))

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(
        screen.getByText(/camera permission denied.*enable camera access/i)
      ).toBeInTheDocument()
    })

    expect(mockAddMediaToResponse).not.toHaveBeenCalled()
  })

  it('handles upload failure', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })

    expect(mockAddMediaToResponse).not.toHaveBeenCalled()
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.reject(new TypeError('Failed to fetch'))
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(screen.getByText(/network error.*check your connection/i)).toBeInTheDocument()
    })

    expect(mockAddMediaToResponse).not.toHaveBeenCalled()
  })

  it('allows canceling upload in progress', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })

    // Create a promise that never resolves to simulate slow upload
    let uploadResolve: ((value: unknown) => void) | undefined
    const uploadPromise = new Promise((resolve) => {
      uploadResolve = resolve
    })

    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return uploadPromise
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    // Wait for upload to start
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel upload/i })
    await user.click(cancelButton)

    // Should reset to initial state
    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    })

    // Clean up
    uploadResolve?.({
      ok: true,
      json: () => Promise.resolve({ storageId: 'test-storage-id' }),
    })
  })

  it('shows progress during upload stages', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ storageId: 'test-storage-id' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')
    mockAddMediaToResponse.mockResolvedValue('test-media-id')

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    // Should show compressing stage
    await waitFor(() => {
      const text = screen.queryByText(/compressing image/i)
      if (text) {
        expect(text).toBeInTheDocument()
      }
    })
  })

  it('calls onUploadComplete callback on success', async () => {
    const user = userEvent.setup()
    const onUploadComplete = vi.fn()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ storageId: 'test-storage-id' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')
    mockAddMediaToResponse.mockResolvedValue('test-media-id')

    render(<MediaUploader {...defaultProps} onUploadComplete={onUploadComplete} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith('test-media-id', 'image')
    })
  })

  it('calls onUploadError callback on failure', async () => {
    const user = userEvent.setup()
    const onUploadError = vi.fn()

    mockGetPhoto.mockRejectedValue(new Error('Camera permission denied'))

    render(<MediaUploader {...defaultProps} onUploadError={onUploadError} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(expect.stringContaining('permission denied'))
    })
  })

  it('handles max media limit from Convex', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
    const mockWebPath = 'blob:test-url'

    mockGetPhoto.mockResolvedValue({
      webPath: mockWebPath,
      format: 'jpeg',
    })
    vi.mocked(global.fetch).mockImplementation((url: string) => {
      if (url === mockWebPath) {
        return Promise.resolve({
          blob: () => Promise.resolve(mockBlob),
        })
      }
      if (url === 'https://upload.url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ storageId: 'test-storage-id' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    mockGenerateUploadUrl.mockResolvedValue('https://upload.url')
    mockAddMediaToResponse.mockRejectedValue(new Error('Response can have up to 3 media items'))

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(screen.getByText(/maximum 3 media items reached/i)).toBeInTheDocument()
    })
  })

  it('dismisses error message when clicking try again', async () => {
    const user = userEvent.setup()

    mockGetPhoto.mockRejectedValue(new Error('Camera permission denied'))

    render(<MediaUploader {...defaultProps} />)

    const cameraButton = screen.getByRole('button', { name: /take photo/i })
    await user.click(cameraButton)

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
    })

    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    await user.click(tryAgainButton)

    await waitFor(() => {
      expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    })
  })
})
