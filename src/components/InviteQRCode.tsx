'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface InviteQRCodeProps {
  value: string
  size?: number
}

export function InviteQRCode({ value, size = 192 }: InviteQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    let cancelled = false
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 4,
      errorCorrectionLevel: 'M',
    }).catch((err) => {
      if (cancelled) return
      console.error('Failed to render QR code', err)
    })
    return () => {
      cancelled = true
    }
  }, [value, size])

  return <canvas ref={canvasRef} width={size} height={size} />
}
