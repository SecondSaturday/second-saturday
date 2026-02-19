# Submission UI Components

Foundation components for the multi-circle submission experience (Epic 4).

## Components

### CircleSubmissionTabs
Instagram Stories-style horizontal tabs for navigating between circle submissions.

**Props:**
- `circles: Circle[]` - Array of circles with status indicators
- `activeCircleId: string` - Currently active circle ID
- `onCircleChange: (circleId: string) => void` - Tab switch callback
- `children: React.ReactNode` - Content area for active circle

**Status Types:**
- `not-started` - Empty ring indicator
- `in-progress` - Half-filled ring (50% progress)
- `submitted` - Solid ring with checkmark
- `locked` - Lock icon overlay

**Usage:**
```tsx
import { CircleSubmissionTabs } from '@/components/submissions'

<CircleSubmissionTabs
  circles={circles}
  activeCircleId={activeId}
  onCircleChange={setActiveId}
>
  <YourContent />
</CircleSubmissionTabs>
```

---

### PromptResponseCard
Card component for responding to a single prompt with text input and media area.

**Props:**
- `promptId: string` - Unique prompt identifier
- `promptText: string` - The prompt question text
- `initialValue?: string` - Initial text value
- `onValueChange?: (value: string) => void` - Text change callback
- `disabled?: boolean` - Locks editing (for deadline expiry)
- `maxLength?: number` - Character limit (default: 500)

**Features:**
- Auto-expanding textarea (native `field-sizing-content`)
- Character counter with color coding:
  - Normal: gray
  - 90%+: amber (warning)
  - 100%: red (destructive)
- Placeholder for media upload area

**Usage:**
```tsx
import { PromptResponseCard } from '@/components/submissions'

<PromptResponseCard
  promptId="1"
  promptText="What was your month's highlight?"
  onValueChange={(value) => console.log(value)}
/>
```

---

### DeadlineCountdown
Real-time countdown to submission deadline (10:59 AM UTC, second Saturday).

**Props:**
- `className?: string` - Additional CSS classes

**Features:**
- Calculates next second Saturday using `getNextSecondSaturday()`
- Sets deadline to 10:59 AM UTC
- Updates every second
- Three display states:
  - **Normal** (>24h): "X days remaining"
  - **Urgent** (<24h): "HH:MM:SS" countdown with amber styling
  - **Expired**: "Deadline passed" with red styling

**Usage:**
```tsx
import { DeadlineCountdown } from '@/components/submissions'

<DeadlineCountdown />
```

---

### AutoSaveIndicator
Status indicator for auto-save functionality.

**Props:**
- `status: SaveStatus` - Current save state
- `lastSaved?: Date` - Timestamp of last save
- `className?: string` - Additional CSS classes

**Status Types:**
- `idle` - Hidden (no indicator shown)
- `saving` - Spinning loader + "Saving..."
- `saved` - Check icon + "Saved Xm ago"
- `error` - Cloud icon + "Failed to save"
- `offline` - CloudOff icon + "Offline"

**Usage:**
```tsx
import { AutoSaveIndicator } from '@/components/submissions'

const [status, setStatus] = useState<SaveStatus>('idle')
const [lastSaved, setLastSaved] = useState<Date>()

<AutoSaveIndicator status={status} lastSaved={lastSaved} />
```

---

### MediaGrid
Grid layout for displaying uploaded media (photos/videos) with remove functionality.

**Props:**
- `media: MediaItem[]` - Array of media items
- `onRemove?: (mediaId: Id<'media'>) => void` - Remove callback
- `disabled?: boolean` - Disables remove buttons
- `className?: string` - Additional CSS classes

**Features:**
- Responsive grid layouts:
  - 1 item: Full width
  - 2 items: Side-by-side (50/50)
  - 3 items: First item spans 2 columns, others stacked
- Video indicators with play button overlay
- Hover effects with remove button
- Disabled state with overlay

**Usage:**
```tsx
import { MediaGrid } from '@/components/submissions'

<MediaGrid
  media={mediaItems}
  onRemove={(id) => handleRemove(id)}
/>
```

---

## Design Patterns

### Theme Integration
All components use tweakcn theme tokens:
- `bg-muted/50` - Upload areas
- `text-muted-foreground` - Secondary text
- `text-destructive` - Error states
- `text-amber-600` - Warning states

### Responsive Design
- Mobile-first approach (375px breakpoint)
- Horizontal scrolling for tabs (Instagram Stories pattern)
- `scrollbar-hide` utility for clean mobile UX

### Accessibility
- Semantic HTML structure
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus-visible ring indicators

---

## Integration Notes

**For Issue #70 (Multi-circle Submission UI):**
- Connect `MediaUploader` to `PromptResponseCard`
- Implement auto-save with 2-second debounce
- Add `MultiCircleSubmissionScreen` wrapper
- Integrate with Convex mutations/queries

**For Issue #68 (Photo Upload):**
- `MediaUploader` component already exists
- Handles Capacitor Camera integration
- Client-side compression (<200KB)

**For Issue #69 (Video Upload):**
- Extend `MediaUploader` for video support
- Add Mux integration
- Implement blocking UI during upload

---

## Demo

See `/demo-submissions` for interactive demo with all components.

```bash
npm run dev
# Visit http://localhost:3000/demo-submissions
```
