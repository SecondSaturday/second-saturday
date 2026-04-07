import { cn } from '@/lib/utils'

interface CreationProgressBarProps {
  currentStep: number // 1-4
  totalSteps?: number
}

export function CreationProgressBar({ currentStep, totalSteps = 4 }: CreationProgressBarProps) {
  return (
    <div className="flex gap-1.5 px-5 py-3">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn('h-1 flex-1 rounded-full', i < currentStep ? 'bg-primary' : 'bg-muted')}
        />
      ))}
    </div>
  )
}
