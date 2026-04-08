---
issue: 176
completed: 2026-02-25T05:09:00Z
status: completed
---

# Issue #176: Settings Details tab polish

## Completed Changes

### Stream A: Image Crop Aspect Ratio
- `ImageCropModal.tsx`: Added `aspect` prop (default: 1)
- `ImageUpload.tsx`: Passes `aspect={shape === 'rectangle' ? 3 : 1}` to modal
- Cover images now crop at 3:1, icons at 1:1

### Stream B: Settings Tab Redesign
1. **ProfileHeaderImageLayout integration**
   - Replaced stacked ImageUpload components with ProfileHeaderImageLayout in edit mode
   - Added `handleFileUpload` wrapper to convert File → storageId for Convex

2. **Stat tiles redesign**
   - Replaced single bordered card with 3 separate tiles (grid-cols-3)
   - Order: Members, Issues Sent, Created
   - Each tile: large bold number on top, muted label below
   - Created format: "Feb 2026" (month + year only)

3. **Leave button update**
   - Removed "Danger Zone" heading
   - Replaced text link with full-width destructive Button

## Files Modified
- `src/components/circles/ImageCropModal.tsx`
- `src/components/circles/ImageUpload.tsx`
- `src/components/CircleSettings.tsx`

## Tests
All 909 tests passing.
