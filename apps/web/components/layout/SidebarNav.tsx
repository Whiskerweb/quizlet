'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Folder, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { foldersService } from '@/lib/supabase/folders';
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

export function SidebarNav() {
  const pathname = usePathname();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

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

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname?.startsWith('/folders/');
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-dark-background-sidebar border-r border-[rgba(255,255,255,0.06)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/home" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-brand-primary" />
          <span className="text-[24px] font-bold text-dark-text-primary">Quizlet</span>
        </Link>
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
                  'flex items-center gap-3 h-10 px-4 rounded-lg transition-all duration-[180ms]',
                  active
                    ? 'bg-dark-semantic-navActiveBackground text-white'
                    : 'text-white hover:bg-[rgba(255,255,255,0.06)]'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[14px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-[rgba(255,255,255,0.06)]" />

        {/* Folders Section */}
        <div className="mb-2">
          <p className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            Vos dossiers
          </p>
          {isLoadingFolders ? (
            <div className="text-[12px] text-dark-text-muted">Chargement...</div>
          ) : folders.length === 0 ? (
            <div className="text-[12px] text-dark-text-muted">Aucun dossier</div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => {
                const isFolderActive = pathname === `/folders/${folder.id}`;
                return (
                  <Link
                    key={folder.id}
                    href={`/folders/${folder.id}`}
                    className={cn(
                      'flex items-center gap-3 h-10 px-4 rounded-lg transition-all duration-[180ms]',
                      isFolderActive
                        ? 'bg-dark-semantic-navActiveBackground text-white'
                        : 'text-white hover:bg-[rgba(255,255,255,0.06)]'
                    )}
                  >
                    <Folder className="h-4 w-4" style={{ color: folder.color || '#8B8FBE' }} />
                    <span className="text-[14px] font-medium truncate">{folder.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Start Section */}
        <div className="mt-6">
          <p className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            Commencez ici
          </p>
          <Link
            href="/sets/create"
            className="flex items-center gap-3 h-10 px-4 rounded-lg text-white hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms]"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[14px] font-medium">Créer des flashcards</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

