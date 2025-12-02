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
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient(); // Utiliser le client SSR pour la synchronisation des cookies

  useEffect(() => {
    /**
     * Fonction principale qui traite le callback OAuth
     * 
     * IMPORTANT : Supabase OAuth redirige avec un hash fragment (#access_token=...)
     * Le client Supabase doit traiter ce hash pour extraire la session.
     * On utilise onAuthStateChange pour écouter quand la session est disponible.
     * 
     * Étapes :
     * 1. Vérification initiale de la session (au cas où elle serait déjà disponible)
     * 2. Écoute des changements d'authentification via onAuthStateChange
     * 3. Quand une session est détectée, récupération du profil utilisateur
     * 4. Mise à jour du store d'authentification
     * 5. Redirection vers la page demandée ou le dashboard
     */
    
    let timeoutId: NodeJS.Timeout;
    let hasProcessed = false; // Pour éviter de traiter la session plusieurs fois
    
    // Fonction pour traiter la session une fois qu'elle est disponible
    const processSession = async (session: any, user: any) => {
      if (hasProcessed) return; // Éviter les doubles traitements
      hasProcessed = true;
      clearTimeout(timeoutId);
      
      try {
        if (!session || !user) {
          throw new Error('Session non trouvée après authentification.');
        }

        // Récupération du profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // Si le profil n'existe pas encore, on le crée
          console.warn('Profile not found, creating one...', profileError);
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              is_premium: false,
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setUser(user);
          setProfile(newProfile);
        } else {
          setUser(user);
          setProfile(profile);
        }

        // Récupération de l'URL de redirection
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const redirectTo = searchParams.get('redirect_to') || urlParams.get('redirect_to') || '/dashboard';
        
        // Attendre un peu pour que le store soit bien mis à jour
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Redirection complète
        window.location.href = redirectTo;
      } catch (err: any) {
        console.error('Error handling OAuth callback:', err);
        clearTimeout(timeoutId);
        setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
        setIsLoading(false);
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };
    
    // Vérification initiale de la session (au cas où elle serait déjà disponible)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session && session.user) {
        processSession(session, session.user);
      }
    });
    
    // Timeout de sécurité : si aucune session n'est détectée après 5 secondes, on affiche une erreur
    timeoutId = setTimeout(() => {
      if (isLoading && !hasProcessed) {
        setError('Timeout : la session n\'a pas pu être récupérée. Veuillez réessayer.');
        setIsLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    }, 5000);

    // Écoute des changements d'authentification
    // Cela permet de détecter quand Supabase a traité le hash fragment de l'URL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // On s'intéresse uniquement aux événements SIGNED_IN et TOKEN_REFRESHED
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && session.user) {
        await processSession(session, session.user);
      }
    });

    // Nettoyage : désabonnement de l'écoute et annulation du timeout
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [router, searchParams, setUser, setProfile, supabase, isLoading]);

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

