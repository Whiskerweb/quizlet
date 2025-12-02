'use client';

/**
 * Page de callback OAuth (/auth/callback)
 * 
 * Cette page est appelée par Supabase après que l'utilisateur s'est authentifié
 * avec un fournisseur OAuth (Google, GitHub, etc.).
 * 
 * Logique simplifiée :
 * 1. Vérifie la session avec getSession()
 * 2. Si session présente → redirige vers /dashboard
 * 3. Si pas de session → redirige vers /login
 * 
 * Note : Cette URL doit être configurée dans Supabase Dashboard :
 * - Allez dans Authentication > URL Configuration
 * - Ajoutez https://cardz.dev/auth/callback dans "Redirect URLs"
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';

export default function OAuthCallbackPage() {
  const router = useRouter();

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

      // Session présente → rediriger vers dashboard
      // Le profil est géré automatiquement par le trigger SQL handle_new_user()
      // On ne vérifie pas le profil ici pour simplifier le flux
      console.log('[OAuth Callback] Session found, redirecting to /dashboard');
      router.replace('/dashboard');
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
      <p className="text-white">Connexion en cours…</p>
    </div>
  );
}
