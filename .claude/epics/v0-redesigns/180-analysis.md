---
issue: 180
title: Date picker as functional month picker
analyzed: 2026-02-25T03:02:17Z
estimated_hours: 2.0
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #180

## Overview
Replace the scrollable 12-date list DatePicker with a month picker grid. Wire the selected month to filter which newsletter is displayed. Default to most recent past second Saturday instead of next upcoming.

## Single Stream (Sequential)

### Stream A: Complete Rework
**Scope**: All changes — tightly coupled, not worth parallelizing
**Files**:
- `src/lib/dates.ts` (add `getLastSecondSaturday` helper)
- `src/components/dashboard/DatePicker.tsx` (redesign to month grid)
- `src/app/dashboard/page.tsx` (wire filtering, change default)
- `src/app/dashboard/circles/[circleId]/page.tsx` (accept month filter via searchParams)
- `test/components/DatePicker.test.tsx` (update tests)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 2.0
**Dependencies**: none

## Implementation Checklist

### 1. Add `getLastSecondSaturday` Helper
**File**: `src/lib/dates.ts`
```typescript
/**
 * Get the most recent past second Saturday from a given date.
 * If today IS the second Saturday, returns today.
 * If before this month's second Saturday, returns last month's.
 */
export function getLastSecondSaturday(from: Date = new Date()): Date {
  const year = from.getFullYear()
  const month = from.getMonth()
  const thisMonth = getSecondSaturday(year, month)

  if (from >= thisMonth) {
    return thisMonth
  }

  // Get last month's
  return getSecondSaturday(year, month - 1)
}
```

### 2. Redesign DatePicker to Month Grid
**File**: `src/components/dashboard/DatePicker.tsx`

Replace scrollable list with 3x4 or 4x3 month button grid:
- Generate 12 months (current + 11 past)
- Each button shows "MMM YYYY" (e.g., "Feb 2026")
- Highlighted state for selected month
- Grid layout: `grid grid-cols-3 gap-2` or `grid-cols-4`

```tsx
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
```

Layout change:
```tsx
<div className="grid grid-cols-3 gap-2 p-4">
  {months.map((date) => (
    <button
      key={date.toISOString()}
      onClick={() => { onSelect(date); onOpenChange(false) }}
      className={cn(
        'rounded-lg px-3 py-2 text-sm transition-colors',
        isSameMonth(date, selectedDate)
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
    </button>
  ))}
</div>
```

### 3. Change Default to Last Published
**File**: `src/app/dashboard/page.tsx`

Change:
```tsx
import { getLastSecondSaturday, formatShortDate } from '@/lib/dates'

const [selectedDate, setSelectedDate] = useState(() => getLastSecondSaturday())
```

### 4. Wire Newsletter Filtering
**File**: `src/app/dashboard/page.tsx`

Pass `selectedDate` to `DesktopCircleNewsletter`:
```tsx
<DesktopCircleNewsletter
  circleId={selectedCircleId as Id<'circles'>}
  selectedDate={selectedDate}
/>
```

Update `DesktopCircleNewsletter` to use `getNewslettersByCircle` and filter by date:
```tsx
function DesktopCircleNewsletter({ circleId, selectedDate }: { circleId: Id<'circles'>; selectedDate: Date }) {
  const circle = useQuery(api.circles.getCircle, { circleId })
  const newsletters = useQuery(api.newsletters.getNewslettersByCircle, { circleId })

  // Find newsletter matching selected month
  const newsletter = newsletters?.find(n => {
    const pubDate = new Date(n.publishedAt)
    return pubDate.getMonth() === selectedDate.getMonth()
        && pubDate.getFullYear() === selectedDate.getFullYear()
  })
  // ...
}
```

### 5. Update Circle Page for Mobile
**File**: `src/app/dashboard/circles/[circleId]/page.tsx`

Add optional `month` searchParam support:
```tsx
const searchParams = useSearchParams()
const monthParam = searchParams.get('month') // e.g., "2026-02"

// Parse or default to last second Saturday
const selectedDate = monthParam
  ? new Date(monthParam + '-01')
  : getLastSecondSaturday()
```

## Conflict Risk Assessment
- **Low Risk**: Changes are in different files with clear boundaries
- DatePicker is self-contained
- Dashboard page changes are localized to state and prop passing

## Expected Timeline
- Wall time: 2 hours
- No parallelization benefit — changes are sequential and tightly coupled

## Notes
- Size: M
- Keep existing Dialog wrapper for DatePicker
- Use `isSameMonth` helper (compare month + year only, not day)
- Test: date selection, month grid rendering, filtering behavior
- Consider empty state when no newsletter exists for selected month (already handled)
