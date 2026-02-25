---
issue: 186
title: Circle Creation Flow — intro splash, step indicator, max-width containers, fixed CTAs, warmer copy
analyzed: 2026-02-25T04:20:13Z
estimated_hours: 6.0
parallelization_factor: 1.2
---

# Parallel Work Analysis: Issue #186

## Overview

Redesign the 3-step circle creation wizard with 5 changes:
1. **Intro splash** at `/dashboard/create` — state-gated view before Step 1
2. **StepProgressIndicator** component — 3 numbered circles + connecting line, shown on Steps 1–3
3. **Max-width containers** — wrap form content in `max-w-lg mx-auto` on create + prompts pages
4. **Fixed CTA bars** — Step 1 button moves to fixed bottom bar; PromptsEditor already has a bottom bar at line 247 (just needs `fixed`)
5. **Setup-complete polish** — warmer copy + `pb-6`/`pb-8` bottom padding

**Files touched**:
- `src/components/ui/StepProgressIndicator.tsx` — new component
- `src/app/dashboard/create/page.tsx` — intro splash + step indicator + max-width + fixed CTA
- `src/components/PromptsEditor.tsx` — fixed CTA bar + step indicator passthrough (or add internally)
- `src/app/dashboard/circles/[circleId]/prompts/page.tsx` — pass step indicator props
- `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx` — warmer copy + padding

**Parallelization assessment**: The `StepProgressIndicator` component is a pure UI component with no dependencies on the pages. However, both the create page and prompts page depend on `StepProgressIndicator` existing before they import it. The setup-complete page is fully independent of `StepProgressIndicator`.

**Recommended approach**: Two sequential phases, with Phase 2 having a short parallel window:
- Phase 1 (sequential): Build `StepProgressIndicator` first (~30 min)
- Phase 2 (can partially parallel): create page + prompts page can be done by one agent after Phase 1; setup-complete is independent and could run in parallel

In practice, a **single agent** is the right call here: the inter-page dependencies (intro splash routes to prompts which routes to setup-complete) mean they all need to see each other's output to verify routing works end-to-end. The parallelization_factor of 1.2 reflects minimal gain from splitting.

## Parallel Streams

### Stream A: Full Creation Flow (Single Stream)
**Scope**: All changes — StepProgressIndicator component, intro splash, step indicators on create + prompts pages, max-width wrappers, fixed CTAs, setup-complete polish
**Files**:
- `src/components/ui/StepProgressIndicator.tsx` — create new
- `src/app/dashboard/create/page.tsx` — intro splash + step indicator + max-width + fixed CTA
- `src/components/PromptsEditor.tsx` — make existing bottom bar `fixed` + add step prop
- `src/app/dashboard/circles/[circleId]/prompts/page.tsx` — pass `currentStep={2}` to step indicator
- `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx` — warmer copy + bottom padding
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 6.0
**Dependencies**: none

**Implementation detail**:

**Step 1 — StepProgressIndicator** (`src/components/ui/StepProgressIndicator.tsx`):
```tsx
interface StepProgressIndicatorProps {
  steps: string[]
  currentStep: number // 1-indexed
}

export function StepProgressIndicator({ steps, currentStep }: StepProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-4">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        return (
          <div key={stepNum} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  !isCurrent && !isCompleted && 'border-muted-foreground bg-background text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="size-4" /> : stepNum}
              </div>
              <span className={cn(
                'text-xs',
                isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}>
                {label}
              </span>
            </div>
            {/* Connecting line (not after last step) */}
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-8 -mt-4 mx-1',
                stepNum < currentStep ? 'bg-primary' : 'bg-muted',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```
Import `cn` from `@/lib/utils` and `Check` from `lucide-react`.

**Step 2 — create/page.tsx intro splash + step 1 updates**:

Add `const [showSplash, setShowSplash] = useState(true)` state.

Splash render (when `showSplash === true`):
```tsx
<div className="safe-area-top flex h-dvh flex-col bg-background">
  <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
    <Link href="/dashboard">
      <ArrowLeft className="size-5 text-foreground" />
    </Link>
  </header>
  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
    <div className="space-y-3">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Create Your Group</h1>
      <p className="text-lg text-muted-foreground">Every second Saturday, connect meaningfully</p>
      <p className="text-sm text-muted-foreground">Set prompts, invite friends, and receive monthly newsletters</p>
    </div>
    <Button className="w-full max-w-xs" onClick={() => setShowSplash(false)}>
      Get Started
    </Button>
  </div>
</div>
```

**Note on serif font**: The acceptance criteria specifies "large serif heading". Check if the project has a serif font configured in `tailwind.config.ts` or `globals.css`. If `font-serif` resolves to a system serif (Georgia/Times), that's fine. If no serif is configured, use `font-semibold text-3xl` without `font-serif` and note the gap.

