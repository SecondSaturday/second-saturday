---
name: second-saturday-epic-5
description: Newsletter Experience - compiling, sending, and viewing newsletters with text, photos, and video thumbnails
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 5 (first part, combined with Epic 6: 70-90 hours total)
---

# Epic 5: Newsletter Experience

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 5 (first part, combined with Epic 6: 70-90 hours total)
**Prerequisites:** Epic 0 (Project Setup), Epic 1 (Authentication), Epic 2 (Circle Creation), Epic 3 (Circle Membership), Epic 4 (Content Submission) must be complete

---

## Overview

This epic covers how users receive and read the compiled newsletter. The newsletter is the "payoff" that makes the monthly effort worthwhile.

**Key Insight:** The newsletter must be scannable, personal, and lightweight. It should load fast on mobile, work in email clients, and make members feel connected to their friends' real lives.

---

## Goals

1. **Compile newsletters automatically** - After deadline (10:59 AM UTC), organize submissions by prompt
2. **Send via email** - Beautiful, responsive React Email template that works in Gmail/Outlook/Apple Mail
3. **Enable in-app viewing** - Full newsletter viewable in web app (requires login)
4. **Support video thumbnails** - Videos displayed as Mux thumbnails with play button in email
5. **Provide archive** - Past issues accessible and searchable
6. **Handle missed months** - Send encouraging "missed month" email if 0 submissions

---

## Implementation Plan

### Phase 1: Design (Days 1-2 of Week 5, ~9-11 hours for Epic 5)

**Goal:** Define newsletter screens and email template before writing code.

**Activities:**

1. **Identify screens and components needed**
   - Newsletter web view (responsive, mobile-first)
   - Newsletter header (circle icon, name, issue number, date)
   - Newsletter section per prompt (prompt title, member responses)
   - Member response card (name, text, inline media grid)
   - Newsletter archive list view (shows past issues by date)
   - Empty state (no newsletters yet)
   - "Missed month" email template (sad puppy gif, encouraging message)

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Design email template (600px max width, responsive)
   - Design for Gmail rendering (limited CSS support)
   - Design for Outlook rendering (even more limited CSS)
   - Design for Apple Mail rendering (best support)
   - Design video thumbnail with play button overlay
   - Design "View in App" CTA button
   - Design footer with unsubscribe link
   - Apply tweakcn theme tokens

3. **Design review**
   - Share with backend developer for feedback
   - Test email template in email client preview tools
   - Validate user flows make sense
   - Check for accessibility
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code (NewsletterView, PromptSection, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for 7 Epic 5 screens
- Email template design (exportable to React Email)
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5 of Week 5, ~17-22 hours for Epic 5)

**Goal:** Build newsletter compilation and delivery features.

**Activities:**

1. **Set up Convex schema**
   - Create newsletters table in schema.ts
     - Fields: circleId, cycleId (format: "2026-02"), htmlContent, sentAt, issueNumber
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create compileNewsletter action (runs after deadline)
     - Organize submissions by prompt
     - Filter out empty prompts (no responses)
     - Generate HTML content with inline media
     - Store compiled newsletter
   - Create sendNewsletter action (sends via Resend to all members)
     - Get all active circle members
     - Send email to each member
     - Handle unsubscribe preferences
   - Create getNewsletterById query
   - Create getNewslettersByCircle query (for archive)
   - Set up Convex cron job (runs at 11:00 AM UTC second Saturday)

3. **Build UI components**
   - Build NewsletterView component (renders compiled newsletter)
   - Build PromptSection component (shows all responses for one prompt)
   - Build MemberResponse component (name, text, inline media grid)
   - Build NewsletterArchive component (lists past issues)
   - Build NewsletterWebView page (/circle/[id]/newsletter/[cycleId])
   - Implement auth check (requires login)

4. **Email implementation**
   - Create React Email template (NewsletterEmail.tsx)
   - Implement responsive layout (works in Gmail/Outlook/Apple Mail)
   - Use inline CSS only (no external stylesheets)
   - Implement video thumbnail with play button (links to web view)
   - Implement "View in App" CTA button
   - Implement footer with unsubscribe link
   - Create MissedMonthEmail.tsx template (sad puppy gif)
   - Implement newsletter compilation logic (organize by prompt, filter empty)
   - Implement async newsletter sending (via Resend)
   - Handle Mux thumbnail URLs in email

