'use client'

import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

function SignInContent() {
  useAuthAnalytics()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  // Only allow internal relative paths to prevent open redirect
  const redirectUrl =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null
  const signInFallbackRedirectUrl = redirectUrl || '/complete-profile'

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignIn fallbackRedirectUrl={signInFallbackRedirectUrl} />
      </div>
    </AuthLayout>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
