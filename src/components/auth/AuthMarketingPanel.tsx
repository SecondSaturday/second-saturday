'use client'

import { AnimatedLogo } from '@/components/branding'

export default function AuthMarketingPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8">
      <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[320px] lg:h-[320px]">
        <AnimatedLogo />
      </div>
      <p className="font-serif text-center text-3xl text-muted-foreground max-w-md mt-2">
        Every month, a little closer.
      </p>
    </div>
  )
}
