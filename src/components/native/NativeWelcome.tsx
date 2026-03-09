"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDetection } from '@/hooks/use-app-detection';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';

export default function NativeWelcome() {
  const isApp = useAppDetection();
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'splash' | 'onboarding' | 'complete'>('loading');

  useEffect(() => {
    if (isApp) {
      // Start flow
      setStep('splash');

      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem('native_onboarding_completed');
        if (hasOnboarded) {
            // If already onboarded, go to login directly
            router.replace('/login/patient');
            // We keep showing splash until redirect happens
        } else {
            setStep('onboarding');
        }
      }, 2500); // Show splash for 2.5s

      return () => clearTimeout(timer);
    }
  }, [isApp, router]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('native_onboarding_completed', 'true');
    router.replace('/login');
  };

  if (!isApp) return null;

  // Render nothing while 'loading' initial state (though effect runs fast)
  if (step === 'loading') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {step === 'splash' && <SplashScreen />}
      {step === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
    </div>
  );
}
