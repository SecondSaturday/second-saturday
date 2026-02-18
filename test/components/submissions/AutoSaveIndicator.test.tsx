import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutoSaveIndicator } from '@/components/submissions/AutoSaveIndicator'

// Fixed "now" for deterministic relative-time tests
const NOW = new Date('2026-02-18T12:00:00Z').getTime()

describe('AutoSaveIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when status is idle', () => {
    const { container } = render(<AutoSaveIndicator status="idle" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders "Saving..." text when status is saving', () => {
    render(<AutoSaveIndicator status="saving" />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('renders "Saved" text when status is saved without lastSaved', () => {
    render(<AutoSaveIndicator status="saved" />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('renders "Saved just now" when lastSaved is less than 10 seconds ago', () => {
    const lastSaved = new Date(NOW - 5000) // 5 seconds ago
    render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
    expect(screen.getByText('Saved just now')).toBeInTheDocument()
  })

  it('renders seconds ago when lastSaved is 10-59 seconds ago', () => {
    const lastSaved = new Date(NOW - 30000) // 30 seconds ago
    render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
    expect(screen.getByText('Saved 30s ago')).toBeInTheDocument()
  })

  it('renders minutes ago when lastSaved is 1-59 minutes ago', () => {
    const lastSaved = new Date(NOW - 5 * 60 * 1000) // 5 minutes ago
    render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
    expect(screen.getByText('Saved 5m ago')).toBeInTheDocument()
  })

  it('renders hours ago when lastSaved is 1+ hours ago', () => {
    const lastSaved = new Date(NOW - 2 * 3600 * 1000) // 2 hours ago
    render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
    expect(screen.getByText('Saved 2h ago')).toBeInTheDocument()
  })

  it('renders "Failed to save" when status is error', () => {
    render(<AutoSaveIndicator status="error" />)
    expect(screen.getByText('Failed to save')).toBeInTheDocument()
  })

  it('renders "Offline" when status is offline', () => {
    render(<AutoSaveIndicator status="offline" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('applies emerald color class for saved status', () => {
    const { container } = render(<AutoSaveIndicator status="saved" />)
    expect(container.firstChild).toHaveClass('text-emerald-600')
  })

  it('applies destructive color class for error status', () => {
    const { container } = render(<AutoSaveIndicator status="error" />)
    expect(container.firstChild).toHaveClass('text-destructive')
  })

  it('applies amber color class for offline status', () => {
    const { container } = render(<AutoSaveIndicator status="offline" />)
    expect(container.firstChild).toHaveClass('text-amber-600')
  })

  it('applies muted-foreground color class for saving status', () => {
    const { container } = render(<AutoSaveIndicator status="saving" />)
    expect(container.firstChild).toHaveClass('text-muted-foreground')
  })

  it('spinner icon animates when saving', () => {
    render(<AutoSaveIndicator status="saving" />)
    const icon = document.querySelector('svg')
    expect(icon).toHaveClass('animate-spin')
  })

  it('accepts and applies custom className', () => {
    const { container } = render(<AutoSaveIndicator status="saved" className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
