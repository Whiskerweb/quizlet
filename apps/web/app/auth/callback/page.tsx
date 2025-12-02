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
        if (!session || !user) {
          throw new Error('Session non trouvée après authentification.');
        }

        // Récupération du profil utilisateur
        // Le trigger handle_new_user() devrait créer automatiquement le profil,
        // mais on vérifie quand même et on le crée si nécessaire
        let profile = null;
        const { data: existingProfile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !existingProfile) {
          // Si le profil n'existe pas encore, on le crée via la fonction RPC
          // Cette fonction bypass RLS et gère les conflits de username
          console.warn('Profile not found, creating one via RPC...', profileError);
          
          // Générer un username à partir de l'email ou utiliser un username par défaut
          const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
          
          // Utiliser la fonction RPC create_or_update_profile qui bypass RLS
          // C'est la même fonction utilisée pour les utilisateurs email/password
          const { error: rpcError } = await supabaseClient.rpc('create_or_update_profile', {
            user_id: user.id,
            user_email: user.email || '',
            user_username: baseUsername,
            user_first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
            user_last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
          });

          if (rpcError) {
            console.error('Error creating profile via RPC:', rpcError);
            throw new Error(`Failed to create profile: ${rpcError.message}`);
          }

          // Attendre un peu pour que le profil soit créé
          await new Promise(resolve => setTimeout(resolve, 300));

          // Récupérer le profil créé
          const { data: newProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError || !newProfile) {
            throw new Error(`Failed to fetch created profile: ${fetchError?.message || 'Profile not found'}`);
          }

          profile = newProfile;
        } else {
          profile = existingProfile;
        }

        // Mise à jour du store avec l'utilisateur et le profil
        setUser(user);
        setProfile(profile);

        // Récupération de l'URL de redirection depuis les query params
        // Par défaut, on redirige vers /dashboard
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        
        // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
        // et forcer la redirection vers le dashboard
        setIsLoading(false);
        
        // Petite pause pour s'assurer que le store est mis à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
        router.replace(redirectTo);
        router.refresh();
      } catch (err: any) {
        console.error('Error processing session:', err);
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

