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
import { trackLead } from '@/lib/tracking/traaaction';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

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

      // Récupérer le rôle depuis sessionStorage (stocké avant la redirection OAuth)
      const oauthRole = sessionStorage.getItem('oauth_role') as 'student' | 'teacher' | null;
      console.log('[OAuth Callback] OAuth role from sessionStorage:', oauthRole);

      // Attendre un peu pour que le trigger SQL ait le temps de créer le profil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Charger le profil depuis Supabase
      const { data: profile, error: profileError } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Variable pour stocker le profil final (utilisée pour la redirection)
      let finalProfile: Profile | null = null;

      if (profileError || !profile) {
        console.log('[OAuth Callback] Profile not found, creating profile...', profileError);

        // Nettoyer sessionStorage après récupération
        if (oauthRole) {
          sessionStorage.removeItem('oauth_role');
        }

        // Créer le profil si nécessaire
        // Generate temporary username from email (will be replaced during onboarding if name is provided)
        const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;

        const { error: rpcError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
          user_id: session.user.id,
          user_email: session.user.email || '',
          user_username: baseUsername, // Temporary username, will be updated during onboarding
          user_role: oauthRole || 'student', // Utiliser le rôle stocké ou 'student' par défaut
          user_first_name: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(' ')[0] || null,
          user_last_name: session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
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
          const typedNewProfile = newProfile as Profile;
          console.log('[OAuth Callback] Profile created/loaded:', typedNewProfile.username, 'role:', typedNewProfile.role);

          // Track the signup as a lead for Traaaction attribution
          await trackLead({
            customerExternalId: session.user.id,
            customerEmail: session.user.email || undefined,
            eventName: 'sign_up',
          });

          // Si le rôle stocké est différent du rôle dans le profil, mettre à jour
          if (oauthRole && typedNewProfile.role !== oauthRole) {
            console.log('[OAuth Callback] Updating role from', typedNewProfile.role, 'to', oauthRole);
            const { error: updateError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
              user_id: session.user.id,
              user_email: session.user.email || '',
              user_username: typedNewProfile.username,
              user_role: oauthRole,
              user_first_name: typedNewProfile.first_name,
              user_last_name: typedNewProfile.last_name,
            });

            if (updateError) {
              console.error('[OAuth Callback] Error updating role:', updateError);
              finalProfile = typedNewProfile;
            } else {
              // Recharger le profil avec le bon rôle
              const { data: updatedProfile } = await supabaseBrowser
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (updatedProfile) {
                finalProfile = updatedProfile as Profile;
                setUser(session.user);
                setProfile(finalProfile);
              } else {
                finalProfile = typedNewProfile;
                setUser(session.user);
                setProfile(typedNewProfile);
              }
            }
          } else {
            finalProfile = typedNewProfile;
            setUser(session.user);
            setProfile(typedNewProfile);
          }
        } else {
          console.error('[OAuth Callback] Failed to fetch profile after creation:', fetchError);
          // Rediriger quand même vers dashboard, le layout essaiera de charger le profil
          setUser(session.user);
        }
      } else {
        // Profil existe déjà
        const typedProfile = profile as Profile;
        finalProfile = typedProfile;
        console.log('[OAuth Callback] Profile loaded:', typedProfile.username, 'current role:', typedProfile.role);

        // Vérifier si le profil vient d'être créé (créé il y a moins de 5 secondes)
        // Si oui et qu'un rôle est stocké, mettre à jour le rôle
        const profileCreatedAt = new Date(typedProfile.created_at).getTime();
        const now = Date.now();
        const isRecentlyCreated = (now - profileCreatedAt) < 5000; // 5 secondes

        if (isRecentlyCreated && oauthRole && typedProfile.role !== oauthRole) {
          console.log('[OAuth Callback] Profile was just created, updating role from', typedProfile.role, 'to', oauthRole);
          const { error: updateError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
            user_id: session.user.id,
            user_email: session.user.email || '',
            user_username: typedProfile.username,
            user_role: oauthRole,
            user_first_name: typedProfile.first_name,
            user_last_name: typedProfile.last_name,
          });

          if (updateError) {
            console.error('[OAuth Callback] Error updating role:', updateError);
          } else {
            // Recharger le profil avec le bon rôle
            const { data: updatedProfile } = await supabaseBrowser
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (updatedProfile) {
              finalProfile = updatedProfile as Profile;
              console.log('[OAuth Callback] Profile role updated to:', finalProfile.role);
              setUser(session.user);
              setProfile(finalProfile);
            } else {
              setUser(session.user);
              setProfile(typedProfile);
            }
          }
        } else {
          // Profil existe et rôle correct (ou profil ancien), mettre à jour le store
          setUser(session.user);
          setProfile(typedProfile);
        }

        // Nettoyer sessionStorage après utilisation
        if (oauthRole) {
          sessionStorage.removeItem('oauth_role');
        }
      }

      // Check if onboarding is needed (profile missing role or name)
      if (!finalProfile) {
        console.log('[OAuth Callback] No profile available, redirecting to /onboarding');
        router.replace('/onboarding');
        return;
      }

      const needsOnboarding = !finalProfile.role || !finalProfile.first_name || !finalProfile.last_name;

      if (needsOnboarding) {
        console.log('[OAuth Callback] Profile incomplete, redirecting to /onboarding');
        router.replace('/onboarding');
      } else {
        console.log('[OAuth Callback] Profile complete, redirecting to /dashboard');
        router.replace('/dashboard');
      }
    };

    run();
  }, [router, setUser, setProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
      <p className="text-white">Connexion en cours…</p>
    </div>
  );
}


