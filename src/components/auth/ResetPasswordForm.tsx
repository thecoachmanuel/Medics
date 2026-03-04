'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Lock, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

function BrandLogoLink() {
  const [logo, setLogo] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch('/api/homepage');
        if (!res.ok) return;
        const json = (await res.json()) as { config?: { headerLogoUrl?: string | null } };
        if (mounted) setLogo(json?.config?.headerLogoUrl ?? null);
      } catch {}
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <Link href="/" className="inline-flex items-center justify-center gap-2">
      {logo ? (
        <img src={logo} alt="MedicsOnline" className="h-9 w-auto" />
      ) : (
        <>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">MedicsOnline</span>
        </>
      )}
    </Link>
  );
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please try again.');
        setVerifying(false);
      } else {
        // Fetch user profile to determine type
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const type = profile.type as 'doctor' | 'patient';
            setUserType(type);
            
            // Only redirect to profile if not in recovery flow
            if (!isRecovery) {
              router.push(`/${type}/profile?section=security&type=recovery`);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
        setVerifying(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      
      // Sign out and redirect to appropriate login page
      setTimeout(async () => {
        await supabase.auth.signOut();
        const loginPath = userType === 'doctor' ? '/login/doctor' : '/login/patient';
        // Fallback to generic login if type is unknown, though we try to fetch it
        router.push(loginPath === '/login/patient' && !userType ? '/login/doctor' : loginPath); 
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Verifying reset link...</p>
      </div>
    );
  }

  if (error && !loading && !success) {
      return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <BrandLogoLink />
            </div>
            <Card className="w-full shadow-lg border-t-4 border-t-red-600">
                <CardContent className="pt-6 pb-8 px-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Link Invalid or Expired</h2>
                    <p className="text-gray-600">
                        {error}
                    </p>
                    <div className="pt-4 space-y-3">
                        <Link href="/forgot-password">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                Request New Link
                            </Button>
                        </Link>
                        <Link href="/login/doctor">
                            <Button variant="outline" className="w-full">
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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <BrandLogoLink />
        </div>
        <Card className="w-full shadow-lg border-t-4 border-t-green-600">
            <CardContent className="pt-6 pb-8 px-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Password Reset Successful</h2>
                <p className="text-gray-600">
                    Your password has been updated successfully. You will be redirected to the login page shortly.
                </p>
                <div className="pt-4">
                    <Link href="/login/doctor">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <BrandLogoLink />
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
          <p className="text-gray-600 mb-6">Please enter your new password below.</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus-visible:ring-0 pr-10"
                    required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus-visible:ring-0"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
