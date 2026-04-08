---
name: second-saturday-epic-2
status: completed
created: 2026-02-09T03:54:23Z
progress: 100%
updated: 2026-02-10T08:33:57Z
prd: .claude/prds/second-saturday-epic-2.md
github: https://github.com/SecondSaturday/second-saturday/issues/43
---

# Epic: Circle Creation & Setup

## Overview

This epic implements the home dashboard and circle management system. Users land on a dashboard showing all their circles with read/unread status indicators (like Snapchat), can filter newsletters by date, and create/configure circles with prompts and invite links.

**Core user flows:**
1. View dashboard → see circles with unread indicators → tap to read newsletter
2. Create circle → add name/images → configure prompts → share invite link
3. Manage circle → edit settings → regenerate invite link

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Convex real-time subscriptions | Dashboard needs live updates for read/unread status |
| Image compression | browser-image-compression | Client-side compression reduces upload time and storage |
| Drag-and-drop | dnd-kit | Lightweight, accessible, works well with React |
| Date picker | Custom scrollable list | Matches Figma design; simpler than calendar widget |
| Invite codes | UUID v4 | URL-safe, not guessable, easy to generate |

## Technical Approach

### Convex Schema

```typescript
// circles table
circles: defineTable({
  name: v.string(),
  iconImageId: v.optional(v.id("_storage")),
  coverImageId: v.optional(v.id("_storage")),
  description: v.optional(v.string()),
  adminId: v.id("users"),
  inviteCode: v.string(),
  timezone: v.string(),
  archivedAt: v.optional(v.number()),
})
  .index("by_admin", ["adminId"])
  .index("by_invite_code", ["inviteCode"])

// prompts table
prompts: defineTable({
  circleId: v.id("circles"),
  text: v.string(),
  order: v.number(),
  active: v.boolean(),
})
  .index("by_circle", ["circleId"])

// memberships table (if not already in Epic 1)
memberships: defineTable({
  userId: v.id("users"),
  circleId: v.id("circles"),
  role: v.union(v.literal("admin"), v.literal("member")),
  joinedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_circle", ["circleId"])

// newsletter_reads table (track read/unread per user per newsletter)
newsletterReads: defineTable({
  userId: v.id("users"),
  circleId: v.id("circles"),
  newsletterId: v.id("newsletters"),
  readAt: v.number(),
})
  .index("by_user_circle", ["userId", "circleId"])
```

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `HomeDashboard` | Main page layout (sidebar on desktop, full-screen on mobile) |
| `CircleList` | Renders list of circles with real-time subscription |
| `CircleListItem` | Single circle row: icon, name, members, unread dot |
| `DashboardHeader` | Avatar, date picker, notifications, menu |
| `DatePicker` | Scrollable list of past issues for filtering |
| `CreateCircleFAB` | Floating button showing next deadline |
| `CircleCreationForm` | Multi-step form: name → images → prompts |
| `PromptSelector` | Library selection + custom input |
| `PromptReorder` | dnd-kit drag-and-drop list |
| `CircleSettings` | Edit circle details, regenerate invite |
| `EmptyState` | CTA when user has no circles |

### Key Convex Functions

**Queries:**
- `getCirclesByUser` - Returns circles with member previews, unread status
- `getNewslettersByDate` - Filters newsletters for date picker
- `getCirclePrompts` - Returns prompts for a circle
- `getPromptLibrary` - Returns suggested prompts by category

**Mutations:**
- `createCircle` - Creates circle with defaults, auto-generates invite code
- `updateCircle` - Updates name, images, description
- `regenerateInviteCode` - Creates new UUID, invalidates old
- `updatePrompts` - Batch update prompts (add, remove, reorder)
- `markNewsletterRead` - Records read timestamp, clears unread dot

## Implementation Strategy

**Approach:** Build backend first, then dashboard, then creation flow. This lets us test data layer independently.

**Risk mitigation:**
- Test image compression on real devices early (HEIC edge cases)
- Use Convex dev environment for rapid iteration
- Build mobile layout first (simpler), then enhance for desktop

## Task Breakdown Preview

- [x] **Task 1: Convex Backend** - Schema, queries, mutations for circles, prompts, memberships, newsletter reads
- [x] **Task 2: Home Dashboard** - CircleList, Header, DatePicker, FAB, empty state, desktop/mobile layouts
- [x] **Task 3: Circle Creation Flow** - Multi-step form, image upload with compression, default prompts
- [x] **Task 4: Prompt Configuration** - Library selector, custom prompts, drag-and-drop reorder
- [x] **Task 5: Circle Settings** - Edit screen, invite link regeneration with warning
- [x] **Task 6: Testing & Polish** - Unit tests, integration tests, E2E tests, analytics events

## Dependencies

### Prerequisites (Must be complete)
- **Epic 0** - Convex configured, UI framework (shadcn/ui), Tailwind
- **Epic 1** - User authentication, user table in Convex

### External Dependencies
- `browser-image-compression` - npm package for client-side image compression
- `dnd-kit` - npm package for drag-and-drop
- `uuid` - npm package for invite code generation (or use Convex's built-in)

### Enables (Blocked until this completes)
- **Epic 3** - Circle membership (join via invite link)
- **Epic 4** - Content submission (requires circles and prompts)
- **Epic 5** - Newsletter experience (requires circles)

## Success Criteria (Technical)

| Criteria | Target |
|----------|--------|
| Dashboard load time | < 2 seconds |
| Circle creation time | < 30 seconds |
| Image compression | < 200KB output |
| Real-time updates | < 500ms latency |
| Test coverage (validation) | > 80% |
| E2E test coverage | All critical paths |

## Estimated Effort

| Task | Effort |
|------|--------|
| Convex Backend | 4-6 hours |
| Home Dashboard | 6-8 hours |
| Circle Creation Flow | 4-6 hours |
| Prompt Configuration | 3-4 hours |
| Circle Settings | 2-3 hours |
| Testing & Polish | 6-8 hours |
| **Total** | **25-35 hours** |

**Critical path:** Convex Backend → Home Dashboard → Circle Creation (must be sequential)

## Tasks Created

- [x] #44 - Convex Backend - Schema & Functions (parallel: false)
- [x] #45 - Home Dashboard UI (parallel: true, depends on: #44)
- [x] #46 - Circle Creation Flow (parallel: true, depends on: #44)
- [x] #47 - Prompt Configuration (parallel: true, depends on: #44)
- [x] #48 - Circle Settings (parallel: true, depends on: #44)
- [x] #49 - Testing & Polish (parallel: false, depends on: #44-#48)

**Total tasks:** 6
**Parallel tasks:** 4 (#45, #46, #47, #48 can run concurrently after #44)
**Sequential tasks:** 2 (#44 first, #49 last)
**Estimated total effort:** 25-35 hours
