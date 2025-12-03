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
import { User, LogOut, Menu } from 'lucide-react';
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
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center app-shell">
        <p className="text-dark-text-secondary">Chargement du dashboard…</p>
      </div>
    );
  }

  // GARDE 2 : Si pas autorisé, ne rien afficher (redirection en cours)
  if (!authorized) {
    return null; // redirect en cours
  }

  const sidebarWidth = isSidebarOpen ? (isMobile ? '260px' : '260px') : (isMobile ? '0px' : '80px');

  return (
    <div className="min-h-screen bg-dark-background-base app-shell flex">
      {/* Sidebar */}
      <SidebarNav 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isMobile ? '0' : sidebarWidth 
        }}
      >
        {/* Top Bar */}
        <header className="h-14 sm:h-16 border-b border-[rgba(255,255,255,0.06)] bg-dark-background-base flex items-center px-3 sm:px-4 lg:px-8 gap-2 sm:gap-3 lg:gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <TopSearchBar className="flex-1 min-w-0" />
          
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
            <Link href={`/profile/${profile?.username || 'me'}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[999px] bg-dark-background-cardMuted border-2 border-[rgba(255,255,255,0.12)] flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dark-text-secondary" />
                </div>
                <span className="hidden md:inline text-[13px] sm:text-[14px] text-dark-text-secondary">
                  {profile?.username || user?.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }} 
              className="flex-shrink-0 p-1.5 sm:p-2"
            >
              <LogOut className="h-4 w-4 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
