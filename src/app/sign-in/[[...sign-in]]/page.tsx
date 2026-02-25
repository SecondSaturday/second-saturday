'use client'

import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

export default function SignInPage() {
  useAuthAnalytics()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  // Only allow internal relative paths to prevent open redirect
  const redirectUrl =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null
  const afterSignInUrl = redirectUrl || '/dashboard'

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignIn afterSignInUrl={afterSignInUrl} />
      </div>
    </AuthLayout>
  )
}
