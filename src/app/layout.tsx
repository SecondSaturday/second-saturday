import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, Courier_Prime } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import './globals.css'

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
})

const courierPrime = Courier_Prime({
  variable: '--font-courier-prime',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Second Saturday',
    template: '%s | Second Saturday',
  },
  description: 'Connect meaningfully, once a month.',
  metadataBase: new URL('https://secondsaturday.app'),
  applicationName: 'Second Saturday',
  authors: [{ name: 'Second Saturday' }],
  keywords: ['circles', 'community', 'monthly newsletter', 'friends', 'connection'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Second Saturday',
    title: 'Second Saturday',
    description: 'Connect meaningfully, once a month.',
    url: 'https://secondsaturday.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Second Saturday',
    description: 'Connect meaningfully, once a month.',
  },
  appleWebApp: {
    capable: true,
    title: 'Second Saturday',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no"
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${courierPrime.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-center" duration={2000} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
