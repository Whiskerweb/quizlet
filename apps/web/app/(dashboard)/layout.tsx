'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopSearchBar } from '@/components/layout/TopSearchBar';
import { Button } from '@/components/ui/Button';
import { User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser, setProfile, setLoading, user, profile, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  // Detect mobile and handle sidebar state
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

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      // ÉTAPE 1 : Vérifier la session Supabase directement
      // On ne dépend pas du store pour cette vérification critique
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      
      console.log('[Dashboard Layout] Session check:', {
        hasUser: !!sessionUser,
        userId: sessionUser?.id,
        userEmail: sessionUser?.email,
        error: sessionError?.message,
      });
      
      // Si pas de session → redirect vers login
      if (!sessionUser || sessionError) {
        console.log('[Dashboard Layout] No session found, redirecting to login');
        router.push('/login');
        return;
      }
      
      // ÉTAPE 2 : Mettre à jour le store avec l'utilisateur
      setUser(sessionUser);
      
      // ÉTAPE 3 : Vérifier et récupérer le profil
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
      
      console.log('[Dashboard Layout] Profile check:', {
        hasProfile: !!profile,
        profileId: profile?.id,
        profileUsername: profile?.username,
        error: profileError?.message,
        errorCode: profileError?.code,
      });
      
      // Si le profil n'existe pas, on le crée via la fonction RPC
      if (profileError || !profile) {
        console.warn('[Dashboard Layout] Profile not found, creating one via RPC...', profileError);
        
        // Générer un username à partir de l'email ou utiliser un username par défaut
        const baseUsername = sessionUser.email?.split('@')[0] || `user_${sessionUser.id.slice(0, 8)}`;
        
        // Utiliser la fonction RPC create_or_update_profile qui bypass RLS
        const { error: rpcError } = await supabase.rpc('create_or_update_profile', {
          user_id: sessionUser.id,
          user_email: sessionUser.email || '',
          user_username: baseUsername,
          user_first_name: sessionUser.user_metadata?.first_name || sessionUser.user_metadata?.name?.split(' ')[0] || null,
          user_last_name: sessionUser.user_metadata?.last_name || sessionUser.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
        });

        if (rpcError) {
          console.error('[Dashboard Layout] Error creating profile via RPC:', rpcError);
          // Si la création échoue, on redirige vers login car on ne peut pas continuer sans profil
          router.push('/login');
          return;
        }
        
        // Attendre un peu pour que le profil soit créé
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Récupérer le profil créé
        const { data: newProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();
        
        if (fetchError || !newProfile) {
          console.error('[Dashboard Layout] Failed to fetch created profile:', fetchError);
          // Si on ne peut pas récupérer le profil, on redirige vers login
          router.push('/login');
          return;
        }
        
        profile = newProfile;
        console.log('[Dashboard Layout] Profile created successfully:', {
          profileId: profile.id,
          username: profile.username,
        });
      }
      
      // ÉTAPE 4 : Mettre à jour le store avec le profil
      // On vérifie que le profil existe avant de continuer
      if (!profile) {
        console.error('[Dashboard Layout] No profile available, redirecting to login');
        router.push('/login');
        return;
      }
      
      setProfile(profile);
      
      // ÉTAPE 5 : Autoriser l'accès au dashboard
      setLoading(false);
      setIsChecking(false);
      console.log('[Dashboard Layout] Auth check complete, allowing access to dashboard');
    };

    checkAuth();
  }, [router, setUser, setProfile, setLoading, supabase]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Show nothing while checking to avoid hydration mismatch
  if (isChecking) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center app-shell">
        <p className="text-dark-text-secondary">Loading...</p>
      </div>
    );
  }

  // Vérification finale : si pas d'utilisateur ou pas de profil après le check, ne rien afficher
  // (la redirection vers /login est en cours)
  // On vérifie à la fois le store ET la session pour être sûr
  if (!user || !profile) {
    console.log('[Dashboard Layout] Final check failed:', {
      hasUser: !!user,
      hasProfile: !!profile,
      userId: user?.id,
      profileId: profile?.id,
    });
    return null;
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
            <Link href={`/profile/${profile?.username}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[999px] bg-dark-background-cardMuted border-2 border-[rgba(255,255,255,0.12)] flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dark-text-secondary" />
                </div>
                <span className="hidden md:inline text-[13px] sm:text-[14px] text-dark-text-secondary">
                  {profile?.username}
                </span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
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

