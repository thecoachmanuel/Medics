'use client'
import { userAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const isDoctorOnboardingComplete = (user: { specialization?: string; category?: unknown; qualification?: string; fees?: unknown; about?: string; hospitalInfo?: unknown }): boolean => {
  const specializationOk = typeof user.specialization === 'string' && user.specialization.trim().length > 0;
  const qualificationOk = typeof user.qualification === 'string' && user.qualification.trim().length > 0;
  const aboutOk = typeof user.about === 'string' && user.about.trim().length > 0;

  const feesNumber = typeof user.fees === 'number' ? user.fees : typeof user.fees === 'string' ? Number(user.fees) : NaN;
  const feesOk = Number.isFinite(feesNumber) && feesNumber > 0;

  const categoryOk = Array.isArray(user.category) && user.category.length > 0;

  const hospitalName =
    typeof user.hospitalInfo === 'object' && user.hospitalInfo !== null
      ? (user.hospitalInfo as { name?: unknown }).name
      : undefined;
  const hospitalOk = typeof hospitalName === 'string' && hospitalName.trim().length > 0;

  return specializationOk && qualificationOk && aboutOk && feesOk && categoryOk && hospitalOk;
}

const isPatientOnboardingComplete = (user: { phone?: unknown; dob?: unknown; gender?: unknown; emergencyContact?: unknown; medicalHistory?: unknown }): boolean => {
  const phoneOk = typeof user.phone === 'string' && user.phone.trim().length > 0;
  const dobOk = typeof user.dob === 'string' && user.dob.trim().length > 0;
  const genderOk = typeof user.gender === 'string' && user.gender.trim().length > 0;

  const emergency = typeof user.emergencyContact === 'object' && user.emergencyContact !== null
    ? (user.emergencyContact as { name?: unknown; phone?: unknown; relationship?: unknown })
    : null;
  const emergencyNameOk = typeof emergency?.name === 'string' && emergency.name.trim().length > 0;
  const emergencyPhoneOk = typeof emergency?.phone === 'string' && emergency.phone.trim().length > 0;
  const emergencyRelationshipOk = typeof emergency?.relationship === 'string' && emergency.relationship.trim().length > 0;

  const medical = typeof user.medicalHistory === 'object' && user.medicalHistory !== null
    ? (user.medicalHistory as { allergies?: unknown; currentMedications?: unknown; chronicConditions?: unknown })
    : null;
  const allergiesOk = typeof medical?.allergies === 'string' && medical.allergies.trim().length > 0;
  const currentMedicationsOk = typeof medical?.currentMedications === 'string' && medical.currentMedications.trim().length > 0;
  const chronicConditionsOk = typeof medical?.chronicConditions === 'string' && medical.chronicConditions.trim().length > 0;

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
}

const layout = ({children}:{children:React.ReactNode}) => {

 const {isAuthenticated,user} = userAuthStore();
 const pathname = usePathname();
 const router = useRouter();

  useEffect(() => {
    // Don't redirect if on reset-password page
    if (pathname?.includes('/reset-password')) return;

    if(isAuthenticated &&  user) {
      if (user.type === 'doctor') {
        router.replace(isDoctorOnboardingComplete(user) ? '/doctor/dashboard' : '/onboarding/doctor');
        return;
      }

      router.replace(isPatientOnboardingComplete(user) ? '/patient/dashboard' : '/onboarding/patient');
    }
  },[isAuthenticated,user,pathname,router])
  return (
    <div className='min-h-screen flex'>
     
     <div className='w-full lg:w-1/2 flex items-center justify-center p-6 bg-white'>
      {children}
     </div>

     <div className='hidden lg:block w-1/2 relative overflow-hidden'>
         <div className='absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent z-10'>
         </div>
         <div className='w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center'>
            <div className='text-center text-white p-8 max-w-md'>
              <div className='w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop:blur-sm'>
                         <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>

              </div>
              <h2 className='text-4xl font-bold mb-4'>Welcome to MedicsOnline</h2>
              <p className='text-xl opacity-90 mb-4'>Your health, our priority</p>
             <p className='text-lg opacity-75'>
                Connecting patients with certified healthcare providers for quality medical consultations.
             </p>
            </div>
         </div>
     </div>
    </div>
  )
}

export default layout
