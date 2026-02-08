'use client'

import { CSSGradientLogo } from '@/components/branding'

export default function AuthMarketingPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8">
      <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]">
        <CSSGradientLogo />
      </div>
      <p className="text-center text-lg text-muted-foreground max-w-md mt-6">
        Plan your community events with ease
      </p>
    </div>
  )
}
