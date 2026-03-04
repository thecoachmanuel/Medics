'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Stethoscope } from 'lucide-react';
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

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <BrandLogoLink />
        </div>
        <Card className="w-full shadow-lg border-t-4 border-t-blue-600">
            <CardContent className="pt-6 pb-8 px-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="text-gray-600">
                    If an account exists for <span className="font-semibold text-gray-900">{email}</span>, 
                    we've sent a password reset link.
                </p>
                <p className="text-sm text-gray-500">
                    Please check your inbox and spam folder. The link will expire in 1 hour.
                </p>
                <div className="pt-4">
                    <Link href="/login/doctor">
                        <Button variant="outline" className="w-full">
                            Back to Login
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus-visible:ring-0"
                placeholder="doctor@example.com"
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
                  Sending link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login/doctor"
              className="text-sm text-gray-600 hover:text-blue-600 hover:underline flex items-center justify-center gap-1"
            >
              <span>&larr;</span> Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
