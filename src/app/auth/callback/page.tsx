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
      const errorDescription = searchParams.get('error_description')
      
      if (errorDescription) {
        setError(errorDescription)
        return
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error

          // Refresh profile
          await fetchProfile()
          
          // Redirect to dashboard or next page
          const next = searchParams.get('next')
          router.push(next || '/dashboard') 
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