When `showSplash === false`, render the existing form but with these changes:
- Add `<StepProgressIndicator steps={['Basic Info', 'Prompts', 'Members']} currentStep={1} />` between the header and the form
- Wrap the form's inner content in `<div className="max-w-lg mx-auto w-full">...</div>`
- Move the submit button out of `<div className="mt-auto">` into a fixed bottom bar:
```tsx
{/* End form before CTA */}
</form>

<div className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
  <Button
    form="create-circle-form"
    type="submit"
    className="w-full max-w-lg mx-auto block"
    disabled={submitting || name.length < 3}
  >
    {submitting ? 'Creating...' : 'Create Circle'}
  </Button>
</div>
```
Give the `<form>` an `id="create-circle-form"` so the external submit button can target it. Add `pb-24` to the form scroll area so content isn't hidden behind the fixed bar.

**Step 3 — PromptsEditor.tsx**:
The existing bottom bar at line 247 is already `border-t border-border px-4 py-4` with a `safe-area-bottom` class. Make it `fixed`:
```tsx
<div className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
```
Add `pb-24` (or similar) to the scrollable area above it so content doesn't scroll under the bar.

Add an optional `stepIndicator` slot or just pass it via props from the prompts page if needed. Simplest approach: add an optional `stepIndicator?: React.ReactNode` prop to `PromptsEditorProps` and render it before the prompt list.

**Step 4 — prompts/page.tsx**:
Pass `stepIndicator` to `PromptsEditor`:
```tsx
<PromptsEditor
  circleId={circleId}
  mode={isSetup ? 'setup' : 'settings'}
  onComplete={...}
  stepIndicator={isSetup ? (
    <StepProgressIndicator steps={['Basic Info', 'Prompts', 'Members']} currentStep={2} />
  ) : undefined}
/>
```
Import `StepProgressIndicator` in this file.

**Step 5 — setup-complete/page.tsx**:
- Change heading: `"{circle.name} is ready!"` → `"🎉 {circle.name} is live!"` or warmer variant like `"You're all set!"` with sub-heading `"{circle.name} is ready to go"` — exact wording flexible, should feel celebratory
- Add `StepProgressIndicator steps={['Basic Info', 'Prompts', 'Members']} currentStep={4}` (all completed — step 4 > 3 means all steps show as completed)
- Add `pb-6` or `pb-8` to the bottom padding of the main content area (the `py-12` div can become `pt-12 pb-8`)

## Coordination Points

### Shared Files
- `src/components/PromptsEditor.tsx` — only Stream A touches it, no conflict

### Sequential Requirements
1. `StepProgressIndicator` must exist before create page or prompts page can import it
2. All three pages (create → prompts → setup-complete) form a sequential user journey — verify routing end-to-end before committing

## Conflict Risk Assessment

- **No Risk**: All files are isolated from other epic tasks (only #186 touches these files)
- **Note**: `PromptsEditor.tsx` is used by the settings flow too (mode: 'settings'). The `fixed` bottom bar change and the optional `stepIndicator` prop are fully backwards-compatible — settings mode passes no `stepIndicator` and the fixed bar behavior is the same.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

The creation flow is a 3-step wizard where each page routes to the next. A single agent can verify the full flow works coherently. The `StepProgressIndicator` dependency also makes parallel streams awkward without coordination.

## Expected Timeline

With single agent:
- Wall time: 6.0 hours
- Total work: 6.0 hours

## Notes

- **Serif font check**: Before using `font-serif`, verify the project has a serif configured. Check `tailwind.config.ts` `fontFamily.serif` and `src/app/globals.css` for `@font-face` or `--font-serif`. If not configured, omit `font-serif` and flag it as a gap for the design review.
- **Fixed bottom bar on create page**: Using `form` attribute + `id` on `<form>` avoids nesting a `<button type="submit">` outside the form. This is valid HTML5.
- **PromptsEditor backwards compatibility**: The `stepIndicator?: React.ReactNode` prop addition is additive — settings flow callers pass nothing and see no change.
- **"Members" step**: The 3-step wizard labels are "Basic Info" / "Prompts" / "Members" — the setup-complete page IS the Members step (it's where you invite people). Use `currentStep={3}` on setup-complete (not 4) to show step 3 as current/active, or use `currentStep={4}` (past the last step) to show all 3 as completed checkmarks — the latter feels more celebratory.
- **Step indicator on setup-complete**: Optional — the acceptance criteria don't explicitly require it on setup-complete. Include it for visual continuity but it can be omitted if it looks odd on a completion screen.
