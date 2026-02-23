'use client'

import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { useAuth } from '@clerk/nextjs'
import { ThemeProvider, useTheme } from 'next-themes'
import { PostHogProvider } from '@/providers/posthog-provider'
import { OneSignalProvider } from '@/providers/onesignal-provider'
import { CapacitorProvider } from '@/providers/capacitor-provider'
import { useTimezoneSync } from '@/hooks/useTimezoneSync'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// tweakcn 2s6y theme colors for Clerk
const clerkAppearance = {
  variables: {
    colorPrimary: '#953FE3',
    colorTextOnPrimaryBackground: '#f8f3ff',
    colorBackground: '#f8f1f1',
    colorInputBackground: '#f8f1f1',
    colorInputText: '#291334',
    colorText: '#291334',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-instrument-sans), ui-sans-serif, sans-serif',
  },
}

const clerkDarkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#953FE3',
    colorTextOnPrimaryBackground: '#f8f3ff',
    colorBackground: '#1f1e1e',
    colorInputBackground: '#322f2f',
    colorInputText: '#efe6e6',
    colorText: '#efe6e6',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-instrument-sans), ui-sans-serif, sans-serif',
  },
}

function TimezoneSync() {
  useTimezoneSync()
  return null
}

function ClerkWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <ClerkProvider appearance={isDark ? clerkDarkAppearance : clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TimezoneSync />
        <Suspense fallback={null}>
          <PostHogProvider>
            <OneSignalProvider>
              <CapacitorProvider>{children}</CapacitorProvider>
            </OneSignalProvider>
          </PostHogProvider>
        </Suspense>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ClerkWithTheme>{children}</ClerkWithTheme>
    </ThemeProvider>
  )
}
