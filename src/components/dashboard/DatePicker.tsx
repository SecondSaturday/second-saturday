'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getSecondSaturday } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSelect: (date: Date) => void
}

function generatePastDates(count: number): Date[] {
  const now = new Date()
  const dates: Date[] = []
  let year = now.getFullYear()
  let month = now.getMonth()

  for (let i = 0; i < count; i++) {
    dates.push(getSecondSaturday(year, month))
    month--
    if (month < 0) {
      month = 11
      year--
    }
  }
  return dates
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function DatePicker({ open, onOpenChange, selectedDate, onSelect }: DatePickerProps) {
  const dates = generatePastDates(12)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70dvh] max-w-sm overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Select Issue</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-2 pb-2">
          {dates.map((date) => {
            const selected = isSameDate(date, selectedDate)
            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  onSelect(date)
                  onOpenChange(false)
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-muted/50'
                )}
              >
                {date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
