---
issue: 170
title: Circle Settings 4-tab refactor
analyzed: 2026-02-24T20:58:04Z
estimated_hours: 3
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #170

## Overview

Major refactor of CircleSettings.tsx (315 lines) into a 4-tab layout: Details, Prompts, Members, Status. The existing flat layout becomes tab content. PromptsEditor (already extracted in #166) and AdminSubmissionDashboard (already self-contained) are embedded. Member list logic is extracted from the standalone `/members` page (142 lines) and embedded inline. The `/members` page is then deleted.

## Parallel Streams

### Stream A: Full settings refactor (single stream)
**Scope**: Restructure CircleSettings into tabs, embed all sub-components, delete members page
**Files**:
- `src/components/CircleSettings.tsx` (major refactor — 315 lines)
- `src/app/dashboard/circles/[circleId]/members/page.tsx` (delete)
**Agent Type**: frontend
**Can Start**: immediately (#166 complete)
**Estimated Hours**: 3
**Dependencies**: none remaining

## Coordination Points

### Shared Files
None — CircleSettings is only imported by the settings page. No other task touches it.

## Conflict Risk Assessment
- **Low Risk**: Single file refactor + one file deletion.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

Cannot split — all changes are within one component file.

### Implementation plan:

1. **Add imports** to CircleSettings.tsx:
   - `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
   - `PromptsEditor` from `@/components/PromptsEditor`
   - `AdminSubmissionDashboard` from `@/components/AdminSubmissionDashboard`
   - Member-related: `Avatar, AvatarImage, AvatarFallback` from ui, `Badge` from ui, `RemoveMemberModal`, `Shield, Users` from lucide

2. **Add member data queries**:
   - `const members = useQuery(api.memberships.getCircleMembers, { circleId })`
   - `const currentUser = useQuery(api.users.getCurrentUser)`
   - Member state: `const [removeTarget, setRemoveTarget] = useState<...>(null)`

3. **Extract stats tiles** to render above tabs (currently lines 196-216):
   - Created date, issues sent, member count — always visible above the tab bar

4. **Wrap content in Tabs**:
   ```tsx
   <Tabs defaultValue="details">
     <TabsList variant="line">
       <TabsTrigger value="details">Details</TabsTrigger>
       <TabsTrigger value="prompts">Prompts</TabsTrigger>
       <TabsTrigger value="members">Members</TabsTrigger>
       {isAdmin && <TabsTrigger value="status">Status</TabsTrigger>}
     </TabsList>
     <TabsContent value="details">...existing admin sections...</TabsContent>
     <TabsContent value="prompts"><PromptsEditor circleId={circleId} mode="settings" /></TabsContent>
     <TabsContent value="members">...member list from /members page...</TabsContent>
     {isAdmin && <TabsContent value="status"><AdminSubmissionDashboard circleId={circleId} /></TabsContent>}
   </Tabs>
   ```

5. **Details tab**: Move existing admin sections (images, name, description, invite link, leave circle, save button) into Details tab. **Remove the "Configure Prompts" nav row** (lines 271-283).

6. **Prompts tab**: Single line: `<PromptsEditor circleId={circleId} mode="settings" />`

7. **Members tab**: Inline the member list from `/members/page.tsx`:
   - Sorted member list (admin first, alphabetical)
   - Avatar + name + joined date + admin badge
   - Remove button (admin only, not self)
   - RemoveMemberModal

8. **Status tab** (admin only): `<AdminSubmissionDashboard circleId={circleId} />`

9. **Delete** `src/app/dashboard/circles/[circleId]/members/page.tsx`

## Expected Timeline

- Wall time: 3 hours
- Total work: 3 hours

## Notes
- The settings/page.tsx wrapper likely doesn't need changes — it just renders `<CircleSettings circleId={circleId} />`
- Loading state needs to account for members query too (add to existing undefined check)
- The member list in the Members tab doesn't need a header/back arrow (it's inside tabs)
- PromptsEditor already handles its own loading state
- AdminSubmissionDashboard already handles its own loading state
- The 3-member warning banner should stay in the Details tab
