---
issue: 177
completed: 2026-02-25T02:13:30Z
status: completed
---

# Issue #177: Members tab UX redesign

## Completed Changes

### Import Updates
- Added `MoreVertical` from lucide-react
- Removed `Shield`, `Users` (unused)
- Removed `Badge` import
- Added `DropdownMenu` components

### Tab Header
- Changed from `Members` to `Members ({count})`

### Member Row Redesign
1. **"You" label**: Shows "You" for current user instead of their name
2. **Role labels**: Replaced `<Badge><Shield />Admin</Badge>` with plain `<span>Admin</span>` or `Member`
3. **Removed joined date**: Deleted the "Joined [date]" line
4. **Three-dot menu**: Replaced Remove button with DropdownMenu containing Remove option

## Files Modified
- `src/components/CircleSettings.tsx`

## Tests
All 909 tests passing.
