'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Lock, Eye, EyeOff, Stethoscope, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

function BrandLogoLink() {
  const logo = "/MedicsOnline_logo.png";
  return (
    <Link href="/" className="inline-flex items-center justify-center gap-2 transition-transform hover:scale-105">
      <img src={logo} alt="MedicsOnline" className="h-10 w-auto" loading="eager" fetchPriority="high" decoding="async" />
    </Link>
  );
}

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let score = 0;
    if (password.length > 5) score += 1;
    if (password.length > 9) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrength(score);

    if (password.length === 0) setFeedback('');
    else if (score < 2) setFeedback('Weak');
    else if (score < 4) setFeedback('Medium');
    else setFeedback('Strong');
  }, [password]);

  const getColor = () => {
    if (strength < 2) return 'bg-red-500';
    if (strength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-1 mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Strength</span>
        <span className={`font-medium ${strength < 2 ? 'text-red-500' : strength < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
          {feedback}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getColor()}`} 
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      <ul className="text-xs text-gray-500 mt-2 space-y-1">
        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : ''}`}>
          {password.length >= 8 ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
          At least 8 characters
        </li>
        <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
          {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
          Contains a number
        </li>
        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
          {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
          Contains uppercase letter
        </li>
      </ul>
    </div>
  );
};

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecovery = searchParams.get('type') === 'recovery';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Just in case supabase session is not ready yet, retry once? 
        // Or show specific error
        setError('Invalid or expired reset link. Please try requesting a new one.');
        setVerifying(false);
      } else {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const type = profile.type as 'doctor' | 'patient';
            setUserType(type);
            
            // Only redirect to profile if not in recovery flow and user is already logged in normally
            // But if they clicked a reset link, they intend to reset, so we should probably stay here.
            // The isRecovery check handles this.
            if (!isRecovery) {
              // Check if they came from settings page
              // router.push(`/${type}/profile?section=security&type=recovery`);
              // Actually, stay here if they just navigated manually?
              // For now, let's allow them to reset if they have a session.
            }
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
        setVerifying(false);
      }
    };
    checkSession();
  }, [isRecovery, router]);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      handleRedirect();
    }
  }, [success, countdown]);

  const handleRedirect = async () => {
    // Don't sign out the user, as they just reset their password and should be logged in
    // Redirect based on user type
    if (userType === 'doctor') {
      router.push('/doctor/dashboard');
    } else if (userType === 'patient') {
      router.push('/patient/dashboard');
    } else {
      // Fallback to generic dashboard or home if type is unknown
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Ensure we have the user type for redirection
      if (!userType && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          setUserType(profile.type as 'doctor' | 'patient');
        }
      }

      setSuccess(true);
      // Countdown effect handles redirect
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Verifying security token...</p>
      </div>
    );
  }

  if (error && !loading && !success) {
      return (
        <div className="w-full max-w-md mx-auto px-4">
            <div className="text-center mb-8">
                <BrandLogoLink />
            </div>
            <Card className="w-full shadow-lg border-t-4 border-t-red-600 animate-in fade-in zoom-in duration-300">
                <CardContent className="pt-6 pb-8 px-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Link Invalid or Expired</h2>
                    <p className="text-gray-600 text-sm">
                        {error}
                    </p>
                    <div className="pt-4 space-y-3">
                        <Link href="/forgot-password" className="block w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-all">
                                Request New Link
                            </Button>
                        </Link>
                        <Link href="/login/doctor" className="block w-full">
                            <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
      )
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
            <BrandLogoLink />
        </div>
        <Card className="w-full shadow-lg border-t-4 border-t-green-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center shadow-inner">
                    <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Password Updated!</h2>
                    <p className="text-gray-600">
                        Your account has been secured with your new password.
                    </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Redirecting to login in</p>
                    <div className="text-3xl font-bold text-blue-600">{countdown}s</div>
                </div>

                <Button 
                    onClick={handleRedirect}
                    className="w-full bg-green-600 hover:bg-green-700 shadow-md transition-all h-12 text-lg"
                >
                    Go to Login Now
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <BrandLogoLink />
      </div>

      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Set New Password</CardTitle>
            <CardDescription>
                Create a strong password to protect your account
            </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative group">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                    required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all ${
                        confirmPassword && password === confirmPassword ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                    }`}
                    placeholder="••••••••"
                    required
                />
                {confirmPassword && (
                    <div className="absolute right-3 top-3">
                        {password === confirmPassword ? (
                            <Check className="h-5 w-5 text-green-500 animate-in zoom-in" />
                        ) : (
                            <X className="h-5 w-5 text-red-400 animate-in zoom-in" />
                        )}
                    </div>
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 animate-in slide-in-from-top-1">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading || password.length < 6 || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
