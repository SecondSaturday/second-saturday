import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { InviteQRCode } from '@/components/InviteQRCode'

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('InviteQRCode', () => {
  it('renders a canvas element', () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('applies the given size to the canvas', () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" size={256} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toHaveAttribute('width', '256')
    expect(canvas).toHaveAttribute('height', '256')
  })
})
