---
issue: 5
stream: All Streams Combined
agent: fullstack-specialist
started: 2026-02-07T05:22:45Z
status: blocked
---

# Issue #5: Integrate Clerk Authentication

## Completed Work
- [x] Stream A: Installed @clerk/nextjs, updated providers.tsx with ClerkProvider
- [x] Stream B: Created middleware.ts with route protection
- [x] Stream C: Updated convex/http.ts with webhook verification, created convex/users.ts
- [x] Stream D: Created sign-in and sign-up pages

## Files Created/Modified
- `src/app/providers.tsx` - Updated with ClerkProvider + ConvexProviderWithClerk
- `src/middleware.ts` - Route protection middleware
- `convex/users.ts` - User mutations (upsert, delete, queries)
- `convex/http.ts` - Updated Clerk webhook with svix verification
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- `package.json` - Added @clerk/nextjs, svix

## Blocking Issue
Build fails because Clerk environment variables are not configured.

**Required environment variables** (add to .env.local):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

## Next Steps
1. Go to https://dashboard.clerk.com
2. Create an application (or use existing)
3. Copy Publishable Key and Secret Key from API Keys
4. Add to .env.local
5. Enable Google OAuth in Clerk dashboard
6. Enable Apple Sign-In (requires Apple Developer account)
7. Set up webhook endpoint pointing to Convex HTTP action
