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

import { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Button } from '@/components/ui/Button';
import { LogOut, Menu, Trophy, Settings, Sun, Moon, Globe, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore, languageNames, type Language } from '@/store/languageStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Database } from '@/lib/supabase/types';
import { getDisplayName, getInitials } from '@/lib/utils/profile';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [showLanguageChangeToast, setShowLanguageChangeToast] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur une page de jeu (study)
  const isStudyPage = pathname?.includes('/study/');

  // Initialiser le thème au chargement
  useEffect(() => {
    // Appliquer le thème au chargement
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Mettre à jour l'attribut lang du document HTML
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

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

  // Fermer le menu profil quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isProfileMenuOpen || isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isLanguageMenuOpen]);

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
          
          // Check if onboarding is needed (profile missing role or name)
          const needsOnboarding = !typedProfile.role || !typedProfile.first_name || !typedProfile.last_name;
          
          if (needsOnboarding) {
            console.log('[Dashboard Layout] Profile incomplete, redirecting to /onboarding');
            router.replace('/onboarding');
            return;
          }
          
          setStoreUser(session.user);
          setStoreProfile(typedProfile);
        } else if (profileError) {
          console.error('[Dashboard Layout] Error loading profile:', profileError);

          // Créer le profil si nécessaire (fallback si le trigger SQL n'a pas fonctionné)
          // Generate temporary username from email (will be replaced during onboarding)
          const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;

          const { error: rpcError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
            user_id: session.user.id,
            user_email: session.user.email || '',
            user_username: baseUsername, // Temporary username, will be updated during onboarding
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
            
            // Check if onboarding is needed
            const needsOnboarding = !typedNewProfile.role || !typedNewProfile.first_name || !typedNewProfile.last_name;
            
            if (needsOnboarding) {
              console.log('[Dashboard Layout] Profile incomplete, redirecting to /onboarding');
              router.replace('/onboarding');
              return;
            }
            
            setStoreUser(session.user);
            setStoreProfile(typedNewProfile);
          } else {
            // Mettre à jour au moins l'utilisateur même si le profil n'est pas disponible
            setStoreUser(session.user);
          }
        }
      } else {
        // Profil déjà dans le store, vérifier si onboarding est nécessaire
        const needsOnboarding = !currentProfile.role || !currentProfile.first_name || !currentProfile.last_name;
        
        if (needsOnboarding) {
          console.log('[Dashboard Layout] Profile incomplete, redirecting to /onboarding');
          router.replace('/onboarding');
          return;
        }
        
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
        <p className="text-content-muted">{t('loadingDashboard')}</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const sidebarWidth = isSidebarOpen ? (isMobile ? '260px' : '260px') : (isMobile ? '0px' : '80px');
  const displayName = getDisplayName(profile, user?.email);
  const initials = getInitials(profile, user?.email);

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
        <div className={`bg-bg-default ${isStudyPage ? 'p-0 h-screen' : 'pb-[var(--page-bottom-margin)] pt-0 md:h-screen md:pb-2 md:pr-2'}`}>
          <div className={`relative h-full overflow-hidden ${isStudyPage ? 'rounded-none' : 'rounded-none bg-bg-emphasis shadow-panel md:rounded-[24px]'}`}>
            <div className="flex h-full flex-col">
              {/* Header - masqué sur les pages de jeu */}
              {!isStudyPage && (
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

                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <div className="relative" ref={profileMenuRef}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-emphasis/80 px-2.5 py-1.5 text-left"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-muted text-sm font-semibold text-content-emphasis">
                          {profile?.avatar ? (
                            <img
                              src={profile.avatar}
                              alt={displayName}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="hidden md:block">
                          <p className="text-[13px] font-semibold text-content-emphasis leading-tight">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-content-muted leading-tight">{t('profile')}</p>
                        </div>
                      </Button>

                      {/* Menu dropdown */}
                      {isProfileMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border-subtle bg-bg-emphasis shadow-lg z-50 overflow-hidden">
                          {/* User info section */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-muted text-sm font-semibold text-content-emphasis flex-shrink-0">
                              {profile?.avatar ? (
                                <img
                                  src={profile.avatar}
                                  alt={displayName}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-content-emphasis truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-content-muted truncate">
                                {user?.email || ''}
                              </p>
                            </div>
                          </div>

                          {/* Menu items with icons */}
                          <div className="py-1">
                            <button
                              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-content-emphasis hover:bg-bg-muted transition-colors"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                // TODO: Implémenter la navigation vers les réalisations
                              }}
                            >
                              <Trophy className="h-4 w-4 text-content-muted" />
                              <span>{t('achievements')}</span>
                            </button>
                            <div className="relative" ref={languageMenuRef}>
                              <button
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-content-emphasis hover:bg-bg-muted transition-colors"
                                onClick={() => {
                                  setIsLanguageMenuOpen(!isLanguageMenuOpen);
                                }}
                              >
                                <Globe className="h-4 w-4 text-content-muted" />
                                <span>{t('language')}</span>
                              </button>
                              
                              {/* Language submenu */}
                              {isLanguageMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border-subtle bg-bg-emphasis shadow-lg z-50 overflow-hidden">
                                  {(['fr', 'en', 'es', 'de'] as Language[]).map((lang) => (
                                    <button
                                      key={lang}
                                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                        language === lang
                                          ? 'bg-bg-muted text-content-emphasis font-medium'
                                          : 'text-content-emphasis hover:bg-bg-muted'
                                      }`}
                                      onClick={() => {
                                        setLanguage(lang);
                                        setIsLanguageMenuOpen(false);
                                        setIsProfileMenuOpen(false);
                                        // Afficher une notification de changement de langue
                                        setShowLanguageChangeToast(true);
                                        setTimeout(() => {
                                          setShowLanguageChangeToast(false);
                                        }, 2000);
                                      }}
                                    >
                                      <span>{languageNames[lang]}</span>
                                      {language === lang && (
                                        <span className="ml-auto text-xs">✓</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-content-emphasis hover:bg-bg-muted transition-colors"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                toggleTheme();
                              }}
                            >
                              {theme === 'light' ? (
                                <>
                                  <Moon className="h-4 w-4 text-content-muted" />
                                  <span>{t('darkTheme')}</span>
                                </>
                              ) : (
                                <>
                                  <Sun className="h-4 w-4 text-content-muted" />
                                  <span>{t('lightTheme')}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Separator */}
                          <div className="border-t border-border-subtle" />

                          {/* Logout */}
                          <div className="py-1">
                            <button
                              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-content-emphasis hover:bg-bg-muted transition-colors"
                              onClick={async () => {
                                setIsProfileMenuOpen(false);
                                await logout();
                                window.location.href = '/login';
                              }}
                            >
                              <span>{t('logout')}</span>
                            </button>
                          </div>

                          {/* Separator */}
                          <div className="border-t border-border-subtle" />

                          {/* Footer links */}
                          <div className="py-1">
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-content-muted hover:bg-bg-muted transition-colors"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                // TODO: Implémenter la navigation
                              }}
                            >
                              <span>{t('privacyPolicy')}</span>
                            </button>
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-content-muted hover:bg-bg-muted transition-colors"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                // TODO: Implémenter la navigation
                              }}
                            >
                              <span>{t('help')}</span>
                            </button>
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm text-content-muted hover:bg-bg-muted transition-colors"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                // TODO: Implémenter la navigation
                              }}
                            >
                              <span>{t('subscribe')}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </header>
              )}

              {/* Bouton hamburger flottant pour mobile sur pages de jeu */}
              {isStudyPage && isMobile && (
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="fixed top-3 left-3 z-40 bg-bg-emphasis/90 backdrop-blur-md border border-border-subtle shadow-lg"
                  aria-label="Ouvrir la navigation"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              <main className="flex-1 overflow-y-auto bg-bg-default md:bg-transparent">
                {/* Toast notification pour changement de langue */}
                {showLanguageChangeToast && (
                  <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border-subtle bg-bg-emphasis px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2">
                    <p className="text-sm text-content-emphasis">
                      {t('languageChanged')} - {languageNames[language]}
                    </p>
                  </div>
                )}
                
                {/* Padding ajusté selon la page */}
                <div className={`mx-auto w-full ${isStudyPage ? 'max-w-full p-0' : 'max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8'}`}>
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
