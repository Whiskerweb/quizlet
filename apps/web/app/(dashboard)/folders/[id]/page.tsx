'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Folder, Trash2 } from 'lucide-react';

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
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: folderSets, error } = await supabase
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
    if (!confirm(`Are you sure you want to delete the folder "${folder?.name}"? All sets will be moved to "Other Sets".`)) {
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
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">Folder not found</p>
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
              <h1 className="text-[28px] font-bold text-white">{folder.name}</h1>
              <p className="text-[16px] text-dark-text-secondary">
                {folder.sets.length} {folder.sets.length === 1 ? 'set' : 'sets'}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDeleteFolder}
          className="text-dark-states-danger border-dark-states-danger hover:bg-dark-background-cardMuted"
        >
          <Trash2 className="h-4 w-4" />
          Delete Folder
        </Button>
      </div>

      {folder.sets.length === 0 ? (
        <Card variant="emptyState" className="text-center py-12">
          <Folder className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
          <h3 className="text-[16px] text-white mb-2">No sets in this folder</h3>
          <p className="text-[16px] text-white mb-4">
            Drag sets here from the dashboard to organize them
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folder.sets.map((set) => (
            <Link key={set.id} href={`/sets/${set.id}`} className="block h-full">
              <Card className="h-full hover:shadow-elevation-1 transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                  <p className="text-[16px] text-white line-clamp-2 mt-2">
                    {set.description || 'No description'}
                  </p>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between text-[16px] text-white">
                    <span>{set.is_public ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

