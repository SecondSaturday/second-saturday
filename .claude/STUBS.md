# Deferred Implementation Tracker

This document tracks functionality that has been intentionally stubbed or deferred to future epics. Each stub includes the location, reason for deferral, and target epic for implementation.

---

## Epic 3 Stubs (Circle Membership)

### 1. Content Deletion in removeMember

**Status:** ⏳ Waiting for Epic 4

**Location:**
- `convex/memberships.ts:236-238`

**Current Behavior:**
- When admin removes a member with "Remove & Block" option (`keepContributions: false`)
- Sets `leftAt` and `blocked` flags on membership
- Does NOT delete/replace the member's contributions

**Target Implementation (Epic 4):**
- Replace all blocked member's contributions with "[Removed]" placeholder
- Clean up submission drafts for current cycle
- Preserve data integrity in newsletters table

**Code Reference:**
```typescript
// convex/memberships.ts:236-238
// Remove and block — contributions will be cleaned up when content tables exist (Epic 4)
await ctx.db.patch(targetMembership._id, { leftAt: Date.now(), blocked: true })
// TODO: Replace contributions with "[Removed]" when content/submission tables exist
```

**Dependencies:**
- Epic 4 must create: `submissions` table, `contributions` table
- Epic 4 must implement: submission management mutations

---

### 2. Submission Status Tracking

**Status:** ⏳ Waiting for Epic 4

**Location:**
- `convex/memberships.ts:167` (getSubmissionStatus query)
- `src/components/AdminSubmissionDashboard.tsx`

**Current Behavior:**
- All members show status: "Not Started"
- `submittedAt` is always `null`
- No actual tracking of submission progress

**Target Implementation (Epic 4):**
- Query actual submission records from database
- Calculate real status: "Submitted" | "In Progress" | "Not Started"
- Show actual submission timestamps
- Update in real-time as members work on submissions

**Code Reference:**
```typescript
// convex/memberships.ts:167
status: 'Not Started' as 'Submitted' | 'In Progress' | 'Not Started',
submittedAt: null as number | null,
```

**Dependencies:**
- Epic 4 must create: `submissions` table with status tracking
- Epic 4 must implement: submission lifecycle (draft → in-progress → submitted)

---

### 3. Deadline Management

**Status:** ⏳ Waiting for Epic 4

**Location:**
- `convex/memberships.ts:173` (getSubmissionStatus query)
- `src/components/AdminSubmissionDashboard.tsx:39-42`

**Current Behavior:**
- Deadline is always `null`
- UI shows "Deadline not set" placeholder
- No countdown or deadline enforcement

**Target Implementation (Epic 4):**
- Track cycle deadlines in database
- Calculate time remaining until deadline
- Show countdown timer to members
- Auto-trigger newsletter generation at deadline

**Code Reference:**
```typescript
// convex/memberships.ts:173
return { members, deadline: null as number | null }
```

```tsx
// src/components/AdminSubmissionDashboard.tsx:39-42
{data.deadline
  ? `Deadline: ${new Date(data.deadline).toLocaleDateString()}`
  : 'Deadline not set'}
```

**Dependencies:**
- Epic 4 must create: `cycles` table with deadline tracking
- Epic 4 must implement: cycle/deadline management system

---

### 4. Reminder Sending Functionality

**Status:** ⏳ Waiting for Epic 6

**Location:**
- `src/components/AdminSubmissionDashboard.tsx:29-31` (handleSendReminder)
- `src/components/AdminSubmissionDashboard.tsx:46` (reminder count display)

**Current Behavior:**
- "Send Reminder" button shows toast: "Reminders coming soon"
- Reminder count is hardcoded: "3 of 3 reminders remaining"
- No actual reminder sending capability

**Target Implementation (Epic 6):**
- Send push notifications to members via OneSignal
- Send email reminders via Resend
- Track reminder count per cycle (max 3)
- Allow per-member or bulk reminders
- Reset count after cycle completes

**Code Reference:**
```tsx
// src/components/AdminSubmissionDashboard.tsx:29-31
const handleSendReminder = () => {
  toast.info('Reminders coming soon')
}
```

**Dependencies:**
- Epic 6 must implement: OneSignal push notification integration
- Epic 6 must implement: Resend email template system
- Epic 6 must create: `reminders` tracking table
- Epic 4 must exist first (to know who hasn't submitted)

---

### 5. Current-Cycle Draft Discarding

**Status:** ⏳ Waiting for Epic 4

**Location:**
- Mentioned in task acceptance criteria (`.claude/epics/second-saturday-epic-3/52.md:24`)
- Not yet implemented (no code location)

**Current Behavior:**
- When member leaves or is removed, nothing happens to their draft
- (No drafts exist yet since Epic 4 isn't implemented)

**Target Implementation (Epic 4):**
- When member leaves: discard their current-cycle draft
- When member is removed: discard their current-cycle draft
- Past published contributions remain intact
- If member rejoins: start fresh with no draft

**Dependencies:**
- Epic 4 must create: `submissions` table with draft support
- Epic 4 must implement: draft lifecycle management

---

## Epic 4 Stubs (Content Submission)

*To be populated when Epic 4 is implemented*

---

## Epic 5 Stubs (Newsletter Experience)

*To be populated when Epic 5 is implemented*

---

## Epic 6 Stubs (Notifications & Reminders)

*To be populated when Epic 6 is implemented*

---

## Maintenance Guidelines

### When Adding a New Stub:

1. **Document immediately** when implementing a stub
2. **Include all fields:**
   - Status (⏳ Waiting / 🚧 In Progress / ✅ Complete)
   - Location (file paths and line numbers)
   - Current Behavior (what happens now)
   - Target Implementation (what should happen)
   - Code Reference (actual code snippet)
   - Dependencies (what must exist first)

### When Implementing a Stub:

1. **Update status** to 🚧 In Progress when starting
2. **Update status** to ✅ Complete when done
3. **Add completion date** and PR reference
4. **Leave stub entry** for historical tracking

### When Reviewing Stubs:

1. **Before each epic** - review relevant stubs
2. **During planning** - ensure dependencies are met
3. **After completion** - verify all stubs implemented

---

## Quick Reference

| Stub | Location | Target Epic | Status |
|------|----------|-------------|--------|
| Content Deletion | `convex/memberships.ts:236` | Epic 4 | ⏳ Waiting |
| Submission Status | `convex/memberships.ts:167` | Epic 4 | ⏳ Waiting |
| Deadline Management | `convex/memberships.ts:173` | Epic 4 | ⏳ Waiting |
| Reminder Sending | `src/components/AdminSubmissionDashboard.tsx:29` | Epic 6 | ⏳ Waiting |
| Draft Discarding | Task 52 acceptance criteria | Epic 4 | ⏳ Waiting |

---

**Last Updated:** 2026-02-11
**Total Active Stubs:** 5
**Completed Stubs:** 0