5. **Add analytics events** (PostHog)
   - Track `newsletter_compiled` (circle_id, member_count, submission_count)
   - Track `newsletter_sent` (circle_id, recipient_count)
   - Track `newsletter_opened` (email tracking pixel)
   - Track `newsletter_clicked` (CTA: view_in_app)

6. **Manual testing in dev**
   - Test newsletter compilation with sample data
   - Test email sending to test addresses
   - Test email rendering in Gmail, Outlook, Apple Mail
   - Test video thumbnails in email
   - Test web view with login
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (newsletters table)
- Convex functions (compileNewsletter, sendNewsletter, cron job)
- UI components for web view
- React Email templates
- Analytics events tracking
- Working newsletter compilation and sending in dev

---

### Phase 3: Testing (Days 6-7 of Week 5, ~8-11 hours for Epic 5)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test newsletter compilation logic (organizes by prompt)
   - Test filter empty prompts (no responses = omit from newsletter)
   - Test member name formatting
   - Test date formatting (local timezone)
   - Target: 80% coverage for business logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test compileNewsletter action (mock submissions data)
   - Test sendNewsletter action (mock Resend API)
   - Test Convex cron job (manual trigger)
   - Test getNewsletterById query
   - Test newsletter with 0 submissions (sends MissedMonthEmail)

3. **Write E2E tests** (Playwright)
   - Test full newsletter flow (compile → send → receive email)
   - Test newsletter archive view (shows past issues)
   - Test newsletter web view (requires login)
   - Test video thumbnail in email (links to web view)
   - Test "View in App" button
   - Test unsubscribe link (stops emails, keeps membership)

4. **Email testing**
   - Send test newsletter to Gmail (check rendering)
   - Send test newsletter to Outlook (check rendering)
   - Send test newsletter to Apple Mail (check rendering)
   - Test total email size <5MB (photos compressed, videos as thumbnails)
   - Test email with 0 images (fallback text works)
   - Test missed month email (sad puppy gif renders)

5. **Manual QA testing**
   - Test email deliverability (check spam score)
   - Test newsletter rendering across email clients
   - Test video thumbnails in email (click opens web view)
   - Test Convex cron jobs trigger at correct times
   - Create bug tickets for issues found

6. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for business logic)
- Integration tests for all Convex functions
- E2E tests for newsletter flows
- Email rendering verification
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create PR with Figma links, email template preview
2. Code review
3. Address review comments
4. CI validation
5. Fix any CI failures
6. Deploy to Vercel preview and test
7. Merge to main after approval
8. Auto-deploy to production
9. Smoke test newsletter compilation and sending in production
10. Monitor Resend dashboard for email delivery stats
11. Monitor Sentry for newsletter compilation errors
12. Monitor PostHog for newsletter events
13. Check email deliverability (not in spam)

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 5 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 5.1: Receiving the Newsletter

**When** it's the second Saturday and the newsletter is ready,
**I want to** receive it via email and/or notification,
**So I can** read what everyone shared without having to remember to check the app.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.1.1 | Newsletter compilation starts after deadline (10:59 AM UTC) | P0 |
| 5.1.2 | Newsletter sends when ready (async processing) | P0 |
| 5.1.3 | Push notification when newsletter is ready | P0 |
| 5.1.4 | Email includes full newsletter content (text + photos) | P0 |
| 5.1.5 | Email works without images (graceful fallback) | P0 |
| 5.1.6 | "View in App" button in email footer | P0 |
| 5.1.7 | Email sent to all members, including non-submitters | P0 |
| 5.1.8 | Unsubscribe link stops email only (does NOT leave circle) | P0 |
| 5.1.9 | To leave circle, user must use the app | P0 |
| 5.1.10 | If 0 submissions, send "missed month" email | P0 |

**Acceptance Criteria:**
- Email deliverability >95% (not spam-foldered)
- Email renders correctly in Gmail, Apple Mail, Outlook (web and desktop)
- Total email size <5MB (photos compressed; videos are thumbnails only)
- Newsletter sent even if only 1 person submitted
- 10:59 AM UTC deadline chosen so newsletter can compile and send on same day worldwide
- All user-facing dates/times displayed in user's local timezone
- Unsubscribe stops email but user remains in circle (can still view in app)
- Unsubscribed users still receive push notifications if app installed

---

### JTBD 5.2: Reading the Newsletter

