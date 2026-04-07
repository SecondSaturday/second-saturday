'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CreationProgressBar } from './CreationProgressBar'

interface CreationLayoutProps {
  step: number
  backHref: string
  children: React.ReactNode
  footer: React.ReactNode
}

export function CreationLayout({ step, backHref, children, footer }: CreationLayoutProps) {
  return (
    <div className="safe-area-top flex h-dvh flex-col bg-background">
      {/* Mobile header */}
      <div className="shrink-0 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={backHref}>
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
          <span className="text-[15px] font-medium text-foreground">Create Circle</span>
        </div>
        <CreationProgressBar currentStep={step} />
      </div>

      {/* Desktop: back arrow + centered card */}
      <div className="hidden flex-1 flex-col md:flex">
        <div className="px-8 py-6">
          <Link href={backHref}>
            <ArrowLeft className="size-5 text-foreground" />
          </Link>
        </div>
        <div className="flex flex-1 justify-center overflow-y-auto px-4 pb-8">
          <div className="flex w-full max-w-[560px] flex-col rounded-2xl bg-card shadow-sm">
            <CreationProgressBar currentStep={step} />
            <div className="flex flex-1 flex-col px-10 pb-10 pt-4">{children}</div>
            <div className="px-10 pb-10">{footer}</div>
          </div>
        </div>
      </div>

      {/* Mobile content */}
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-24 md:hidden">{children}</div>

      {/* Mobile fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-5 pb-6 pt-4 md:hidden">
        {footer}
      </div>
    </div>
  )
}
