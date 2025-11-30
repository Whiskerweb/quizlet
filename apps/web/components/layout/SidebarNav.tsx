'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Folder, Sparkles, Share2, Menu, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { foldersService } from '@/lib/supabase/folders';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { useAuthStore } from '@/store/authStore';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import type { Database } from '@/lib/supabase/types';

type Folder = Database['public']['Tables']['folders']['Row'];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/dashboard', label: 'Votre espace', icon: BookOpen },
];

interface SidebarNavProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function SidebarNav({ isOpen: controlledIsOpen, onToggle, isMobile = false }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [hasSharedSets, setHasSharedSets] = useState(false);
  const [isLoadingSharedSets, setIsLoadingSharedSets] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile); // Open on desktop, closed on mobile
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle ? () => onToggle() : setInternalIsOpen;

  useEffect(() => {
    loadFolders();
    if (user) {
      loadSharedSets();
    }
  }, [user]);

  const loadFolders = async () => {
    try {
      setIsLoadingFolders(true);
      const data = await foldersService.getAll();
      setFolders(data || []);
    } catch (error) {
      console.warn('Failed to load folders:', error);
      setFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadSharedSets = async () => {
    try {
      setIsLoadingSharedSets(true);
      const sharedSets = await sharedSetsService.getMySharedSets();
      setHasSharedSets(sharedSets.length > 0);
    } catch (error) {
      console.warn('Failed to load shared sets:', error);
      setHasSharedSets(false);
    } finally {
      setIsLoadingSharedSets(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard' || (pathname?.startsWith('/folders/') && pathname !== '/folders/shared');
    }
    return pathname?.startsWith(href);
  };

  // On mobile, sidebar is completely hidden when closed (width 0)
  // On desktop, sidebar is collapsed to 80px when closed
  const sidebarWidth = isMobile 
    ? (isOpen ? '260px' : '0px')
    : (isOpen ? '260px' : '80px');
  
  const sidebarWidthClass = isMobile
    ? (isOpen ? 'w-[260px]' : 'w-0')
    : (isOpen ? 'w-[260px]' : 'w-[80px]');

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-dark-background-sidebar border-r border-[rgba(255,255,255,0.06)] flex flex-col z-50 transition-all duration-300 ease-in-out',
          sidebarWidthClass,
          isMobile && !isOpen && '-translate-x-full',
          isMobile && isOpen && 'translate-x-0',
          // Hide border when completely closed on mobile
          isMobile && !isOpen && 'border-0'
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          'border-b border-[rgba(255,255,255,0.06)] flex items-center flex-shrink-0',
          isOpen ? 'px-4 sm:px-5 lg:px-6 py-4 sm:py-5 justify-between' : 'px-3 sm:px-4 justify-center py-4 sm:py-5'
        )}>
          {isOpen ? (
            <Link href="/home" className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 group">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-brand-primary" />
              </div>
              <span className="text-[18px] sm:text-[20px] lg:text-[22px] font-bold text-white whitespace-nowrap truncate">
                CARDZ
              </span>
            </Link>
          ) : (
            <Link href="/home" className="flex items-center justify-center w-full group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-brand-primary" />
              </div>
            </Link>
          )}
          {/* Toggle button - only show on desktop, mobile uses header button */}
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'p-1.5 sm:p-2 rounded-lg text-dark-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms] flex-shrink-0',
                !isOpen && 'mx-auto'
              )}
              aria-label={isOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
            >
              {isOpen ? (
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          )}
        </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto',
        isOpen ? 'px-3 sm:px-4 lg:px-5 py-4 sm:py-5' : 'px-2 sm:px-3 py-4 sm:py-5'
      )}>
        {/* Main Navigation */}
        <div className="space-y-0.5 sm:space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  'flex items-center rounded-lg transition-all duration-[180ms] group',
                  isOpen ? 'gap-3 sm:gap-3.5 px-3 sm:px-4 h-10' : 'justify-center px-2 h-10',
                  active
                    ? 'bg-dark-semantic-navActiveBackground text-white shadow-sm'
                    : 'text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn(
                  'flex-shrink-0 transition-colors',
                  isOpen ? 'h-4.5 w-4.5 sm:h-5 sm:w-5' : 'h-5 w-5',
                  active ? 'text-white' : 'text-dark-text-secondary group-hover:text-white'
                )} />
                {isOpen && (
                  <span className={cn(
                    'whitespace-nowrap transition-colors',
                    'text-[14px] sm:text-[15px]',
                    active ? 'font-semibold text-white' : 'font-medium text-dark-text-secondary group-hover:text-white'
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className={cn(
          'border-t border-[rgba(255,255,255,0.06)]',
          isOpen ? 'my-5 sm:my-6' : 'my-4 sm:my-5'
        )} />

        {/* Folders Section */}
        <div className="mb-1">
          {isOpen && (
            <p className="text-[11px] sm:text-[12px] text-dark-text-muted font-medium mb-2.5 sm:mb-3 px-3 sm:px-4">
              Vos dossiers
            </p>
          )}
          {isLoadingFolders ? (
            <div className={cn(
              'text-[12px] text-dark-text-muted',
              isOpen ? 'px-3 sm:px-4' : 'text-center'
            )}>
              {isOpen ? 'Chargement...' : '...'}
            </div>
          ) : (
            <div className="space-y-0.5 sm:space-y-1">
              {/* Shared Sets Folder - Virtual folder that appears if user has shared sets */}
              {!isLoadingSharedSets && hasSharedSets && (
                <Link
                  href="/folders/shared"
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    'flex items-center rounded-lg transition-all duration-[180ms] group',
                    isOpen ? 'gap-3 sm:gap-3.5 px-3 sm:px-4 h-10' : 'justify-center px-2 h-10',
                    pathname === '/folders/shared'
                      ? 'bg-dark-semantic-navActiveBackground text-white shadow-sm'
                      : 'text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                  )}
                  title={!isOpen ? 'Sets partagés' : undefined}
                >
                  <Share2 className={cn(
                    'flex-shrink-0 transition-colors',
                    isOpen ? 'h-4.5 w-4.5 sm:h-5 sm:w-5' : 'h-5 w-5',
                    pathname === '/folders/shared' 
                      ? 'text-white' 
                      : 'text-dark-text-secondary group-hover:text-white'
                  )} style={pathname === '/folders/shared' ? {} : { color: '#8B8FBE' }} />
                  {isOpen && (
                    <span className={cn(
                      'truncate transition-colors',
                      'text-[14px] sm:text-[15px]',
                      pathname === '/folders/shared'
                        ? 'font-semibold text-white'
                        : 'font-medium text-dark-text-secondary group-hover:text-white'
                    )}>
                      Sets partagés
                    </span>
                  )}
                </Link>
              )}
              
              {/* Regular Folders */}
              {folders.length === 0 && !hasSharedSets ? (
                <div className={cn(
                  'text-[12px] text-dark-text-muted',
                  isOpen ? 'px-3 sm:px-4 py-2' : 'text-center py-2'
                )}>
                  {isOpen ? 'Aucun dossier' : ''}
                </div>
              ) : (
                folders.map((folder) => {
                  const isFolderActive = pathname === `/folders/${folder.id}`;
                  return (
                    <Link
                      key={folder.id}
                      href={`/folders/${folder.id}`}
                      onClick={() => isMobile && setIsOpen(false)}
                      className={cn(
                        'flex items-center rounded-lg transition-all duration-[180ms] group',
                        isOpen ? 'gap-3 sm:gap-3.5 px-3 sm:px-4 h-10' : 'justify-center px-2 h-10',
                        isFolderActive
                          ? 'bg-dark-semantic-navActiveBackground text-white shadow-sm'
                          : 'text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                      )}
                      title={!isOpen ? folder.name : undefined}
                    >
                      <Folder className={cn(
                        'flex-shrink-0 transition-colors',
                        isOpen ? 'h-4.5 w-4.5 sm:h-5 sm:w-5' : 'h-5 w-5',
                        isFolderActive 
                          ? 'text-white' 
                          : 'text-dark-text-secondary group-hover:text-white'
                      )} style={isFolderActive ? {} : { color: folder.color || '#8B8FBE' }} />
                      {isOpen && (
                        <span className={cn(
                          'truncate transition-colors',
                          'text-[14px] sm:text-[15px]',
                          isFolderActive
                            ? 'font-semibold text-white'
                            : 'font-medium text-dark-text-secondary group-hover:text-white'
                        )}>
                          {folder.name}
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Start Section */}
        <div className={cn('mt-5 sm:mt-6')}>
          {isOpen && (
            <p className="text-[11px] sm:text-[12px] text-dark-text-muted font-medium mb-2.5 sm:mb-3 px-3 sm:px-4">
              Commencez ici
            </p>
          )}
          <button
            onClick={async () => {
              if (isMobile) setIsOpen(false);
              setIsCreatingSet(true);
              try {
                const setId = await createSetAndRedirect();
                router.push(`/sets/${setId}/edit`);
              } catch (error) {
                console.error('Failed to create set:', error);
                alert('Failed to create set. Please try again.');
              } finally {
                setIsCreatingSet(false);
              }
            }}
            disabled={isCreatingSet}
            className={cn(
              'flex items-center rounded-lg transition-all duration-[180ms] group w-full',
              isOpen ? 'gap-3 sm:gap-3.5 px-3 sm:px-4 h-10' : 'justify-center px-2 h-10',
              'text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
              isCreatingSet && 'opacity-50 cursor-not-allowed'
            )}
            title={!isOpen ? 'Créer des flashcards' : undefined}
          >
            <Sparkles className={cn(
              'flex-shrink-0 transition-colors',
              isOpen ? 'h-4.5 w-4.5 sm:h-5 sm:w-5' : 'h-5 w-5',
              'text-dark-text-secondary group-hover:text-white'
            )} />
            {isOpen && (
              <span className="text-[14px] sm:text-[15px] font-medium whitespace-nowrap transition-colors text-dark-text-secondary group-hover:text-white">
                {isCreatingSet ? 'Création...' : 'Créer des flashcards'}
              </span>
            )}
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
}

