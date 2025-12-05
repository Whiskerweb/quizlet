'use client';

/**
 * Layout du dashboard
 * 
 * Ce layout protège toutes les routes sous /dashboard en vérifiant l'authentification.
 * 
 * Logique simplifiée :
 * 1. Vérifie la session avec getSession()
 * 2. Si session présente → autorise l'accès au dashboard
 * 3. Si pas de session → redirige vers /login
 * 
 * IMPORTANT : On ne dépend pas du store Zustand pour décider si l'utilisateur est autorisé.
 * La vérification se base uniquement sur getSession().
 */

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopSearchBar } from '@/components/layout/TopSearchBar';
import { Button } from '@/components/ui/Button';
import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile et gestion de la sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vérification de l'authentification et initialisation du store
  useEffect(() => {
    const run = async () => {
      // Récupération de la session Supabase
      // getSession() récupère la session depuis localStorage/cookies
      // C'est la source de vérité pour l'authentification côté client
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();
      
      console.log('[Dashboard Layout] session', { 
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: error?.message,
      });

      // Si pas de session ou erreur → rediriger vers login
      if (!session || error) {
        console.log('[Dashboard Layout] No session, redirecting to /login');
        router.replace('/login');
        return;
      }

      // Session présente → vérifier et charger le profil si nécessaire
      const { setUser: setStoreUser, setProfile: setStoreProfile } = useAuthStore.getState();
      const currentProfile = useAuthStore.getState().profile;
      
      // Vérifier si le profil est dans le store et correspond à l'utilisateur actuel
      if (!currentProfile || currentProfile.id !== session.user.id) {
        console.log('[Dashboard Layout] Profile not in store, loading from Supabase...');
        
        // Charger le profil depuis Supabase
        const { data: profileData, error: profileError } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          const typedProfile = profileData as Profile;
          console.log('[Dashboard Layout] Profile loaded:', typedProfile.username);
          setStoreUser(session.user);
          setStoreProfile(typedProfile);
        } else if (profileError) {
          console.error('[Dashboard Layout] Error loading profile:', profileError);
          
          // Créer le profil si nécessaire (fallback si le trigger SQL n'a pas fonctionné)
          const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
          
          const { error: rpcError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
            user_id: session.user.id,
            user_email: session.user.email || '',
            user_username: baseUsername,
            user_first_name: session.user.user_metadata?.first_name || null,
            user_last_name: session.user.user_metadata?.last_name || null,
          });
          
          if (rpcError) {
            console.error('[Dashboard Layout] Error creating profile:', rpcError);
          }
          
          // Réessayer de charger le profil
          const { data: newProfile } = await supabaseBrowser
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (newProfile) {
            const typedNewProfile = newProfile as Profile;
            console.log('[Dashboard Layout] Profile created/loaded:', typedNewProfile.username);
            setStoreUser(session.user);
            setStoreProfile(typedNewProfile);
          } else {
            // Mettre à jour au moins l'utilisateur même si le profil n'est pas disponible
            setStoreUser(session.user);
          }
        }
      } else {
        // Profil déjà dans le store, mettre à jour user si nécessaire
        console.log('[Dashboard Layout] Profile already in store:', currentProfile.username);
        setStoreUser(session.user);
      }

      // Autoriser l'accès au dashboard
      console.log('[Dashboard Layout] Session found, authorizing access to dashboard');
      setAuthorized(true);
      setChecking(false);
    };

    run();
  }, [router]);

  // GARDE 1 : Afficher un loader pendant la vérification
  if (checking) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-bg-default">
        <p className="text-content-muted">Chargement du dashboard…</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const sidebarWidth = isSidebarOpen ? (isMobile ? '260px' : '260px') : (isMobile ? '0px' : '80px');
  const initials = profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="app-shell min-h-screen bg-bg-default">
      <SidebarNav
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
      />

      <div
        className="flex min-h-screen flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobile ? '0' : sidebarWidth }}
      >
        <div className="bg-bg-default pb-[var(--page-bottom-margin)] pt-[var(--page-top-margin)] md:h-screen md:pb-2 md:pr-2">
          <div className="relative h-full overflow-hidden rounded-none bg-bg-emphasis shadow-panel md:rounded-[24px]">
            <div className="flex h-full flex-col">
              <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-subtle/70 bg-bg-emphasis/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
                {isMobile && (
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden"
                    aria-label="Ouvrir la navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}

                <TopSearchBar className="flex-1 min-w-0" />

                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href={`/profile/${profile?.username || 'me'}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-emphasis/80 px-2.5 py-1.5 text-left"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-muted text-sm font-semibold text-content-emphasis">
                        {initials}
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[13px] font-semibold text-content-emphasis leading-tight">
                          {profile?.username || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-[11px] text-content-muted leading-tight">Profil</p>
                      </div>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await logout();
                      window.location.href = '/login';
                    }}
                    className="rounded-full border border-border-subtle px-3 py-2"
                    aria-label="Se déconnecter"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto bg-bg-default md:bg-transparent">
                <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
