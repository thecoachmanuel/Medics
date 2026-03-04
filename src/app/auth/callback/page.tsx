'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { userAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchProfile } = userAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code')
      const type = searchParams.get('type') // Check for recovery type
      const next = searchParams.get('next')
      const errorDescription = searchParams.get('error_description')
      
      if (errorDescription) {
        setError(errorDescription)
        return
      }

      if (code) {
        try {
          // Setup listener for recovery event
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
              router.push('/reset-password')
            }
          })

          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error

          // If it's a recovery flow (detected by type param or next param)
          if (type === 'recovery' || next?.includes('/reset-password')) {
            // Fetch profile to determine user type
            const user = await fetchProfile()
            if (user) {
                // Redirect to the appropriate profile page security section
                router.push(`/${user.type}/profile?section=security&type=recovery`)
            } else {
                // Fallback to generic reset password page if profile fetch fails
                router.push('/reset-password')
            }
            return
          }

          // Refresh profile
          await fetchProfile()
          
          // Redirect to dashboard or next page
          router.push(next || '/dashboard') 
          
          // Clean up subscription
          setTimeout(() => {
            subscription.unsubscribe()
          }, 1000)

        } catch (err: any) {
          console.error('Auth callback error:', err)
          setError(err.message || 'Failed to verify email')
        }
      } else {
         // Check for hash parameters (implicit flow)
         // Supabase might redirect with #access_token=... if PKCE is off
         // But we can't easily access hash in server component, this is client component so we can
         const hash = window.location.hash
         if (hash && hash.includes('access_token')) {
            const { error } = await supabase.auth.getSession()
            if (!error) {
                await fetchProfile()
                router.push('/dashboard')
                return
            }
         }

         // If no code and no hash, redirect to login
         // But give it a moment in case of slow hydration or something
         // router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, fetchProfile])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Verifying your email...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