**When** I open the newsletter (email or app),
**I want to** easily read everyone's updates and see their photos/videos,
**So I can** feel connected to my friends and know what's happening in their lives.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.2.1 | Newsletter organized by prompt | P0 |
| 5.2.2 | Member names as clear headers/labels for each response | P0 |
| 5.2.3 | Media (photos/videos) displayed inline with each response | P0 |
| 5.2.4 | Photos can be tapped to view full-size (in-app) | P0 |
| 5.2.5 | Videos play on tap with player controls (in-app via Mux) | P0 |
| 5.2.6 | Newsletter header shows circle name, icon, issue number, date | P0 |
| 5.2.7 | Mobile-responsive layout (readable without zooming) | P0 |
| 5.2.8 | Estimated read time displayed | P2 |
| 5.2.9 | "Share to group chat" button | P2 |

**Acceptance Criteria:**
- Newsletter loads in under 3 seconds on mobile
- Text is readable without zooming (16px minimum font)
- Photos/videos lazy-load to improve performance
- Empty prompts (no one answered) are omitted entirely
- Each response shows text followed by media grid (if media attached)
- Video thumbnails show play button overlay (Mux handles this)

---

### JTBD 5.3: Viewing Past Issues

**When** I want to reminisce or catch up on issues I missed,
**I want to** browse an archive of past newsletters,
**So I can** revisit shared memories and see how our group has evolved.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.3.1 | Archive of all past issues accessible from circle home | P0 |
| 5.3.2 | Issues listed by date, newest first | P0 |
| 5.3.3 | Past issues display identically to current issue | P0 |
| 5.3.4 | Past issues reflect membership at time of issue | P0 |
| 5.3.5 | Search within past issues | P2 |
| 5.3.6 | Filter by member | P2 |

