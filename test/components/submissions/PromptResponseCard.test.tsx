import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptResponseCard } from '@/components/submissions/PromptResponseCard'
import type { MediaItem } from '@/components/submissions/MediaGrid'
import type { Id } from '../../../convex/_generated/dataModel'

// Mock MediaUploader so tests are focused on PromptResponseCard behaviour
// and don't require Capacitor / Convex / Clerk internals.
vi.mock('@/components/submissions/MediaUploader', () => ({
  MediaUploader: ({
    onUploadComplete,
    currentMediaCount,
    maxMedia,
  }: {
    onUploadComplete?: (mediaId: Id<'media'>, type: 'image' | 'video') => void
    currentMediaCount?: number
    maxMedia?: number
  }) => (
    <div data-testid="media-uploader" data-count={currentMediaCount} data-max={maxMedia}>
      <button
        onClick={() => onUploadComplete?.('uploaded-media-id' as unknown as Id<'media'>, 'image')}
      >
        Simulate Upload
      </button>
    </div>
  ),
}))

const RESPONSE_ID = 'resp-1' as unknown as Id<'responses'>

const makeMediaItem = (id: string, type: 'image' | 'video' = 'image'): MediaItem => ({
  _id: id as unknown as Id<'media'>,
  type,
  url: `https://example.com/${id}.jpg`,
})

describe('PromptResponseCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the prompt text as a card title', () => {
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="What did you learn today?"
        responseId={RESPONSE_ID}
      />
    )

    expect(screen.getByText('What did you learn today?')).toBeInTheDocument()
  })

  it('renders a textarea with new placeholder text', () => {
    render(<PromptResponseCard promptId="p1" promptText="Prompt" responseId={RESPONSE_ID} />)

    expect(screen.getByPlaceholderText('Add text or tap + for photos...')).toBeInTheDocument()
  })

  it('renders initialValue inside the textarea', () => {
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        initialValue="Hello world"
      />
    )

    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument()
  })

  it('calls onValueChange when textarea value changes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        onValueChange={onValueChange}
      />
    )

    const textarea = screen.getByPlaceholderText('Add text or tap + for photos...')
    await user.type(textarea, 'Hi')

    expect(onValueChange).toHaveBeenCalledWith('H')
    expect(onValueChange).toHaveBeenCalledWith('Hi')
  })

  it('disables the textarea when disabled prop is true', () => {
    render(
      <PromptResponseCard promptId="p1" promptText="Prompt" responseId={RESPONSE_ID} disabled />
    )

    expect(screen.getByPlaceholderText('Add text or tap + for photos...')).toBeDisabled()
  })

  it('renders MediaGrid for existing media items', () => {
    const existingMedia = [makeMediaItem('m1'), makeMediaItem('m2')]
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        existingMedia={existingMedia}
      />
    )

    // Images from MediaGrid should be visible
    expect(screen.getByAltText('Media 1')).toBeInTheDocument()
    expect(screen.getByAltText('Media 2')).toBeInTheDocument()
  })

  it('does not render MediaGrid when existingMedia is empty', () => {
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        existingMedia={[]}
      />
    )

    expect(screen.queryByAltText('Media 1')).not.toBeInTheDocument()
  })

  it('passes currentMediaCount to MediaUploader', () => {
    const existingMedia = [makeMediaItem('m1'), makeMediaItem('m2')]
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        existingMedia={existingMedia}
      />
    )

    const uploader = screen.getByTestId('media-uploader')
    expect(uploader).toHaveAttribute('data-count', '2')
  })

  it('increments mediaCount after a successful upload', async () => {
    const user = userEvent.setup()
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        existingMedia={[]}
      />
    )

    const uploader = screen.getByTestId('media-uploader')
    expect(uploader).toHaveAttribute('data-count', '0')

    await user.click(screen.getByText('Simulate Upload'))

    expect(uploader).toHaveAttribute('data-count', '1')
  })

  it('calls onMediaUpload with mediaId and type after upload', async () => {
    const user = userEvent.setup()
    const onMediaUpload = vi.fn()
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        onMediaUpload={onMediaUpload}
      />
    )

    await user.click(screen.getByText('Simulate Upload'))

    expect(onMediaUpload).toHaveBeenCalledWith('uploaded-media-id', 'image')
  })

  it('passes maxMedia to MediaUploader', () => {
    render(
      <PromptResponseCard promptId="p1" promptText="Prompt" responseId={RESPONSE_ID} maxMedia={5} />
    )

    expect(screen.getByTestId('media-uploader')).toHaveAttribute('data-max', '5')
  })

  it('always shows MediaUploader even without responseId', () => {
    render(<PromptResponseCard promptId="p1" promptText="Prompt" />)

    // MediaUploader should always be visible now (text is optional)
    expect(screen.getByTestId('media-uploader')).toBeInTheDocument()
  })

  it('shows MediaUploader when responseId is provided', () => {
    render(<PromptResponseCard promptId="p1" promptText="Prompt" responseId={RESPONSE_ID} />)

    expect(screen.getByTestId('media-uploader')).toBeInTheDocument()
    expect(screen.queryByText(/start typing to enable photo/i)).not.toBeInTheDocument()
  })

  it('does not pass onRemove to MediaGrid when disabled', () => {
    const onMediaRemove = vi.fn()
    const existingMedia = [makeMediaItem('m1')]
    render(
      <PromptResponseCard
        promptId="p1"
        promptText="Prompt"
        responseId={RESPONSE_ID}
        existingMedia={existingMedia}
        onMediaRemove={onMediaRemove}
        disabled
      />
    )

    // MediaGrid receives disabled=true and no onRemove, so no remove button
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })
})
