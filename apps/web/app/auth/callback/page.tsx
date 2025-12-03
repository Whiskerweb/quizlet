'use client';

/**
 * Page de callback OAuth (/auth/callback)
 * 
 * Cette page est appelée par Supabase après que l'utilisateur s'est authentifié
 * avec un fournisseur OAuth (Google, GitHub, etc.).
 * 
 * Logique :
 * 1. Vérifie la session avec getSession()
 * 2. Charge le profil depuis Supabase
 * 3. Si le profil n'existe pas, le crée via RPC
 * 4. Met à jour le store Zustand avec user et profile
 * 5. Redirige vers /dashboard
 * 
 * Note : Cette URL doit être configurée dans Supabase Dashboard :
 * - Allez dans Authentication > URL Configuration
 * - Ajoutez https://cardz.dev/auth/callback dans "Redirect URLs"
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      // Récupération de la session Supabase
      // getSession() récupère la session depuis localStorage/cookies
      // Si Supabase a traité le hash fragment OAuth (#access_token=...), la session sera disponible
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();
      
      console.log('[OAuth Callback] session', { 
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: error?.message,
      });

      // Si pas de session ou erreur → rediriger vers login
      if (!session || error) {
        console.log('[OAuth Callback] No session found, redirecting to /login');
        router.replace('/login');
        return;
      }

      // Session présente → charger le profil
      console.log('[OAuth Callback] Session found, loading profile...');
      
      // Charger le profil depuis Supabase
      const { data: profile, error: profileError } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.log('[OAuth Callback] Profile not found, creating profile...', profileError);
        
        // Créer le profil si nécessaire
        const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
        
        const { error: rpcError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
          user_id: session.user.id,
          user_email: session.user.email || '',
          user_username: baseUsername,
          user_first_name: session.user.user_metadata?.first_name || null,
          user_last_name: session.user.user_metadata?.last_name || null,
        });
        
        if (rpcError) {
          console.error('[OAuth Callback] Error creating profile:', rpcError);
          // Continuer quand même, le trigger SQL devrait avoir créé le profil
        }
        
        // Récupérer le profil créé
        const { data: newProfile, error: fetchError } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (newProfile) {
          console.log('[OAuth Callback] Profile created/loaded:', newProfile.username);
          setUser(session.user);
          setProfile(newProfile);
        } else {
          console.error('[OAuth Callback] Failed to fetch profile after creation:', fetchError);
          // Rediriger quand même vers dashboard, le layout essaiera de charger le profil
          setUser(session.user);
        }
      } else {
        // Profil existe, mettre à jour le store
        console.log('[OAuth Callback] Profile loaded:', profile.username);
        setUser(session.user);
        setProfile(profile);
      }

      // Rediriger vers dashboard
      console.log('[OAuth Callback] Redirecting to /dashboard');
      router.replace('/dashboard');
    };

    run();
  }, [router, setUser, setProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
      <p className="text-white">Connexion en cours…</p>
    </div>
  );
}


