'use client'

import { useEffect, useRef } from 'react'

// Approximations of OKLCH tokens in src/app/globals.css (--primary, --foreground,
// --accent). qr-code-styling takes hex/RGB only, so runtime derivation from CSS vars
// isn't worth the complexity. Background is transparent so the QR blends with whatever
// container renders it; scanners need contrast between `brandDeep` modules and the
// container's actual background — if the palette shifts, re-check scan reliability.
const COLORS = {
  brand: '#8b3fd1',
  brandDeep: '#3a1a5f',
  brandLight: '#c79cf0',
}

interface InviteQRCodeProps {
  value: string
  size?: number
}

export function InviteQRCode({ value, size = 320 }: InviteQRCodeProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const renderSize = Math.max(200, size)

  useEffect(() => {
    const node = innerRef.current
    if (!node) return
    if (!value) {
      node.innerHTML = ''
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { default: QRCodeStyling } = await import('qr-code-styling')
        if (cancelled || !innerRef.current) return
        const qr = new QRCodeStyling({
          width: renderSize,
          height: renderSize,
          data: value,
          margin: 8,
          image: '/brand-logo.png',
          qrOptions: { errorCorrectionLevel: 'H' },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 6,
            imageSize: 0.3,
            hideBackgroundDots: true,
          },
          dotsOptions: { type: 'extra-rounded', color: COLORS.brandDeep },
          backgroundOptions: { color: 'transparent' },
          cornersSquareOptions: { type: 'extra-rounded', color: COLORS.brand },
          cornersDotOptions: { type: 'dot', color: COLORS.brandLight },
        })
        innerRef.current.innerHTML = ''
        qr.append(innerRef.current)
      } catch (err) {
        if (!cancelled) console.error('Failed to render QR code', err)
      }
    })()
    return () => {
      cancelled = true
      node.innerHTML = ''
    }
  }, [value, renderSize])

  return (
    <div role="img" aria-label="Invite QR code" style={{ width: renderSize, height: renderSize }}>
      <div ref={innerRef} style={{ width: renderSize, height: renderSize }} />
    </div>
  )
}
