import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the Dialog components since Radix portals don't work well in jsdom
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

import { DatePicker } from '@/components/dashboard/DatePicker'

describe('DatePicker', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedDate: new Date(2026, 1, 14),
    onSelect: vi.fn(),
  }

  it('renders when open', () => {
    render(<DatePicker {...defaultProps} />)
    expect(screen.getByText('Select Month')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<DatePicker {...defaultProps} open={false} />)
    expect(screen.queryByText('Select Month')).not.toBeInTheDocument()
  })

  it('renders 12 month options in a grid', () => {
    render(<DatePicker {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
  })

  it('displays months in MMM YYYY format', () => {
    render(<DatePicker {...defaultProps} />)
    // The most recent month should be displayed
    const buttons = screen.getAllByRole('button')
    // Each button should have format like "Feb 2026"
    expect(buttons[0]!.textContent).toMatch(/\w{3} \d{4}/)
  })

  it('calls onSelect when a month is clicked', () => {
    render(<DatePicker {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]!)
    expect(defaultProps.onSelect).toHaveBeenCalledOnce()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('highlights the selected month', () => {
    render(<DatePicker {...defaultProps} />)
    // The selected month should have the primary styling
    const buttons = screen.getAllByRole('button')
    const selectedButton = buttons.find((btn: HTMLElement) => btn.className.includes('bg-primary'))
    expect(selectedButton).toBeDefined()
  })

  it('uses isSameMonth to match selection (ignores day)', () => {
    // Selected date is Feb 14, 2026 - should match any Feb 2026 date
    render(<DatePicker {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // Find the Feb 2026 button and verify it's highlighted
    const febButton = buttons.find((btn: HTMLElement) => btn.textContent?.includes('Feb 2026'))
    expect(febButton).toBeDefined()
    expect(febButton!.className).toContain('bg-primary')
  })
})
