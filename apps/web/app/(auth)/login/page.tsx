'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  
  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      setUser(authData.user);
      setProfile(profile);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)]">
        <Card className="w-full max-w-md border border-gray-200 shadow-sm">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
            <CardTitle className="text-[20px] sm:text-[24px] font-bold text-white">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-[13px] sm:text-[14px]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="h-10 sm:h-11 text-[14px] sm:text-[15px]"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="h-10 sm:h-11 text-[14px] sm:text-[15px]"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-10 sm:h-11 text-[14px] sm:text-[15px] font-medium" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-center text-[12px] sm:text-sm text-gray-600 pt-2">
              Don&apos;t have an account?{' '}
              <Link href={`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-brand-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)]">
          <Card className="w-full max-w-md border border-gray-200 shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
              <CardTitle className="text-[20px] sm:text-[24px] font-bold text-white">
                Sign in to your account
              </CardTitle>
            </CardHeader>
            <div className="p-4 sm:p-6">
              <p className="text-center text-gray-600 text-[14px] sm:text-[15px]">Loading...</p>
            </div>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

