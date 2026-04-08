# Production Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all observability gaps so the app is production-ready — errors are captured, users are identified, performance is measured, webhook failures are surfaced, and all alerts funnel to Mattermost.

**Architecture:** Incremental hardening of existing tools. No new abstractions. Single source per concern: Sentry (errors), PostHog (analytics), Vercel Analytics (performance), Convex Dashboard (backend logs). Mattermost as unified alert hub.

**Tech Stack:** Next.js 16 (App Router), @sentry/nextjs, posthog-js, @vercel/analytics, @vercel/speed-insights, Convex, Clerk

**Spec:** `docs/superpowers/specs/2026-04-08-production-observability-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/app/error.tsx` | Add Sentry error reporting |
| Modify | `src/app/global-error.tsx` | Add Sentry error reporting + fix destructuring |
| Modify | `src/app/dashboard/error.tsx` | Add Sentry error reporting |
| Modify | `src/app/dashboard/circles/[circleId]/error.tsx` | Add Sentry error reporting |
| Modify | `src/app/providers.tsx` | Add Sentry user context hook |
| Modify | `src/app/layout.tsx` | Add Vercel Analytics + Speed Insights |
| Modify | `sentry.client.config.ts` | Add release tracking + sample rate comments |
| Modify | `sentry.server.config.ts` | Add release tracking + sample rate comments |
| Modify | `sentry.edge.config.ts` | Add release tracking + sample rate comments |
| Create | `convex/lib/sentry.ts` | Lightweight Sentry HTTP reporter for Convex |
| Modify | `convex/http.ts` | Wire webhook catch blocks to Sentry reporter |

---

### Task 1: Wire Sentry into Error Boundaries

**Files:**
- Modify: `src/app/error.tsx`
- Modify: `src/app/global-error.tsx`
- Modify: `src/app/dashboard/error.tsx`
- Modify: `src/app/dashboard/circles/[circleId]/error.tsx`

- [ ] **Step 1: Add Sentry import and useEffect to `src/app/error.tsx`**

Add `useEffect` and Sentry import. The component already destructures `error`:

```tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { digest: (error as any).digest },
    });
  }, [error]);

  return (
    // ...existing JSX unchanged
  )
}
```

- [ ] **Step 2: Fix `src/app/global-error.tsx` — destructure `error` and add Sentry**

This file currently destructures only `{ reset }` but the type includes `error`. Fix destructuring and add Sentry:

```tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { digest: (error as any).digest },
    });
  }, [error]);

  return (
    // ...existing JSX unchanged
  )
}
```

- [ ] **Step 3: Add Sentry to `src/app/dashboard/error.tsx`**

Same pattern — add `useEffect` and Sentry import:

```tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { digest: (error as any).digest },
    });
  }, [error]);

  return (
    // ...existing JSX unchanged
  )
}
```

- [ ] **Step 4: Add Sentry to `src/app/dashboard/circles/[circleId]/error.tsx`**

Same pattern:

```tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function CircleError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { digest: (error as any).digest },
    });
  }, [error]);

  return (
    // ...existing JSX unchanged
  )
}
```

- [ ] **Step 5: Verify the app builds**

Run: `npx next build`
Expected: Build succeeds with no type errors

- [ ] **Step 6: Commit**

```bash
git add src/app/error.tsx src/app/global-error.tsx src/app/dashboard/error.tsx src/app/dashboard/circles/\[circleId\]/error.tsx
git commit -m "fix: wire error boundaries to Sentry.captureException"
```

---

### Task 2: Add Sentry User Context from Clerk

**Files:**
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Add Sentry user context inside `ClerkWithTheme` component**

The `ClerkWithTheme` component in `src/app/providers.tsx` already has access to Clerk via `useAuth`. Add a `SentryUserContext` component that uses `useUser` from Clerk:

First, update the React import at the top of the file (line 3) from:
```tsx
import { Suspense } from 'react'
```
to:
```tsx
import { Suspense, useEffect } from 'react'
```

Then add these imports after the existing imports:
```tsx
import * as Sentry from '@sentry/nextjs'
```

Note: `useUser` needs to be added to the existing `@clerk/nextjs` import. Update line 5 from:
```tsx
import { ClerkProvider } from '@clerk/nextjs'
```
to:
```tsx
import { ClerkProvider, useUser } from '@clerk/nextjs'
```

Then add the `SentryUserContext` component before `ClerkWithTheme`:

```tsx
function SentryUserContext() {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username ?? undefined,
      })
    } else {
      Sentry.setUser(null)
    }
  }, [isSignedIn, user])

  return null
}
```

- [ ] **Step 2: Render `SentryUserContext` inside `ClerkWithTheme`**

