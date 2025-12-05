'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Folder, Trash2, Play, Eye, Lock, Globe } from 'lucide-react';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;
  const [folder, setFolder] = useState<FolderWithSets | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const loadFolder = async () => {
    try {
      setIsLoading(true);
      const folderData = await foldersService.getOne(folderId);
      
      // Get sets in this folder using Supabase directly
      const { supabaseBrowser } = await import('@/lib/supabaseBrowserClient');
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: folderSets, error } = await supabaseBrowser
        .from('sets')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFolder({
        ...folderData,
        sets: folderSets || [],
      });
    } catch (error) {
      console.error('Failed to load folder:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!confirm(`Are you sure you want to delete the folder "${folder?.name}"? All Cardz will be moved to "Other Cardz".`)) {
      return;
    }

    try {
      await foldersService.delete(folderId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert('Failed to delete folder');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-content-muted">Loading...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-content-muted">Folder not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6" style={{ color: folder.color || '#8B8FBE' }} />
            <div>
              <h1 className="text-[28px] font-semibold text-content-emphasis">{folder.name}</h1>
              <p className="text-[16px] text-content-muted">
                {folder.sets.length} {folder.sets.length === 1 ? 'Cardz' : 'Cardz'}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDeleteFolder}
          className="text-state-danger border-state-danger hover:bg-bg-subtle"
        >
          <Trash2 className="h-4 w-4" />
          Delete Folder
        </Button>
      </div>

      {folder.sets.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <Folder className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">No Cardz in this folder</h3>
          <p className="text-[15px] text-content-muted mb-4">
            Drag Cardz here from the dashboard to organize them
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {folder.sets.map((set) => (
            <div
              key={set.id}
              className="rounded-2xl border border-border-subtle bg-bg-emphasis/95 p-4 transition hover:border-border-emphasis hover:shadow-card"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-content-emphasis line-clamp-2">
                      {set.title}
                    </p>
                    <p className="text-[12px] text-content-muted">
                      {set.is_public ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Privé
                        </span>
                      )}
                    </p>
                  </div>
                  {set.password_hash && (
                    <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] text-content-muted">
                      Protégé
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-content-muted line-clamp-3">
                  {set.description || 'Aucune description'}
                </p>

                <div className="flex items-center justify-between text-[12px] text-content-muted">
                  <span>Ajouté le {new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/study/${set.id}`}
                      aria-label="Étudier"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis"
                    >
                      <Play className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/sets/${set.id}`}
                      aria-label="Voir le set"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

