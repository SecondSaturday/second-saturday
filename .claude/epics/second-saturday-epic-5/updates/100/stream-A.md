---
issue: 100
stream: Unit Tests — Newsletter Business Logic
agent: backend-specialist
started: 2026-02-22T05:14:57Z
status: completed
---

# Stream A: Unit Tests — Newsletter Business Logic

## Scope
Test pure business logic: newsletter compilation, date formatting, issue number auto-increment, 0-submission detection, email template rendering.

## Files
- `test/unit/newsletter.test.ts` (new)
- `test/unit/newsletterEmails.test.ts` (new)

## Completed

### test/unit/newsletter.test.ts (29 tests)
- compileNewsletter: organizes responses by prompt (groups by promptId, includes member name + text)
- compileNewsletter: sorts sections by prompt order
- compileNewsletter: excludes inactive prompts
- compileNewsletter: omits prompts with zero responses
- compileNewsletter: returns empty when no submissions / unlocked submissions
- Member name formatting: uses name, falls back to email, handles missing/null
- Date formatting: formats cycleId to title (all 12 months)
- Issue number auto-increment logic (count existing + 1)
- 0-submission detection (missed month)
- Newsletter section structure validation (promptTitle + responses array)
- Response structure validation (memberName, text, media)
- Media URL resolution: image type, video type with Mux patterns
- Newsletter htmlContent JSON structure serialization

### test/unit/newsletterEmails.test.ts (35 tests)
- isSecondSaturday: correctly identifies second Saturday for known dates
- isSecondSaturday: validates all 12 months of 2026
- isSecondSaturday: rejects first/third/fourth Saturdays
- isSecondSaturday: rejects weekdays even if day 8-14
- processNewsletters flow: with submissions -> send newsletter
- processNewsletters flow: with 0 submissions -> missed month email
- processNewsletters: second Saturday guard (skip/proceed)
- cycleId calculation from date (with padding)
- Email URL construction: viewInAppUrl, unsubscribeUrl, viewCircleUrl
- UTM tracking parameter verification
- Recipient filtering: active members only
- Recipient filtering: excludes left, blocked, unsubscribed, no-email members
- Next deadline calculation for missed month email (including year rollover)

## Total: 64 tests, all passing
