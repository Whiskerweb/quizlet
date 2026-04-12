import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Server-side OAuth callback handler (/auth/callback)
 * 
 * This route handles the complete OAuth flow server-side:
 * 1. Exchange the authorization code for a session (sets cookies)
 * 2. Load or create the user profile
 * 3. Redirect to the appropriate destination
 * 
 * CRITICAL: The code exchange MUST happen server-side with @supabase/ssr
 * so that auth cookies are properly set in the HTTP response headers.
 * Without this, the middleware won't see any session on page refresh.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect_to') || searchParams.get('next') || '/dashboard';

  if (!code) {
    console.error('[Auth Callback] No code parameter found');
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();

    // Step 1: Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    // Step 2: Get the user from the newly created session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[Auth Callback] Get user error:', userError?.message);
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    // Step 3: Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('id', user.id)
      .single();

    // Step 4: Create profile if it doesn't exist
    if (!profile) {
      const baseUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
      await supabase.rpc('create_or_update_profile', {
        user_id: user.id,
        user_email: user.email || '',
        user_username: baseUsername,
        user_role: 'student',
        user_first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
        user_last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
      });

      // New user always needs onboarding
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Step 5: Check if onboarding is needed
    const needsOnboarding = !profile.role || !profile.first_name || !profile.last_name;

    if (needsOnboarding) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Step 6: Redirect to the intended destination
    // Validate the redirect URL for security
    const isValidRedirect = redirectTo.startsWith('/') ||
      /^https:\/\/([a-z0-9-]+\.)?cardz\.dev(\/.*)?$/.test(redirectTo);

    const finalRedirect = isValidRedirect ? redirectTo : '/dashboard';

    if (finalRedirect.startsWith('http')) {
      return NextResponse.redirect(finalRedirect);
    }

    return NextResponse.redirect(`${origin}${finalRedirect}`);
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err);
    return NextResponse.redirect(`${origin}/login?error=unexpected`);
  }
}
