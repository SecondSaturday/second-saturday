'use client'

import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

function SignUpContent() {
  useAuthAnalytics()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  // Only allow internal relative paths to prevent open redirect
  const redirectUrl =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null
  const signUpForceRedirectUrl = redirectUrl
    ? `/complete-profile?redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/complete-profile'

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignUp forceRedirectUrl={signUpForceRedirectUrl} />
      </div>
    </AuthLayout>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  )
}
