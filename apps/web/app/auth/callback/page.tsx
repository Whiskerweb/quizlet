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

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Fonction principale qui traite le callback OAuth
     * 
     * Étapes :
     * 1. Récupération de la session depuis l'URL (Supabase le fait automatiquement)
     * 2. Vérification que l'utilisateur est bien authentifié
     * 3. Récupération du profil utilisateur depuis la base de données
     * 4. Mise à jour du store d'authentification
     * 5. Redirection vers la page demandée ou le dashboard
     */
    const handleCallback = async () => {
      try {
        // Étape 1 : Récupération de la session
        // Supabase a automatiquement échangé le code d'autorisation contre une session
        // getSession() récupère la session actuelle depuis les cookies/localStorage
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // Étape 2 : Vérification que l'utilisateur est authentifié
        if (!session || !session.user) {
          throw new Error('Aucune session trouvée. Veuillez réessayer.');
        }

        // Étape 3 : Récupération du profil utilisateur
        // Le profil est stocké dans la table 'profiles' de Supabase
        // Il est créé automatiquement lors de la première connexion via un trigger
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          // Si le profil n'existe pas encore, on le crée
          // Cela peut arriver si le trigger n'a pas encore été exécuté
          console.warn('Profile not found, creating one...', profileError);
          
          // Création d'un profil par défaut
          const { data: newProfile, error: createError } = await supabaseClient
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
              is_premium: false,
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          // Mise à jour du store avec le nouveau profil
          setUser(session.user);
          setProfile(newProfile);
        } else {
          // Mise à jour du store avec le profil existant
          setUser(session.user);
          setProfile(profile);
        }

        // Étape 4 : Redirection vers la page demandée
        // On récupère l'URL de redirection depuis les paramètres de requête
        // Si aucune URL n'est fournie, on redirige vers le dashboard
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        
        // Redirection vers la page demandée
        router.push(redirectTo);
        router.refresh(); // Rafraîchir pour mettre à jour les données côté serveur
      } catch (err: any) {
        // En cas d'erreur, on affiche un message et on redirige vers la page de login
        console.error('Error handling OAuth callback:', err);
        setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
        setIsLoading(false);
        
        // Redirection vers la page de login après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    // Appel de la fonction de traitement du callback
    handleCallback();
  }, [router, searchParams, setUser, setProfile]);

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

