'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SnapScrollCardsProps {
  cards: React.ReactNode[]
  cardKeys: string[]
  totalPrompts: number
}

const SNAP_PADDING = 20
const PEEK_HEIGHT = 80 // pixels of the next card visible at the bottom
const GAP = 20 // gap between cards (gap-5 = 20px)

export function SnapScrollCards({ cards, cardKeys, totalPrompts }: SnapScrollCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [cardHeight, setCardHeight] = useState(480)

  // Calculate card height based on container size
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const compute = () => {
      const available = el.clientHeight
      // card height = container - top padding - peek of next card - gap before peek
      const h = available - SNAP_PADDING - PEEK_HEIGHT - GAP
      setCardHeight(Math.max(300, Math.min(700, h)))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const children = el.querySelectorAll('[data-snap-card]')
    if (children.length === 0) return

    const target = el.scrollTop + SNAP_PADDING + 10

    let closest = 0
    let closestDist = Infinity
    children.forEach((child, i) => {
      const cardTop = (child as HTMLElement).offsetTop
      const dist = Math.abs(cardTop - target)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })

    setActiveIndex(closest)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const showDots = totalPrompts > 1

  return (
    <div
      className="relative flex min-h-0 flex-1 overflow-hidden"
      style={{ ['--card-height' as string]: `${cardHeight}px` }}
    >
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="h-full flex-1 overflow-y-auto"
        style={{
          scrollSnapType: 'y mandatory',
          scrollPaddingTop: SNAP_PADDING,
          scrollbarWidth: 'none',
        }}
      >
        <div className="mx-auto flex max-w-[700px] flex-col gap-5 px-5 py-5 md:px-10 md:py-6">
          {cards.map((card, i) => (
            <div
              key={cardKeys[i] ?? i}
              data-snap-card
              className="shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll dots */}
      {showDots && (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 md:right-4">
          {Array.from({ length: totalPrompts }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-200',
                i === activeIndex ? 'size-2 bg-foreground/60' : 'size-1.5 bg-foreground/20'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
