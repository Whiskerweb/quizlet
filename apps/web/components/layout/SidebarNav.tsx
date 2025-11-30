'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Folder, Sparkles, Share2, Menu, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { foldersService } from '@/lib/supabase/folders';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { useAuthStore } from '@/store/authStore';
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
  const { user } = useAuthStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [hasSharedSets, setHasSharedSets] = useState(false);
  const [isLoadingSharedSets, setIsLoadingSharedSets] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile); // Open on desktop, closed on mobile
  
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

  const sidebarWidth = isOpen ? '260px' : '80px';
  const sidebarWidthClass = isOpen ? 'w-[260px]' : 'w-[80px]';

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
          isMobile && isOpen && 'translate-x-0'
        )}
        style={{ width: isMobile ? (isOpen ? '260px' : '0') : sidebarWidth }}
      >
        {/* Logo & Toggle */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          {isOpen ? (
            <Link href="/home" className="flex items-center gap-2 flex-1">
              <BookOpen className="h-6 w-6 text-brand-primary flex-shrink-0" />
              <span className="text-[24px] font-bold text-dark-text-primary whitespace-nowrap">Quizlet</span>
            </Link>
          ) : (
            <Link href="/home" className="flex items-center justify-center w-full">
              <BookOpen className="h-6 w-6 text-brand-primary" />
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'p-2 rounded-lg text-dark-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms] flex-shrink-0',
              !isOpen && 'mx-auto'
            )}
            aria-label={isOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center h-10 rounded-lg transition-all duration-[180ms]',
                  isOpen ? 'gap-3 px-4' : 'justify-center px-2',
                  active
                    ? 'bg-dark-semantic-navActiveBackground text-white'
                    : 'text-white hover:bg-[rgba(255,255,255,0.06)]'
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="text-[14px] font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-[rgba(255,255,255,0.06)]" />

        {/* Folders Section */}
        <div className="mb-2">
          {isOpen && (
            <p className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2 px-4">
              Vos dossiers
            </p>
          )}
          {isLoadingFolders ? (
            <div className={cn('text-[12px] text-dark-text-muted', isOpen ? 'px-4' : 'text-center')}>
              {isOpen ? 'Chargement...' : '...'}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Shared Sets Folder - Virtual folder that appears if user has shared sets */}
              {!isLoadingSharedSets && hasSharedSets && (
                <Link
                  href="/folders/shared"
                  className={cn(
                    'flex items-center h-10 rounded-lg transition-all duration-[180ms]',
                    isOpen ? 'gap-3 px-4' : 'justify-center px-2',
                    pathname === '/folders/shared'
                      ? 'bg-dark-semantic-navActiveBackground text-white'
                      : 'text-white hover:bg-[rgba(255,255,255,0.06)]'
                  )}
                  title={!isOpen ? 'Sets partagés' : undefined}
                >
                  <Share2 className="h-4 w-4 flex-shrink-0" style={{ color: '#8B8FBE' }} />
                  {isOpen && <span className="text-[14px] font-medium truncate">Sets partagés</span>}
                </Link>
              )}
              
              {/* Regular Folders */}
              {folders.length === 0 && !hasSharedSets ? (
                <div className={cn('text-[12px] text-dark-text-muted', isOpen ? 'px-4' : 'text-center')}>
                  {isOpen ? 'Aucun dossier' : ''}
                </div>
              ) : (
                folders.map((folder) => {
                  const isFolderActive = pathname === `/folders/${folder.id}`;
                  return (
                    <Link
                      key={folder.id}
                      href={`/folders/${folder.id}`}
                      className={cn(
                        'flex items-center h-10 rounded-lg transition-all duration-[180ms]',
                        isOpen ? 'gap-3 px-4' : 'justify-center px-2',
                        isFolderActive
                          ? 'bg-dark-semantic-navActiveBackground text-white'
                          : 'text-white hover:bg-[rgba(255,255,255,0.06)]'
                      )}
                      title={!isOpen ? folder.name : undefined}
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" style={{ color: folder.color || '#8B8FBE' }} />
                      {isOpen && <span className="text-[14px] font-medium truncate">{folder.name}</span>}
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Start Section */}
        <div className="mt-6">
          {isOpen && (
            <p className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2 px-4">
              Commencez ici
            </p>
          )}
          <Link
            href="/sets/create"
            className={cn(
              'flex items-center h-10 rounded-lg text-white hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms]',
              isOpen ? 'gap-3 px-4' : 'justify-center px-2'
            )}
            title={!isOpen ? 'Créer des flashcards' : undefined}
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span className="text-[14px] font-medium whitespace-nowrap">Créer des flashcards</span>}
          </Link>
        </div>
      </nav>
    </aside>
    </>
  );
}

