import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { VideoThumbnail } from '@/components/submissions/VideoThumbnail'
import type { Id } from '../../../convex/_generated/dataModel'

// Mock Convex
const mockUseQuery = vi.fn()
vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

describe('VideoThumbnail', () => {
  const videoId = 'video-123' as Id<'videos'>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when video is undefined', () => {
    mockUseQuery.mockReturnValue(undefined)

    const { container } = render(<VideoThumbnail videoId={videoId} />)

    const loader = container.querySelector('.animate-spin')
    expect(loader).toBeInTheDocument()
  })

  it('shows "video not found" when video is null', () => {
    mockUseQuery.mockReturnValue(null)

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('Video not found')).toBeInTheDocument()
  })

  it('shows uploading state when video status is uploading', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'uploading',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('Uploading video...')).toBeInTheDocument()
    expect(screen.getByText('This may take a few minutes')).toBeInTheDocument()
  })

  it('shows processing state when video has no playbackId', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'processing',
      uploadId: 'upload-123',
      assetId: 'asset-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('Processing video...')).toBeInTheDocument()
    expect(screen.getByText('This may take a few minutes')).toBeInTheDocument()
  })

  it('shows error state when video processing failed', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'error',
      error: 'Processing failed',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('Video processing failed')).toBeInTheDocument()
    expect(screen.getByText('Processing failed')).toBeInTheDocument()
  })

  it('calls onError when video has error status', () => {
    const onError = vi.fn()
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'error',
      error: 'Test error',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} onError={onError} />)

    expect(onError).toHaveBeenCalledWith('Test error')
  })

  it('displays thumbnail when video is ready', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      uploadId: 'upload-123',
      assetId: 'asset-123',
      playbackId: 'playback-123',
      userId: 'user-1',
      title: 'Test Video',
      duration: 120,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    const thumbnail = screen.getByAltText('Test Video')
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute(
      'src',
      expect.stringContaining('https://image.mux.com/playback-123/thumbnail.jpg')
    )
  })

  it('shows play icon overlay on ready video', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const { container } = render(<VideoThumbnail videoId={videoId} />)

    // Play icon should be in the overlay
    const playIcon = container.querySelector('.size-8')
    expect(playIcon).toBeInTheDocument()
  })

  it('displays duration badge when duration is available', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      duration: 125, // 2:05
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('formats duration correctly for hours', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      duration: 3665, // 1:01:05
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('1:01:05')).toBeInTheDocument()
  })

  it('formats duration with leading zeros', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      duration: 65, // 1:05
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByText('1:05')).toBeInTheDocument()
  })

  it('shows fallback when thumbnail fails to load', async () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const { container } = render(<VideoThumbnail videoId={videoId} />)

    const thumbnail = container.querySelector('img') as HTMLImageElement
    expect(thumbnail).toBeTruthy()

    // Trigger error event using fireEvent
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.error(thumbnail)

    await waitFor(() => {
      expect(screen.getByText('Failed to load thumbnail')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const { container } = render(<VideoThumbnail videoId={videoId} className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses video title as alt text when available', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      title: 'My Awesome Video',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByAltText('My Awesome Video')).toBeInTheDocument()
  })

  it('uses default alt text when title not available', () => {
    mockUseQuery.mockReturnValue({
      _id: videoId,
      status: 'ready',
      playbackId: 'playback-123',
      uploadId: 'upload-123',
      userId: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<VideoThumbnail videoId={videoId} />)

    expect(screen.getByAltText('Video thumbnail')).toBeInTheDocument()
  })
})
