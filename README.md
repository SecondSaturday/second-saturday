# Second Saturday

A Next.js application with Convex backend, Clerk authentication, and Capacitor mobile support.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Convex (database, serverless functions, file storage)
- **Auth**: Clerk (email, Google, Apple OAuth)
- **Email**: Resend
- **Video**: Mux
- **Push Notifications**: OneSignal
- **Mobile**: Capacitor (iOS, Android)
- **Monitoring**: Sentry (errors) + PostHog (analytics)
- **Hosting**: Vercel

## Prerequisites

- Node.js 20+ LTS
- pnpm 9+
- macOS (required for iOS development)
- Xcode 15+ (for iOS builds)
- Android Studio (for Android builds)

### Required Accounts

- [Convex](https://convex.dev) - Database & backend
- [Clerk](https://clerk.com) - Authentication
- [Resend](https://resend.com) - Email delivery
- [Mux](https://mux.com) - Video processing
- [OneSignal](https://onesignal.com) - Push notifications
- [Sentry](https://sentry.io) - Error tracking
- [PostHog](https://posthog.com) - Analytics
- [Vercel](https://vercel.com) - Hosting

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/SecondSaturday/second-saturday.git
cd second-saturday
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in your API keys and secrets in `.env.local`. See [Environment Variables](#environment-variables) for details.

### 3. Start Convex Backend

```bash
npx convex dev
```

This will:
- Connect to your Convex deployment
- Sync your schema and functions
- Watch for changes

### 4. Start Development Server

In a new terminal:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

### Convex

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Your Convex deployment ID |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL |

Get these from: [Convex Dashboard](https://dashboard.convex.dev)

### Clerk

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public key for client-side |
| `CLERK_SECRET_KEY` | Secret key for server-side |
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret |

Get these from: Clerk Dashboard > API Keys

### Resend

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key for sending emails |
| `RESEND_FROM_EMAIL` | Verified sender email address |

Get these from: [Resend Dashboard](https://resend.com/api-keys)

### Mux

| Variable | Description |
|----------|-------------|
| `MUX_TOKEN_ID` | API token ID |
| `MUX_TOKEN_SECRET` | API token secret |
| `MUX_WEBHOOK_SECRET` | Webhook signing secret |

Get these from: [Mux Dashboard](https://dashboard.mux.com/settings/api-keys)

### OneSignal

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | App ID for push notifications |
| `ONESIGNAL_REST_API_KEY` | REST API key |

Get these from: [OneSignal Dashboard](https://app.onesignal.com)

### Sentry

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Data Source Name for error capture |
| `SENTRY_AUTH_TOKEN` | Auth token for source map uploads (CI only) |

Get these from: Sentry > Project Settings > Client Keys

### PostHog

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | API host (default: `https://us.i.posthog.com`) |

Get these from: [PostHog Dashboard](https://app.posthog.com/project/settings)

## Development

### Commands

```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Type check
pnpm type-check

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build
```

### Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utility functions
│   └── providers/       # React context providers
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── functions/       # Server functions
│   └── http.ts          # HTTP endpoints & webhooks
├── e2e/                 # Playwright E2E tests
├── test/                # Vitest unit tests
├── ios/                 # iOS Capacitor project
└── android/             # Android Capacitor project
```

## Mobile Development

### iOS

```bash
# Build web assets
pnpm build

# Sync to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Build and run from Xcode on simulator or device.

### Android

```bash
# Build web assets
pnpm build

# Sync to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

Build and run from Android Studio on emulator or device.

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e -- --ui

# Debug mode
pnpm test:e2e -- --debug
```

## Deployment

### Vercel (Automatic)

Push to `main` branch triggers automatic deployment to Vercel.

### Manual Deployment

```bash
# Build
pnpm build

# Deploy to Vercel
vercel --prod
```

### Required Vercel Environment Variables

Add all environment variables from `.env.example` to your Vercel project:
- Settings > Environment Variables
- Add for Production and Preview environments

## CI/CD

GitHub Actions runs on every PR:
- Lint
- Type Check
- Build
- Unit Tests
- E2E Tests

Branch protection requires all checks to pass before merging.

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push and create PR: `git push -u origin feat/your-feature`
4. Wait for CI checks to pass
5. Request review and merge

## License

Private - All rights reserved.