Place it after `<TimezoneSync />` and before the `<Suspense>` block:

```tsx
function ClerkWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <ClerkProvider appearance={isDark ? clerkDarkAppearance : clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TimezoneSync />
        <SentryUserContext />
        <Suspense fallback={null}>
          {/* ...existing providers... */}
        </Suspense>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/providers.tsx
git commit -m "feat: set Sentry user context from Clerk session"
```

---

### Task 3: Add Vercel Analytics + Speed Insights

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install packages**

```bash
npm install @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 2: Add components to `src/app/layout.tsx`**

Add imports at the top:

```tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
```

Add components inside `<body>`, after `<Toaster>`:

```tsx
<body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${courierPrime.variable} antialiased`}>
  <Providers>{children}</Providers>
  <Toaster position="top-center" duration={2000} />
  <Analytics />
  <SpeedInsights />
</body>
```

- [ ] **Step 3: Verify the app builds**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx package.json package-lock.json
git commit -m "feat: add Vercel Analytics and Speed Insights"
```

---

### Task 4: Add Sentry Release Tracking + Sample Rate Comments

**Files:**
- Modify: `sentry.client.config.ts`
- Modify: `sentry.server.config.ts`
- Modify: `sentry.edge.config.ts`

- [ ] **Step 1: Update `sentry.client.config.ts`**

Replace the entire file contents with the following:

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // 100% trace sampling — appropriate for <1K users.
  // Reduce to 0.2 when scaling past 1K MAU.
  tracesSampleRate: 1,

  debug: false,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

- [ ] **Step 2: Update `sentry.server.config.ts`**

Replace the entire file contents with:

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // 100% trace sampling — appropriate for <1K users.
  // Reduce to 0.2 when scaling past 1K MAU.
  tracesSampleRate: 1,

  debug: false,
})
```

- [ ] **Step 3: Update `sentry.edge.config.ts`**

Replace the entire file contents with:

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // 100% trace sampling — appropriate for <1K users.
  // Reduce to 0.2 when scaling past 1K MAU.
  tracesSampleRate: 1,

  debug: false,
})
```

- [ ] **Step 4: Verify the app builds**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts
git commit -m "feat: add Sentry release tracking via Vercel git SHA"
```

---

### Task 5: Create Convex Sentry Error Reporter

**Files:**
- Create: `convex/lib/sentry.ts`

- [ ] **Step 1: Create `convex/lib/` directory**

```bash
mkdir -p convex/lib
```

- [ ] **Step 2: Create `convex/lib/sentry.ts`**

```ts
function parseDsn(dsn: string) {
  const url = new URL(dsn)
  return {
    key: url.username,
    host: `${url.protocol}//${url.host}`,
    projectId: url.pathname.replace('/', ''),
  }
}

export async function reportErrorToSentry(
  error: unknown,
  context: { handler: string; event?: string }
): Promise<void> {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  const { key, host, projectId } = parseDsn(dsn)
  const storeUrl = `${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorType = error instanceof Error ? error.constructor.name : 'Error'
  const stackTrace = error instanceof Error ? error.stack : undefined

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    logger: 'convex',
    tags: {
      handler: context.handler,
      ...(context.event && { event: context.event }),
      runtime: 'convex',
    },
    exception: {
      values: [
        {
          type: errorType,
          value: errorMessage,
          ...(stackTrace && {
            stacktrace: {
              frames: [
                {
                  filename: context.handler,
                  function: 'handler',
                  raw: stackTrace,
                },
              ],
            },
          }),
        },
      ],
    },
  }

  try {
    await fetch(storeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Best-effort — don't let reporting failures break the webhook handler
    console.error('Failed to report error to Sentry')
  }
}
```

- [ ] **Step 3: Verify Convex type-checks**

Run: `npx convex typecheck`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add convex/lib/sentry.ts
git commit -m "feat: add lightweight Sentry HTTP reporter for Convex runtime"
```

---

### Task 6: Wire Convex Webhook Handlers to Sentry Reporter

**Files:**
- Modify: `convex/http.ts`

- [ ] **Step 1: Import the reporter at the top of `convex/http.ts`**

Add after existing imports (line 4):

```ts
import { reportErrorToSentry } from './lib/sentry'
```

- [ ] **Step 2: Wrap Clerk webhook error handling**

Find the Clerk webhook's catch block (line 53-56). After `console.error('Webhook verification failed:', err)`, add Sentry reporting:

```ts
    } catch (err) {
      console.error('Webhook verification failed:', err)
      await reportErrorToSentry(err, { handler: 'clerk-webhook', event: 'verification' })
      return new Response('Invalid signature', { status: 400 })
    }
