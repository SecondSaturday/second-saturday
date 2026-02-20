'use client'

import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

export default function SignUpPage() {
  useAuthAnalytics()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  // Only allow internal relative paths to prevent open redirect
  const redirectUrl =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null
  const afterSignUpUrl = redirectUrl
    ? `/complete-profile?redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/complete-profile'

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignUp afterSignUpUrl={afterSignUpUrl} />
      </div>
    </AuthLayout>
  )
}
