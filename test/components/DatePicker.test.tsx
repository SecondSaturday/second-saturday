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
    expect(screen.getByText('Select Issue')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<DatePicker {...defaultProps} open={false} />)
    expect(screen.queryByText('Select Issue')).not.toBeInTheDocument()
  })

  it('renders 12 past date options', () => {
    render(<DatePicker {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
  })

  it('calls onSelect when a date is clicked', () => {
    render(<DatePicker {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]!)
    expect(defaultProps.onSelect).toHaveBeenCalledOnce()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('highlights the selected date', () => {
    render(<DatePicker {...defaultProps} />)
    // The selected date should have the primary styling
    const buttons = screen.getAllByRole('button')
    const selectedButton = buttons.find((btn: HTMLElement) => btn.className.includes('bg-primary'))
    expect(selectedButton).toBeDefined()
  })
})
