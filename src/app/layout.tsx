import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, Courier_Prime } from 'next/font/google'
import { Toaster } from 'sonner'
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
  title: 'Second Saturday',
  description: 'Second Saturday Application',
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
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no"
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${courierPrime.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