**Acceptance Criteria:**
- Archive loads quickly even with 12+ issues (year's worth)
- Past issues show "[Deleted User]" for contributions from deleted accounts
- Past issues available in app (offline support deferred to V0.1)

---

## Analytics Events

Track newsletter compilation, sending, and engagement:

**Epic 5 (Newsletter):**
- `newsletter_compiled` (circle_id, member_count, submission_count)
- `newsletter_sent` (circle_id, recipient_count)
- `newsletter_opened` (email tracking pixel)
- `newsletter_clicked` (CTA: view_in_app)

**Implementation:** Track events at key moments:
- After newsletter compilation completes
- After newsletter is sent to all members
- When email is opened (tracking pixel in email)
- When "View in App" button is clicked

---

## Testing Strategy

### Unit Tests (Vitest)
- Test newsletter compilation logic (organizes by prompt)
- Test filter empty prompts
- Test member name formatting
- Test date formatting (local timezone)
- Target: 80% coverage for business logic

### Integration Tests (Vitest + Testing Library)
- Test compileNewsletter action (mock submissions data)
- Test sendNewsletter action (mock Resend API)
- Test Convex cron job (manual trigger)
- Test getNewsletterById query
- Test newsletter with 0 submissions (sends MissedMonthEmail)

### E2E Tests (Playwright)
- Test full newsletter flow (compile → send → receive email)
- Test newsletter archive view
- Test newsletter web view (requires login)
- Test video thumbnail in email (links to web view)
- Test "View in App" button
- Test unsubscribe link (stops emails, keeps membership)

### Email Testing
- Send test newsletter to Gmail, Outlook, Apple Mail
- Test total email size <5MB
- Test email with 0 images (fallback text works)
- Test missed month email (sad puppy gif renders)

### Manual QA Testing
- Test email deliverability (check spam score)
- Test newsletter rendering across email clients
- Test video thumbnails in email
- Test Convex cron jobs trigger at correct times

**Coverage Target:** 80%+ for business logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires Resend, React Email, Convex, Mux
- **Epic 1 (Authentication & Identity)** - User identity needed for newsletter personalization
- **Epic 2 (Circle Creation & Setup)** - Circles and prompts must exist
- **Epic 3 (Circle Membership)** - Member list needed for sending
- **Epic 4 (Content Submission)** - Submissions must exist to compile newsletter

### Enables (What this epic unlocks)
- **Epic 6 (Notifications & Reminders)** - Newsletter ready notification depends on compilation

---

## Week 5 Timeline Breakdown (Epic 5 portion)

### Days 1-2: Design (9-11 hours for Epic 5 screens)
- Create wireframes for 7 Epic 5 screens in Figma
- Design email template (600px max width, responsive)
- Design for Gmail/Outlook/Apple Mail rendering
- Test email template in email client preview tools
- Apply tweakcn theme tokens
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (17-22 hours for Epic 5)
- Create newsletters table in Convex schema
- Create compileNewsletter action
- Create sendNewsletter action
- Set up Convex cron job (11:00 AM UTC second Saturday)
- Build NewsletterView component
- Build PromptSection and MemberResponse components
- Build NewsletterArchive component
- Build NewsletterWebView page with auth check
- Create React Email templates (newsletter, missed month)
- Implement newsletter compilation logic
- Implement async newsletter sending via Resend
- Handle Mux thumbnail URLs in email
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (8-11 hours for Epic 5)
- Write unit tests for compilation logic
- Write integration tests for Convex functions
- Write E2E tests for newsletter flows
- Email testing (Gmail, Outlook, Apple Mail)
- Manual QA for email deliverability
- Test Convex cron job timing
- Fix bugs found during testing
- Retest to verify fixes

### Continuous: Review & Deploy
- Create PR with Figma links and email preview
- Code review
- CI validation
- Deploy to Vercel preview
- Merge to main
- Smoke test production
- Monitor Resend and PostHog
- Check email deliverability

**Note:** Epic 5 and Epic 6 are developed together in Week 5 for a combined 70-90 hours.

---

## Newsletter Specification

### Structure

```
[Circle Cover Image - full width banner]

[Circle Icon] [Circle Name] - [Tagline]
Issue No. [X] - [Month Day, Year]

---

[Prompt 1 Title]

[Member Name 1]:
[Their text response]
[Media grid: photos/video thumbnails inline, max 3 items]

[Member Name 2]:
[Their text response]
[Media grid if attached]

...

---

[Prompt 2 Title]

[Member Name 1]:
[Their response with inline media]

...

---

See you next month!
[View in App button - requires login]
```

**Note:** Media (photos and videos) appears inline with each prompt response, not in a separate section.

### Design Principles

1. **Scannable** - Names as colored headers; clear section breaks; no walls of text
2. **Personal** - Member names prominent; their words unedited; photos are real (no filters)
3. **Lightweight** - Loads fast on mobile; works in email clients; no JavaScript required
4. **Consistent** - Same structure every month; predictability builds ritual

### Technical Requirements

- **Email:** HTML with inline CSS via React Email; max 600px width; UTF-8 encoding
- **In-app:** Native rendering via Capacitor webview; requires login
- **Photos:** Max 1200px wide; compressed to <200KB; lazy loading
- **Videos:** Displayed as Mux thumbnail with play button; clicking opens web app
- **Total email size:** <5MB target (photos compressed, videos are thumbnails only)
- **Missed month asset:** Sad puppy gif

---

## Key Risks

1. **Email deliverability** - Newsletters may land in spam
   - Mitigation: Use Resend with proper DNS (SPF, DKIM, DMARC); test spam score

2. **Email rendering inconsistencies** - Gmail/Outlook have limited CSS support
   - Mitigation: Use inline CSS only; test across email clients; use React Email best practices

3. **React Email template complexity** - Must work without external CSS
   - Mitigation: Follow React Email documentation; test early and often

4. **Video thumbnails in email** - Some clients block images
   - Mitigation: Provide fallback text; ensure "View in App" button always works

5. **Convex cron job timing accuracy** - Must run exactly at 11:00 AM UTC
   - Mitigation: Test cron job timing; monitor execution; add retry logic

---

## Success Criteria

- [ ] Newsletter compiles automatically after deadline (10:59 AM UTC)
- [ ] Newsletter organizes submissions by prompt
- [ ] Empty prompts (no responses) are omitted from newsletter
- [ ] Email sends to all active circle members
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail
- [ ] Total email size <5MB
- [ ] Video thumbnails display with play button overlay
- [ ] Clicking video thumbnail opens web view (requires login)
- [ ] "View in App" button works
- [ ] Unsubscribe link stops email only (keeps circle membership)
- [ ] Missed month email sends if 0 submissions (sad puppy gif)
- [ ] Newsletter archive shows all past issues
- [ ] Past issues reflect membership at time of issue
- [ ] Newsletter loads in under 3 seconds on mobile
- [ ] Email deliverability >95% (not in spam)
- [ ] All newsletter flows have E2E tests
- [ ] 80%+ test coverage for business logic
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
- [ ] Convex cron job triggers at correct time
