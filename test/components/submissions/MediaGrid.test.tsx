import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaGrid } from '@/components/submissions/MediaGrid'
import type { MediaItem } from '@/components/submissions/MediaGrid'
import type { Id } from '../../../convex/_generated/dataModel'

const makeMediaItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  _id: 'media-1' as unknown as Id<'media'>,
  type: 'image',
  url: 'https://example.com/image.jpg',
  ...overrides,
})

describe('MediaGrid', () => {
  it('renders nothing when media array is empty', () => {
    const { container } = render(<MediaGrid media={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an image for an image media item', () => {
    const media = [makeMediaItem({ url: 'https://example.com/photo.jpg' })]
    render(<MediaGrid media={media} />)

    const img = screen.getByAltText('Media 1')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders a Play icon overlay for a video media item', () => {
    const media = [
      makeMediaItem({
        _id: 'vid-1' as unknown as Id<'media'>,
        type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      }),
    ]
    const { container } = render(<MediaGrid media={media} />)

    const img = screen.getByAltText('Video 1')
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')

    // Play icon SVG should be present
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('falls back to video url as thumbnail when thumbnailUrl is absent', () => {
    const media = [
      makeMediaItem({
        _id: 'vid-2' as unknown as Id<'media'>,
        type: 'video',
        url: 'https://example.com/video.mp4',
      }),
    ]
    render(<MediaGrid media={media} />)

    const img = screen.getByAltText('Video 1')
    expect(img).toHaveAttribute('src', 'https://example.com/video.mp4')
  })

  it('calls onRemove with the correct media id when remove button is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const mediaId = 'media-abc' as unknown as Id<'media'>
    const media = [makeMediaItem({ _id: mediaId })]

    render(<MediaGrid media={media} onRemove={onRemove} />)

    // The remove button has an aria-label
    const removeButton = screen.getByRole('button', { name: /remove image 1/i })
    await user.click(removeButton)

    expect(onRemove).toHaveBeenCalledWith(mediaId)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('does not render remove buttons when onRemove is not provided', () => {
    const media = [makeMediaItem()]
    render(<MediaGrid media={media} />)

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('does not render remove buttons when disabled is true', () => {
    const onRemove = vi.fn()
    const media = [makeMediaItem()]
    render(<MediaGrid media={media} onRemove={onRemove} disabled />)

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('renders a disabled overlay when disabled is true', () => {
    const media = [makeMediaItem()]
    const { container } = render(<MediaGrid media={media} disabled />)

    // Disabled overlay has backdrop-blur class
    const overlay = container.querySelector('.backdrop-blur-\\[1px\\]')
    expect(overlay).toBeInTheDocument()
  })

  it('does not render disabled overlay when disabled is false', () => {
    const media = [makeMediaItem()]
    const { container } = render(<MediaGrid media={media} disabled={false} />)

    const overlay = container.querySelector('.backdrop-blur-\\[1px\\]')
    expect(overlay).not.toBeInTheDocument()
  })

  it('renders grid-cols-1 layout for a single media item', () => {
    const media = [makeMediaItem()]
    const { container } = render(<MediaGrid media={media} />)

    const grid = container.firstChild as HTMLElement
    expect(grid.className).toMatch(/grid-cols-1/)
  })

  it('renders grid-cols-2 layout for two media items', () => {
    const media = [
      makeMediaItem({ _id: 'm1' as unknown as Id<'media'> }),
      makeMediaItem({ _id: 'm2' as unknown as Id<'media'> }),
    ]
    const { container } = render(<MediaGrid media={media} />)

    const grid = container.firstChild as HTMLElement
    expect(grid.className).toMatch(/grid-cols-2/)
  })

  it('renders grid-cols-2 layout for three media items', () => {
    const media = [
      makeMediaItem({ _id: 'm1' as unknown as Id<'media'> }),
      makeMediaItem({ _id: 'm2' as unknown as Id<'media'> }),
      makeMediaItem({ _id: 'm3' as unknown as Id<'media'> }),
    ]
    const { container } = render(<MediaGrid media={media} />)

    const grid = container.firstChild as HTMLElement
    expect(grid.className).toMatch(/grid-cols-2/)
  })

  it('first item spans two columns when there are exactly 3 items', () => {
    const media = [
      makeMediaItem({ _id: 'm1' as unknown as Id<'media'> }),
      makeMediaItem({ _id: 'm2' as unknown as Id<'media'> }),
      makeMediaItem({ _id: 'm3' as unknown as Id<'media'> }),
    ]
    const { container } = render(<MediaGrid media={media} />)

    const items = container.querySelectorAll('.group.relative')
    expect(items[0].className).toMatch(/col-span-2/)
    expect(items[1].className).not.toMatch(/col-span-2/)
  })

  it('accepts and applies custom className to the grid', () => {
    const media = [makeMediaItem()]
    const { container } = render(<MediaGrid media={media} className="my-grid-class" />)

    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('my-grid-class')
  })
})
