import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();

    const callbackUrl = new URL(request.url);
    const isProduction = callbackUrl.hostname.endsWith('.cardz.dev') || callbackUrl.hostname === 'cardz.dev';
    const cookieDomain = isProduction ? '.cardz.dev' : undefined;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options, ...(cookieDomain && { domain: cookieDomain }) });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options, ...(cookieDomain && { domain: cookieDomain }) });
          },
        },
      }
    );

    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    if (session) {
      // Small wait/retry to ensure database triggers have finished creating the profile
      let profile = null;
      let retries = 3;

      while (retries > 0 && !profile) {
        console.log(`[Auth Callback] Checking for profile... (Attempt ${4 - retries}/3)`);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          profile = data;
        } else {
          retries--;
          if (retries > 0) await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Determine redirection target
      let redirectTo = next;
      
      const needsOnboarding = !profile || (!profile.role || !profile.first_name || !profile.last_name);
      if (needsOnboarding) {
        redirectTo = '/onboarding';
      }

      console.log(`[Auth Callback] Redirecting to: ${redirectTo}`);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
