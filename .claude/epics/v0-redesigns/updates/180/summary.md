---
issue: 180
completed: 2026-02-25T03:15:00Z
status: completed
---

# Issue #180: Date picker as functional month picker

## Completed Changes

### 1. Added `getLastSecondSaturday` Helper
**File**: `src/lib/dates.ts`
- New function returns most recent past second Saturday
- If today IS the second Saturday, returns today
- If before this month's second Saturday, returns last month's
- Added tests in `test/unit/dates.test.ts`

### 2. Redesigned DatePicker to Month Grid
**File**: `src/components/dashboard/DatePicker.tsx`
- Replaced scrollable 12-date list with 3x4 month button grid
- Changed dialog title from "Select Issue" to "Select Month"
- Each button shows "MMM YYYY" format (e.g., "Feb 2026")
- Renamed `generatePastDates` to `generateMonths`
- Changed `isSameDate` to `isSameMonth` (compares month + year only)
- Grid layout: `grid grid-cols-3 gap-2 p-4`

### 3. Changed Default to Last Published
**File**: `src/app/dashboard/page.tsx`
- Changed import from `getNextSecondSaturday` to `getLastSecondSaturday`
- Default selection is now most recent past second Saturday

### 4. Wired Newsletter Filtering
**File**: `src/app/dashboard/page.tsx`
- `DesktopCircleNewsletter` now accepts `selectedDate` prop
- Uses `getNewslettersByCircle` to fetch all newsletters
- Filters by matching `publishedAt` month/year with selected date
- Fetches full newsletter content via `getNewsletterById` for display
- Updated empty state message: "No newsletter for this month"

### 5. Updated Mobile Circle Page
**File**: `src/app/dashboard/circles/[circleId]/page.tsx`
- Added `useSearchParams` import and `getLastSecondSaturday` import
- Supports optional `month` search param (e.g., `?month=2026-02`)
- Parses month param or defaults to last second Saturday
- Uses `getNewslettersByCircle` and filters by month/year
- Updated empty state message to be month-aware

### Test Updates
- `test/components/DatePicker.test.tsx`: Updated for month grid UI and new title
- `test/unit/dates.test.ts`: Added tests for `getLastSecondSaturday`
- All 918 tests pass

## Files Modified
- `src/lib/dates.ts`
- `src/components/dashboard/DatePicker.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/circles/[circleId]/page.tsx`
- `test/components/DatePicker.test.tsx`
- `test/unit/dates.test.ts`

## Design Notes
- Month grid is 3 columns x 4 rows
- Selected month has primary background styling
- 12 most recent months displayed (current + 11 past)
- Empty state shows when no newsletter exists for selected month