```

Also wrap the entire Clerk switch block in a try-catch to capture mutation failures. After the switch statement (around line 109), before the success response:

Find the section from `const { type, data } = payload` (line 58) through the switch block ending at line 109. Wrap the switch in try-catch:

```ts
    const { type, data } = payload

    try {
      switch (type) {
        // ...existing cases unchanged...
      }
    } catch (err) {
      console.error('Clerk webhook handler failed:', err)
      await reportErrorToSentry(err, { handler: 'clerk-webhook', event: type })
      return new Response('Internal error', { status: 500 })
    }
```

- [ ] **Step 3: Wrap Mux webhook error handling**

Same pattern for the Mux webhook handler. The signature verification failure (line 142) and the switch block (lines 162-209) need wrapping:

After `console.error('Mux webhook signature verification failed')` (line 143), add:

```ts
      console.error('Mux webhook signature verification failed')
      await reportErrorToSentry(new Error('Mux webhook signature verification failed'), {
        handler: 'mux-webhook',
        event: 'verification',
      })
```

Wrap the Mux switch block in try-catch:

```ts
    try {
      switch (payload.type) {
        // ...existing cases unchanged...
      }
    } catch (err) {
      console.error('Mux webhook handler failed:', err)
      await reportErrorToSentry(err, { handler: 'mux-webhook', event: payload.type })
      return new Response('Internal error', { status: 500 })
    }
```

- [ ] **Step 4: Verify Convex type-checks**

Run: `npx convex typecheck`
Expected: No type errors

- [ ] **Step 5: Verify the app builds**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add convex/http.ts
git commit -m "feat: forward Convex webhook errors to Sentry"
```

---

### Task 7: Mattermost Webhook Setup (Manual Configuration)

No code changes — this is a dashboard configuration checklist. Perform these steps in the respective tool UIs.

- [ ] **Step 1: Create Mattermost incoming webhooks**

In Mattermost System Console → Integrations → Incoming Webhooks:
1. Create webhook for `#errors` channel → copy URL
2. Create webhook for `#analytics` channel → copy URL
3. Create webhook for `#deploys` channel → copy URL

Enable Slack-compatible mode in System Console → Integrations → Integration Management.

- [ ] **Step 2: Configure Sentry → Mattermost**

In Sentry dashboard:
1. Settings → Integrations → Webhooks → add `#errors` webhook URL
2. Alerts → Create Alert Rule:
   - When: "A new issue is created"
   - Action: "Send a notification via webhooks"
3. Create second rule:
   - When: "An issue changes state from resolved to unresolved" (regression)
   - Action: "Send a notification via webhooks"

- [ ] **Step 3: Configure PostHog → Mattermost**

In PostHog dashboard:
1. Data Pipelines → Destinations → Webhook
2. Add `#analytics` Slack-compatible webhook URL
3. Configure to fire on: `user_signed_up` events

- [ ] **Step 4: Configure Vercel → Mattermost**

In Vercel project dashboard:
1. Settings → Webhooks → add `#deploys` Slack-compatible webhook URL
2. Select events: deployment.created, deployment.succeeded, deployment.error
3. Account Settings → Notifications → disable email notifications for deployments

- [ ] **Step 5: Set Convex environment variable**

In Convex dashboard:
1. Settings → Environment Variables
2. Add `SENTRY_DSN` with value from your `.env.local` (`NEXT_PUBLIC_SENTRY_DSN` value)

- [ ] **Step 6: Test each channel**

1. Trigger a test error in the app → verify Sentry alert arrives in `#errors`
2. Sign up a test user → verify PostHog alert arrives in `#analytics`
3. Push a deployment → verify Vercel notification arrives in `#deploys`

- [ ] **Step 7: Verify `SENTRY_AUTH_TOKEN` is set in Vercel**

In Vercel dashboard:
1. Project Settings → Environment Variables
2. Confirm `SENTRY_AUTH_TOKEN` exists (needed for source map uploads tied to releases)

---

## Summary

| Task | Type | Risk | Estimated Effort |
|------|------|------|-----------------|
| 1. Error boundaries → Sentry | Code | Low | Small — 4 files, same pattern |
| 2. Sentry user context | Code | Low | Small — 1 file, 1 component |
| 3. Vercel Analytics | Code | None | Tiny — 2 imports |
| 4. Release tracking | Code | Low | Tiny — 1 line × 3 files |
| 5. Convex Sentry reporter | Code | Medium | Small — new utility |
| 6. Webhook error wiring | Code | Medium | Medium — modifying HTTP handlers |
| 7. Mattermost setup | Config | Low | Manual dashboard work |

Tasks 1-4 are independent and can be parallelized. Tasks 5-6 are sequential (6 depends on 5). Task 7 can run in parallel with everything but Step 5 (Convex env var) should happen before testing Task 6.
