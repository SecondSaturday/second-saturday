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

function generateMonths(count: number): Date[] {
  const now = new Date()
  const months: Date[] = []
  let year = now.getFullYear()
  let month = now.getMonth()

  for (let i = 0; i < count; i++) {
    months.push(getSecondSaturday(year, month))
    month--
    if (month < 0) {
      month = 11
      year--
    }
  }
  return months
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function DatePicker({ open, onOpenChange, selectedDate, onSelect }: DatePickerProps) {
  const months = generateMonths(12)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Select Month</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 p-4">
          {months.map((date) => {
            const selected = isSameMonth(date, selectedDate)
            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  onSelect(date)
                  onOpenChange(false)
                }}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                )}
              >
                {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
