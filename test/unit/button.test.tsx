import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-variant', 'default')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'outline')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    let clicked = false

    render(
      <Button
        onClick={() => {
          clicked = true
        }}
      >
        Click
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
