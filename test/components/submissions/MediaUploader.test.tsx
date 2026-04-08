import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaUploader } from '@/components/submissions/MediaUploader'
import type { Id } from '../../../convex/_generated/dataModel'

// Mock Capacitor Camera
vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn(),
  },
  CameraResultType: { Uri: 'uri', Base64: 'base64', DataUrl: 'dataUrl' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS', Prompt: 'PROMPT' },
}))

// Mock Capacitor FilePicker
vi.mock('@capawesome/capacitor-file-picker', () => ({
  FilePicker: { pickMedia: vi.fn() },
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
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

// Mock video thumbnail extraction
vi.mock('@/lib/video', () => ({
  extractVideoThumbnail: vi.fn(() => Promise.resolve(null)),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// Mock useBlockingUpload hook
vi.mock('@/hooks/useBlockingUpload', () => ({
  useBlockingUpload: () => ({
    stage: 'idle',
    progress: 0,
    setStage: vi.fn(),
    setProgress: vi.fn(),
    reset: vi.fn(),
    cancel: vi.fn(),
  }),
}))

// Mock blocking modal
vi.mock('@/components/ui/blocking-modal', () => ({
  BlockingModal: () => null,
}))

describe('MediaUploader', () => {
  const RESPONSE_ID = 'test-response-id' as unknown as Id<'responses'>
  const defaultProps = {
    responseId: RESPONSE_ID,
    currentMediaCount: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add media button', () => {
    render(<MediaUploader {...defaultProps} />)
    expect(screen.getByLabelText('Add media')).toBeInTheDocument()
  })

  it('opens menu options when plus button is clicked', async () => {
    const user = userEvent.setup()
    render(<MediaUploader {...defaultProps} />)

    await user.click(screen.getByLabelText('Add media'))

    expect(screen.getByLabelText('Take photo')).toBeInTheDocument()
    expect(screen.getByLabelText('Choose from gallery')).toBeInTheDocument()
  })

  it('closes menu when plus button is clicked again', async () => {
    const user = userEvent.setup()
    render(<MediaUploader {...defaultProps} />)

    // Open
    await user.click(screen.getByLabelText('Add media'))
    expect(screen.getByLabelText('Close media menu')).toBeInTheDocument()

    // Close
    await user.click(screen.getByLabelText('Close media menu'))
    expect(screen.getByLabelText('Add media')).toBeInTheDocument()
  })

  it('disables plus button when max media count reached', () => {
    render(<MediaUploader {...defaultProps} currentMediaCount={3} maxMedia={3} />)
    expect(screen.getByText('Media limit reached')).toBeInTheDocument()
  })

  it('shows thumbnails for existing media', () => {
    const existingMedia = [
      {
        _id: 'm1' as unknown as Id<'media'>,
        type: 'image' as const,
        url: 'https://example.com/1.jpg',
      },
      {
        _id: 'm2' as unknown as Id<'media'>,
        type: 'image' as const,
        url: 'https://example.com/2.jpg',
      },
    ]
    render(<MediaUploader {...defaultProps} existingMedia={existingMedia} />)
    const images = screen.getAllByAltText('Media')
    expect(images).toHaveLength(2)
  })

  it('shows remove button on thumbnails when onMediaRemove is provided', () => {
    const existingMedia = [
      {
        _id: 'm1' as unknown as Id<'media'>,
        type: 'image' as const,
        url: 'https://example.com/1.jpg',
      },
    ]
    render(
      <MediaUploader {...defaultProps} existingMedia={existingMedia} onMediaRemove={vi.fn()} />
    )
    expect(screen.getByLabelText('Remove media')).toBeInTheDocument()
  })

  it('calls onMediaRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    const onMediaRemove = vi.fn()
    const mediaId = 'm1' as unknown as Id<'media'>
    const existingMedia = [
      { _id: mediaId, type: 'image' as const, url: 'https://example.com/1.jpg' },
    ]
    render(
      <MediaUploader
        {...defaultProps}
        existingMedia={existingMedia}
        onMediaRemove={onMediaRemove}
      />
    )

    await user.click(screen.getByLabelText('Remove media'))
    expect(onMediaRemove).toHaveBeenCalledWith(mediaId)
  })

  it('renders without responseId', () => {
    render(<MediaUploader currentMediaCount={0} />)
    expect(screen.getByLabelText('Add media')).toBeInTheDocument()
  })

  it('limits visible thumbnails to 3', () => {
    const existingMedia = Array.from({ length: 5 }, (_, i) => ({
      _id: `m${i}` as unknown as Id<'media'>,
      type: 'image' as const,
      url: `https://example.com/${i}.jpg`,
    }))
    render(<MediaUploader {...defaultProps} existingMedia={existingMedia} />)
    const images = screen.getAllByAltText('Media')
    expect(images).toHaveLength(3)
  })

  it('does not show remove buttons when onMediaRemove is not provided', () => {
    const existingMedia = [
      {
        _id: 'm1' as unknown as Id<'media'>,
        type: 'image' as const,
        url: 'https://example.com/1.jpg',
      },
    ]
    render(<MediaUploader {...defaultProps} existingMedia={existingMedia} />)
    expect(screen.queryByLabelText('Remove media')).not.toBeInTheDocument()
  })
})
