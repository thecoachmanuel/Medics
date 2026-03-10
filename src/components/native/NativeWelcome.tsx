"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDetection } from '@/hooks/use-app-detection';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import RoleSelectionScreen from './RoleSelectionScreen';

function NativeWelcomeContent() {
  const isApp = useAppDetection();
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'splash' | 'onboarding' | 'role_selection' | 'complete'>('loading');

  useEffect(() => {
    if (isApp) {
      // Start flow
      setStep('splash');

      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem('native_onboarding_completed');
        if (hasOnboarded) {
            // If already onboarded, go to login directly
            // Check if there is a saved role preference
            const savedRole = localStorage.getItem('native_user_role');
            if (savedRole === 'doctor') {
              router.replace('/login/doctor');
            } else {
              router.replace('/login/patient');
            }
            // We keep showing splash until redirect happens
        } else {
            setStep('onboarding');
        }
      }, 2500); // Show splash for 2.5s

      return () => clearTimeout(timer);
    }
  }, [isApp, router]);

  const handleOnboardingComplete = () => {
    setStep('role_selection');
  };

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    localStorage.setItem('native_onboarding_completed', 'true');
    localStorage.setItem('native_user_role', role);
    
    if (role === 'patient') {
      router.push('/signup/patient');
    } else {
      router.push('/signup/doctor');
    }
  };

  if (!isApp) return null;

  // Render nothing while 'loading' initial state (though effect runs fast)
  if (step === 'loading') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {step === 'splash' && <SplashScreen />}
      {step === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
      {step === 'role_selection' && <RoleSelectionScreen onSelect={handleRoleSelect} />}
    </div>
  );
}

export default function NativeWelcome() {
  return (
    <Suspense fallback={null}>
      <NativeWelcomeContent />
    </Suspense>
  );
}
