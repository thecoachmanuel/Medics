'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { userAuthStore } from '@/store/authStore'
import type { User } from '@/lib/types'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchProfile } = userAuthStore()
  const [error, setError] = useState<string | null>(null)

  const isDoctorProfileComplete = (user: User): boolean => {
    const specializationOk = typeof user.specialization === 'string' && user.specialization.trim().length > 0;
    const qualificationOk = typeof user.qualification === 'string' && user.qualification.trim().length > 0;
    const aboutOk = typeof user.about === 'string' && user.about.trim().length > 0;

    const feesNumber = typeof user.fees === 'number' ? user.fees : Number(user.fees);
    const feesOk = Number.isFinite(feesNumber) && feesNumber > 0;

    const categoryOk = Array.isArray(user.category) && user.category.length > 0;

    const hospitalName = user.hospitalInfo?.name;
    const hospitalOk = typeof hospitalName === 'string' && hospitalName.trim().length > 0;

    return specializationOk && qualificationOk && aboutOk && feesOk && categoryOk && hospitalOk;
  };

  const isPatientProfileComplete = (user: User): boolean => {
    const phoneOk = typeof user.phone === 'string' && user.phone.trim().length > 0;
    const dobOk = typeof user.dob === 'string' && user.dob.trim().length > 0;
    const genderOk = typeof user.gender === 'string' && user.gender.trim().length > 0;

    const emergency =
      typeof user.emergencyContact === 'object' && user.emergencyContact !== null
        ? (user.emergencyContact as Record<string, unknown>)
        : null;
    const emergencyName =
      typeof emergency?.name === 'string' ? emergency.name : typeof emergency?.emergency_name === 'string' ? emergency.emergency_name : '';
    const emergencyPhone =
      typeof emergency?.phone === 'string' ? emergency.phone : typeof emergency?.emergency_phone === 'string' ? emergency.emergency_phone : '';
    const emergencyRelationship =
      typeof emergency?.relationship === 'string'
        ? emergency.relationship
        : typeof emergency?.emergency_relationship === 'string'
          ? emergency.emergency_relationship
          : '';

    const emergencyNameOk = emergencyName.trim().length > 0;
    const emergencyPhoneOk = emergencyPhone.trim().length > 0;
    const emergencyRelationshipOk = emergencyRelationship.trim().length > 0;

    const medical =
      typeof user.medicalHistory === 'object' && user.medicalHistory !== null
        ? (user.medicalHistory as Record<string, unknown>)
        : null;
    const allergies =
      typeof medical?.allergies === 'string' ? medical.allergies : typeof medical?.allergy === 'string' ? medical.allergy : '';
    const currentMedications =
      typeof medical?.currentMedications === 'string'
        ? medical.currentMedications
        : typeof medical?.current_medications === 'string'
          ? medical.current_medications
          : '';
    const chronicConditions =
      typeof medical?.chronicConditions === 'string'
        ? medical.chronicConditions
        : typeof medical?.chronic_conditions === 'string'
          ? medical.chronic_conditions
          : '';

    const allergiesOk = allergies.trim().length > 0;
    const currentMedicationsOk = currentMedications.trim().length > 0;
    const chronicConditionsOk = chronicConditions.trim().length > 0;

    return (
      phoneOk &&
      dobOk &&
      genderOk &&
      emergencyNameOk &&
      emergencyPhoneOk &&
      emergencyRelationshipOk &&
      allergiesOk &&
      currentMedicationsOk &&
      chronicConditionsOk
    );
  };

  const doctorHasSubmittedCredentials = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return false;

    const response = await fetch('/api/doctor/credentials', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return false;
    const json = (await response.json().catch(() => null)) as { credentials?: unknown } | null;
    return Array.isArray(json?.credentials) && json.credentials.length > 0;
  };

  const getPostVerifyPath = async (user: User, next: string | null): Promise<string> => {
    if (user.type === 'doctor') {
      const profileComplete = isDoctorProfileComplete(user);
      const hasCredentials = await doctorHasSubmittedCredentials();
      if (!profileComplete || !hasCredentials) return '/onboarding/doctor';
      const safeNext = next && next.startsWith('/doctor/') ? next : null;
      return safeNext || '/doctor/dashboard';
    }
    if (!isPatientProfileComplete(user)) return '/onboarding/patient';
    const safeNext = next && next.startsWith('/patient/') ? next : null;
    return safeNext || '/patient/dashboard';
  };

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

      const navigateToTarget = async (profile: User | null) => {
        if (!profile) {
          router.replace('/login/patient')
          return
        }
        const redirectPath = await getPostVerifyPath(profile, next)
        router.replace(redirectPath)
      }

      if (code) {
        try {
          // Track if recovery event fires
          let isRecoveryEvent = false;
          
          // Setup listener for recovery event
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
              isRecoveryEvent = true;
            }
          })

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError

          // If it's a recovery flow (detected by type param or next param)
          // We check this immediately to avoid unnecessary delays if params are present
          if (type === 'recovery' || next?.includes('/reset-password')) {
            router.push('/reset-password?type=recovery')
            return
          }

          // If params are missing, give a grace period for the PASSWORD_RECOVERY event to fire
          // This handles race conditions where the event fires slightly after the session exchange resolves
          await new Promise(resolve => setTimeout(resolve, 1500));

          if (isRecoveryEvent) {
             router.push('/reset-password?type=recovery')
             return
          }

          // Refresh profile
          const profile = await fetchProfile()
          await navigateToTarget(profile)
          
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
            const { error: sessionError } = await supabase.auth.getSession()
            if (!sessionError) {
                try {
                  const profile = await fetchProfile()
                  await navigateToTarget(profile)
                  return
                } catch (err: any) {
                  setError(err.message || 'Failed to fetch profile')
                  return
                }
            } else {
                setError(sessionError.message || 'Session verification failed')
                return
            }
         }

         // If no code and no hash, try to see if there is already an active session anyway
         try {
           const { data } = await supabase.auth.getSession()
           if (data.session) {
             const profile = await fetchProfile()
             await navigateToTarget(profile)
             return
           }
         } catch (err) {
           console.error('Session fallback check error', err)
         }

         // If everything else fails, wait slightly and redirect to login to avoid infinite loading
         setTimeout(() => {
           router.replace('/login/patient')
         }, 1000)
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
