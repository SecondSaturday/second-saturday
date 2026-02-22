---
issue: 100
stream: Integration Tests — Convex Functions
agent: backend-specialist
started: 2026-02-22T05:14:57Z
status: completed
updated: 2026-02-22T05:18:30Z
---

# Stream B: Integration Tests — Convex Functions

## Scope
Test Convex query/mutation logic: getNewsletterById, getNewslettersByCircle, unsubscribe/resubscribe, compileNewsletter, sendNewsletter, processNewsletters cron, extend newsletterReads tests.

## Files
- `test/integration/newsletters.test.ts` (new - created)
- `test/integration/newsletterReads.test.ts` (reviewed - no gaps found, existing coverage is sufficient)

## Completed
All 62 tests pass.

### Tests Written in `test/integration/newsletters.test.ts`

#### getNewsletterById (6 tests)
- Returns newsletter data with circle info (name, icon)
- Returns null icon/cover URLs when circle has no images
- Returns null when newsletter does not exist
- Includes read status true when user has read the newsletter
- Includes read status false when user has not read the newsletter
- Distinguishes reads by different users

#### getNewslettersByCircle (5 tests)
- Returns only published newsletters
- Sorts newest first by publishedAt descending
- Falls back to createdAt when publishedAt is missing
- Includes read status per newsletter
- Returns empty array when no published newsletters

#### getLatestNewsletter (4 tests)
- Returns most recent published newsletter
- Returns null when latest newsletter is not published
- Returns null when no newsletters exist
- Includes isRead status

#### unsubscribeFromEmail / resubscribeToEmail (4 tests)
- Sets emailUnsubscribed to true on unsubscribe
- Removes emailUnsubscribed on resubscribe
- Unsubscribe is idempotent
- Resubscribe after unsubscribe restores original state

#### compileNewsletter (14 tests)
- Produces correct section structure with promptText and responses
- Groups responses by prompt
- Skips inactive prompts with no responses
- Skips active prompts with no responses
- Includes media URLs in responses
- Calculates correct issue number (existing count + 1)
- Issue number is 1 when no existing newsletters
- Stores result as JSON string in htmlContent field
- Generates correct title from circle name and cycleId
- Generates correct title for December
- Generates correct title for January
- Counts only active members (excludes leftAt)
- Counts only locked submissions for the cycle
- Sets missedMonth true/false based on submission count
- Uses "Unknown Member" fallback

#### isSecondSaturday / processNewsletters (7 tests)
- Identifies second Saturday correctly (multiple dates)
- Rejects first Saturday (day < 8)
- Rejects third Saturday (day > 14)
- Rejects non-Saturday dates
- Rejects Sunday even if day is in range
- Accepts day 8 when it is a Saturday

#### getAllActiveCircles (3 tests)
- Excludes archived circles
- Returns all circles when none archived
- Returns empty when all archived

#### getNewsletterSendData (2 tests)
- Returns newsletter, circle info, and subscriber list
- Returns null iconUrl when circle has no icon

#### getCircleSendData (5 tests)
- Returns only active, email-subscribed members
- Excludes members with leftAt
- Excludes unsubscribed members
- Excludes blocked members
- Skips members without email

#### updateRecipientCount (2 tests)
- Patches newsletter with member count
- Preserves all other newsletter fields

#### processNewsletters flow logic (4 tests)
- Triggers missed-month flow for circles with 0 submissions
- Triggers normal send flow for circles with submissions
- Calculates cycleId correctly as YYYY-MM
- Pads single-digit months with leading zero

#### sendNewsletter email construction (1 test)
- Constructs correct email data structure (subject line, URLs, date formatting)

#### Cron schedule configuration (3 tests)
- Lock submissions cron runs at 10:59 UTC on Saturdays
- Newsletter processing cron runs at 11:00 UTC on Saturdays
- Newsletter processing runs after lock submissions
