'use client';

/**
 * Page de callback OAuth (/auth/callback)
 * 
 * Cette page est appelée par Supabase après que l'utilisateur s'est authentifié
 * avec un fournisseur OAuth (Google, GitHub, etc.).
 * 
 * Fonctionnement :
 * 1. L'utilisateur clique sur "Continuer avec Google" sur la page de login
 * 2. Il est redirigé vers Google pour s'authentifier
 * 3. Google redirige vers cette page (/auth/callback) avec un code d'autorisation
 * 4. Cette page échange le code contre une session Supabase
 * 5. Une fois la session obtenue, on récupère le profil utilisateur
 * 6. On met à jour le store d'authentification (authStore)
 * 7. On redirige l'utilisateur vers le dashboard ou la page demandée
 * 
 * Note : Cette URL doit être configurée dans Supabase Dashboard :
 * - Allez dans Authentication > URL Configuration
 * - Ajoutez https://cardz.dev/auth/callback dans "Redirect URLs"
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { useAuthStore } from '@/store/authStore';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Fonction principale qui traite le callback OAuth
     * 
     * IMPORTANT : Supabase OAuth redirige avec un hash fragment (#access_token=...)
     * Le client Supabase détecte automatiquement ce hash et crée la session.
     * 
     * Étapes :
     * 1. Au montage du composant, on vérifie immédiatement si une session existe
     * 2. Si oui → on récupère le profil et on redirige vers /dashboard
     * 3. Si non → on écoute les changements d'authentification via onAuthStateChange
     * 4. Quand une session est détectée, récupération du profil utilisateur
     * 5. Mise à jour du store d'authentification
     * 6. Redirection vers /dashboard (ou la page demandée via query param)
     */
    
    let hasProcessed = false; // Pour éviter de traiter la session plusieurs fois
    
    // Fonction pour traiter la session une fois qu'elle est disponible
    const processSession = async (session: any, user: any) => {
      if (hasProcessed) return; // Éviter les doubles traitements
      hasProcessed = true;
      
      try {
        // ÉTAPE 1 : Vérifier que la session et l'utilisateur existent
        if (!session || !user) {
          throw new Error('Session non trouvée après authentification.');
        }

        console.log('[OAuth Callback] Processing session:', {
          userId: user.id,
          userEmail: user.email,
          hasSession: !!session,
        });

        // ÉTAPE 2 : Récupération du profil utilisateur
        // Le trigger handle_new_user() devrait créer automatiquement le profil lors de la création de l'utilisateur,
        // mais on vérifie quand même au cas où le trigger n'aurait pas fonctionné
        let profile = null;
        const { data: existingProfile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('[OAuth Callback] Profile check:', {
          hasProfile: !!existingProfile,
          profileId: existingProfile?.id,
          profileUsername: existingProfile?.username,
          error: profileError?.message,
          errorCode: profileError?.code,
        });

        // Si le profil n'existe pas, on le crée via la fonction RPC
        // Cette fonction bypass RLS et gère automatiquement les conflits de username
        if (profileError || !existingProfile) {
          console.warn('[OAuth Callback] Profile not found, creating one via RPC...', profileError);
          
          // Générer un username à partir de l'email (ex: laronce29@gmail.com → laronce29)
          // Si pas d'email, utiliser un username par défaut basé sur l'ID utilisateur
          const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
          
          // Utiliser la fonction RPC create_or_update_profile qui bypass RLS
          // C'est la même fonction utilisée pour les utilisateurs email/password lors de l'inscription
          const { error: rpcError } = await supabaseClient.rpc('create_or_update_profile', {
            user_id: user.id,
            user_email: user.email || '',
            user_username: baseUsername,
            // Récupérer first_name et last_name depuis les métadonnées Google si disponibles
            user_first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
            user_last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
          });

          if (rpcError) {
            console.error('[OAuth Callback] Error creating profile via RPC:', rpcError);
            throw new Error(`Failed to create profile: ${rpcError.message}`);
          }

          // Attendre un peu pour que le profil soit créé et disponible
          await new Promise(resolve => setTimeout(resolve, 300));

          // Récupérer le profil créé pour vérifier qu'il existe bien
          const { data: newProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError || !newProfile) {
            throw new Error(`Failed to fetch created profile: ${fetchError?.message || 'Profile not found'}`);
          }

          profile = newProfile;
          console.log('[OAuth Callback] Profile created successfully:', {
            profileId: profile.id,
            username: profile.username,
          });
        } else {
          // Le profil existe déjà, on l'utilise tel quel
          profile = existingProfile;
          console.log('[OAuth Callback] Profile found:', {
            profileId: profile.id,
            username: profile.username,
          });
        }

        // Vérification de sécurité : s'assurer que le profil existe avant de continuer
        // Cette vérification ne devrait jamais échouer si le code précédent fonctionne correctement
        if (!profile) {
          throw new Error('Profil non trouvé après vérification.');
        }

        // ÉTAPE 4 : Mise à jour du store avec l'utilisateur et le profil
        // On s'assure que le store est bien mis à jour avant la redirection
        setUser(user);
        setProfile(profile);
        
        console.log('[OAuth Callback] Store updated:', {
          userId: user.id,
          profileId: profile.id,
          username: profile.username,
        });

        // ÉTAPE 5 : Attendre un peu pour s'assurer que le store est bien mis à jour
        await new Promise(resolve => setTimeout(resolve, 200));

        // ÉTAPE 6 : Redirection vers le dashboard
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        console.log('[OAuth Callback] Redirecting to:', redirectTo);
        
        setIsLoading(false);
        router.replace(redirectTo);
        router.refresh();
      } catch (err: any) {
        console.error('[OAuth Callback] Error processing session:', err);
        setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
        setIsLoading(false);
        
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };
    
    // Étape 1 : Vérification immédiate de la session
    // Supabase peut avoir déjà traité le hash fragment au moment où cette page se charge
    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session && session.user) {
        processSession(session, session.user);
      }
    });
    
    // Étape 2 : Écoute des changements d'authentification
    // Cela permet de détecter quand Supabase traite le hash fragment de l'URL
    // et crée la session (événement SIGNED_IN)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      // On s'intéresse uniquement à l'événement SIGNED_IN (connexion réussie)
      if (event === 'SIGNED_IN' && session && session.user) {
        await processSession(session, session.user);
      }
    });

    // Timeout de sécurité : si aucune session n'est détectée après 10 secondes
    const timeoutId = setTimeout(() => {
      if (isLoading && !hasProcessed) {
        setError('Timeout : la session n\'a pas pu être récupérée. Veuillez réessayer.');
        setIsLoading(false);
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    }, 10000);

    // Nettoyage : désabonnement de l'écoute et annulation du timeout
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [router, searchParams, setUser, setProfile, isLoading]);

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-white text-lg">Connexion en cours...</p>
          <p className="text-dark-text-muted text-sm mt-2">
            Veuillez patienter pendant que nous vous connectons.
          </p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Erreur de connexion</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-sm text-red-600">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ne devrait jamais être atteint, mais au cas où
  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

