import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Server-side OAuth callback handler
 * 
 * This route handles the OAuth code exchange server-side,
 * which is CRITICAL for @supabase/ssr to properly set auth cookies.
 * Without this, the session cookies are never set in the HTTP response,
 * and the middleware will see no session on refresh → logout.
 * 
 * Flow:
 * 1. Supabase redirects here with ?code=xxx after OAuth
 * 2. We exchange the code for a session server-side
 * 3. The session cookies are set in the response headers
 * 4. We redirect to the client-side callback page for profile handling
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? searchParams.get('redirect_to') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After successful code exchange, redirect to the client page
      // for profile loading / onboarding checks
      const forwardUrl = `${origin}/auth/callback?exchanged=true&redirect_to=${encodeURIComponent(next)}`;
      return NextResponse.redirect(forwardUrl);
    }
  }

  // If code exchange failed or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
