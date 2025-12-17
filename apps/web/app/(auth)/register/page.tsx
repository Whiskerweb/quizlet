'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { friendsService } from '@/lib/supabase/friends';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = supabaseBrowser;
  
  // Get redirect URL and invite code from query params
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const inviteCode = searchParams.get('invite');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth (disable email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: undefined, // No email confirmation
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a temporary username from email (will be replaced by first_name + last_name during onboarding)
      const tempUsername = data.email.split('@')[0] || `user_${authData.user.id.substring(0, 8)}`;

      // Use RPC function to create/update profile (bypasses RLS)
      // Note: TypeScript doesn't know about this RPC function, so we cast the entire call to bypass type checking
      // We don't set role here - it will be set during onboarding
      // Username is temporary and will be replaced during onboarding
      const { error: profileError } = await (supabase.rpc as any)('create_or_update_profile', {
        user_id: authData.user.id,
        user_email: data.email,
        user_username: tempUsername,
        user_role: 'student', // Default to student, will be updated during onboarding
        user_first_name: null,
        user_last_name: null,
      });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Database error saving new user: ${profileError.message}`);
      }

      // Fetch updated profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (fetchError) throw fetchError;

      setUser(authData.user);
      setProfile(profile);

      // If there's an invite code, use it to create friendship
      if (inviteCode) {
        try {
          console.log('[Register] Using invite code:', inviteCode);
          await friendsService.useInviteCode(inviteCode, authData.user.id);
          console.log('[Register] Friendship created successfully');
        } catch (inviteError: any) {
          console.error('[Register] Failed to use invite code:', inviteError);
          // Don't block registration if invite fails
        }
      }

      // Redirect to onboarding instead of dashboard
      router.replace('/onboarding');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with logo and back button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image 
                src="/images/logo.png" 
                alt="CARDZ Logo" 
                width={32} 
                height={32}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        <Link 
          href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
          className="text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          Already have an account? <span className="font-semibold text-brand-primary">Sign in</span>
        </Link>
      </div>

      {/* Main content - Two column layout */}
      <div className="flex min-h-screen">
        {/* Left column - Illustration placeholder (empty for now) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-12">
          {/* Placeholder for illustration - will be filled later */}
          <div className="w-full h-full flex items-center justify-center">
            {/* Empty space for future illustration */}
          </div>
        </div>

        {/* Right column - Register form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-sm text-gray-600 mb-8">
              Sign up with your account
            </p>

            {inviteCode && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6">
                🎉 Vous avez été invité ! Créez votre compte pour rejoindre votre ami.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <GoogleLoginButton 
              redirectTo="/onboarding"
              className="mb-6"
            />

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email address</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="you@example.com"
                    className="pl-12 h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="pl-12 h-12 text-base border-gray-200 focus:border-brand-primary focus:ring-brand-primary"
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
