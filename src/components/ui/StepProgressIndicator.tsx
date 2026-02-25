'use client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepProgressIndicatorProps {
  steps: string[]
  currentStep: number // 1-indexed; pass steps.length + 1 to show all completed
}

export function StepProgressIndicator({ steps, currentStep }: StepProgressIndicatorProps) {
  return (
    <div className="flex items-start justify-center px-6 py-4">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        return (
          <div key={stepNum} className="flex items-start">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  isCurrent || isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="size-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mt-4 mx-1 shrink-0',
                  stepNum < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
