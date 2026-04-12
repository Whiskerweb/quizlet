'use client';

/**
 * Page de callback OAuth (/auth/callback)
 * 
 * Cette page est appelée APRÈS que le route.ts ait échangé le code OAuth
 * côté serveur (les cookies de session sont déjà posés).
 * 
 * Elle gère :
 * 1. Le chargement/création du profil
 * 2. La redirection vers le dashboard ou l'onboarding
 * 
 * Note : L'échange de code se fait dans route.ts (server-side).
 * Cette page ne fait QUE le chargement du profil et la redirection.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { trackLead } from '@/lib/tracking/traaaction';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      // Step 1: Get the session (cookies should already be set by route.ts)
      console.log('[OAuth Callback] Getting session...');
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();
      console.log('[OAuth Callback] Session:', { hasSession: !!session, error: error?.message });

      if (!session || error) {
        console.error('[OAuth Callback] No session after code exchange, redirecting to login');
        router.replace('/login?error=no_session');
        return;
      }

      setUser(session.user);

      // Retrieve stored role from before OAuth redirect
      const oauthRole = sessionStorage.getItem('oauth_role') as 'student' | 'teacher' | null;
      if (oauthRole) sessionStorage.removeItem('oauth_role');

      // Step 2: Wait for DB trigger then load profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('[OAuth Callback] Loading profile...');
      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      let finalProfile: Profile | null = profile as Profile | null;

      // Step 3: Create profile if it doesn't exist
      if (!finalProfile) {
        console.log('[OAuth Callback] Creating profile via RPC...');
        const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
        await (supabaseBrowser.rpc as any)('create_or_update_profile', {
          user_id: session.user.id,
          user_email: session.user.email || '',
          user_username: baseUsername,
          user_role: oauthRole || 'student',
          user_first_name: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(' ')[0] || null,
          user_last_name: session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        });

        const { data: newProfile } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        finalProfile = (newProfile as Profile) || null;

        // Fire-and-forget: track signup
        trackLead({
          customerExternalId: session.user.id,
          customerEmail: session.user.email || undefined,
          eventName: 'sign_up',
        }).catch(() => {});
      } else if (oauthRole && finalProfile.role !== oauthRole) {
        const profileCreatedAt = new Date(finalProfile.created_at).getTime();
        if (Date.now() - profileCreatedAt < 5000) {
          console.log('[OAuth Callback] Updating role to', oauthRole);
          await (supabaseBrowser.rpc as any)('create_or_update_profile', {
            user_id: session.user.id,
            user_email: session.user.email || '',
            user_username: finalProfile.username,
            user_role: oauthRole,
            user_first_name: finalProfile.first_name,
            user_last_name: finalProfile.last_name,
          });
          const { data: updatedProfile } = await supabaseBrowser
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (updatedProfile) finalProfile = updatedProfile as Profile;
        }
      }

      if (finalProfile) setProfile(finalProfile);

      // Determine redirect destination
      const urlParams = new URLSearchParams(window.location.search);
      const oauthRedirect = sessionStorage.getItem('oauth_redirect');
      const externalRedirect = urlParams.get('redirect_to') || urlParams.get('redirect') || oauthRedirect;
      if (oauthRedirect) sessionStorage.removeItem('oauth_redirect');

      const isValidRedirect = externalRedirect && (
        externalRedirect.startsWith('/') ||
        /^https:\/\/([a-z0-9-]+\.)?cardz\.dev(\/.*)?$/.test(externalRedirect)
      );

      const needsOnboarding = !finalProfile || !finalProfile.role || !finalProfile.first_name || !finalProfile.last_name;

      if (needsOnboarding) {
        router.replace('/onboarding');
      } else if (isValidRedirect) {
        window.location.href = externalRedirect;
      } else {
        router.replace('/dashboard');
      }
    };

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 15000)
    );
    Promise.race([run(), timeout]).catch(() => {
      router.replace('/login?error=timeout');
    });
  }, [router, setUser, setProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
      <p className="text-white">Connexion en cours…</p>
    </div>
  );
}
