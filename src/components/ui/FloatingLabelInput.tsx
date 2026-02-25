'use client'
import { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, id, className, value, defaultValue, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const hasValue = Boolean(value || defaultValue)
    const floated = focused || hasValue

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'peer w-full rounded-md border border-input bg-background px-3 pb-2 pt-5 text-sm ring-offset-background',
            'placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          placeholder={label}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'absolute left-3 cursor-text text-muted-foreground transition-all duration-200',
            floated ? 'top-1.5 text-xs' : 'top-3 text-sm'
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingLabelInput.displayName = 'FloatingLabelInput'
