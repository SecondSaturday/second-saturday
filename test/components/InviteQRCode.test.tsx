import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { InviteQRCode } from '@/components/InviteQRCode'

const appendMock = vi.fn()
const constructorMock = vi.fn()

vi.mock('qr-code-styling', () => ({
  default: class {
    constructor(opts: unknown) {
      constructorMock(opts)
    }
    append(node: HTMLElement) {
      appendMock(node)
    }
  },
}))

beforeEach(() => {
  appendMock.mockClear()
  constructorMock.mockClear()
})

describe('InviteQRCode', () => {
  it('dynamically imports qr-code-styling and appends to the container', async () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" />)
    await waitFor(() => expect(appendMock).toHaveBeenCalledTimes(1))
    expect(constructorMock).toHaveBeenCalledTimes(1)
    expect(appendMock.mock.calls[0]![0]).toBe(container.querySelector('[role="img"] > div'))
  })

  it('passes variant-9 config values to QRCodeStyling', async () => {
    render(<InviteQRCode value="https://example.com/invite/abc" size={256} />)
    await waitFor(() => expect(constructorMock).toHaveBeenCalled())
    const opts = constructorMock.mock.calls[0]![0]
    expect(opts.width).toBe(256)
    expect(opts.height).toBe(256)
    expect(opts.image).toBe('/brand-logo.png')
    expect(opts.qrOptions.errorCorrectionLevel).toBe('H')
    expect(opts.imageOptions.imageSize).toBe(0.3)
    expect(opts.imageOptions.hideBackgroundDots).toBe(true)
    expect(opts.dotsOptions.type).toBe('extra-rounded')
    expect(opts.dotsOptions.color).toBe('#3a1a5f')
    expect(opts.backgroundOptions.color).toBe('transparent')
  })

  it('clamps size below 200 px up to 200', async () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" size={100} />)
    const wrapper = container.querySelector('[role="img"]') as HTMLElement
    expect(wrapper.style.width).toBe('200px')
    expect(wrapper.style.height).toBe('200px')
    await waitFor(() => expect(constructorMock).toHaveBeenCalled())
    expect(constructorMock.mock.calls[0]![0].width).toBe(200)
  })

  it('defaults to 320 px when no size is provided', async () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" />)
    const wrapper = container.querySelector('[role="img"]') as HTMLElement
    expect(wrapper.style.width).toBe('320px')
    await waitFor(() => expect(constructorMock).toHaveBeenCalled())
    expect(constructorMock.mock.calls[0]![0].width).toBe(320)
  })

  it('sets accessibility attributes on the container', () => {
    const { container } = render(<InviteQRCode value="https://example.com/invite/abc" />)
    const wrapper = container.querySelector('[role="img"]')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveAttribute('aria-label', 'Invite QR code')
  })
})
