'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { Plus, BookOpen, Folder, FolderPlus, Trash2 } from 'lucide-react';

type Set = Database['public']['Tables']['sets']['Row'];

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const [folders, setFolders] = useState<FolderWithSets[]>([]);
  const [setsWithoutFolder, setSetsWithoutFolder] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [draggedSetId, setDraggedSetId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      try {
        const data = await foldersService.getWithSets();
        setFolders(data.folders || []);
        setSetsWithoutFolder(data.setsWithoutFolder || []);
      } catch (error: any) {
        // Fallback: if folders service fails, use setsService directly
        console.warn('Folders service failed, using fallback:', error);
        const { setsService } = await import('@/lib/supabase/sets');
        const mySets = await setsService.getMySets();
        setFolders([]);
        setSetsWithoutFolder(mySets || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Don't show alert, just log the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await foldersService.create({ name });
      await loadData();
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      let errorMessage = 'Failed to create folder.';
      
      if (error?.message?.includes('folders') || error?.message?.includes('schema cache')) {
        errorMessage = 'The folders table does not exist. Please run the SQL migration first:\n\n1. Go to Supabase Dashboard → SQL Editor\n2. Execute the file: supabase/add_folders.sql\n\nSee supabase/FOLDERS_MIGRATION.md for details.';
      } else {
        errorMessage = error?.message || errorMessage;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Sets will be moved out of the folder.')) return;
    
    try {
      await foldersService.delete(folderId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert('Failed to delete folder');
    }
  };

  const handleDragStart = (e: React.DragEvent, setId: string) => {
    setDraggedSetId(setId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedSetId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!draggedSetId) return;

    try {
      await foldersService.addSetToFolder(draggedSetId, folderId);
      await loadData();
    } catch (error) {
      console.error('Failed to move set:', error);
      alert('Failed to move set');
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold text-dark-text-primary leading-tight">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-[16px] text-dark-text-secondary mt-1">Manage your study sets</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateFolderModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Link href="/sets/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Set
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-dark-text-secondary">Loading your sets...</p>
        </div>
      ) : folders.length === 0 && setsWithoutFolder.length === 0 ? (
        <Card variant="emptyState" className="text-center py-12">
          <BookOpen className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
          <h3 className="text-title font-semibold text-dark-text-primary mb-2">
            No sets yet
          </h3>
          <p className="text-bodySecondary text-dark-text-secondary mb-4">
            Create your first study set to get started
          </p>
          <Link href="/sets/create">
            <Button>Create Your First Set</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dragOverFolderId === folder.id
                  ? 'border-brand-primary bg-dark-background-cardMuted'
                  : 'border-[rgba(255,255,255,0.12)] bg-dark-background-cardMuted'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5" style={{ color: folder.color }} />
                  <h2 className="text-[20px] font-semibold text-dark-text-primary">{folder.name}</h2>
                  <span className="text-[13px] text-dark-text-muted">({folder.sets.length})</span>
                </div>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1 text-dark-text-muted hover:text-dark-states-danger transition-colors"
                  title="Delete folder"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folder.sets.map((set) => (
                  <div
                    key={set.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, set.id)}
                    onDragEnd={handleDragEnd}
                    className={`hover:shadow-elevation-1 transition-shadow cursor-pointer h-full ${
                      draggedSetId === set.id ? 'opacity-50' : ''
                    }`}
                  >
                    <Link href={`/sets/${set.id}`} className="block h-full">
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                          <p className="text-[16px] text-dark-text-secondary line-clamp-2 mt-2">
                            {set.description || 'No description'}
                          </p>
                        </CardHeader>
                        <div className="px-6 pb-6">
                          <div className="flex items-center justify-between text-[13px] text-dark-text-muted">
                            <span>{set.is_public ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))}
                {folder.sets.length === 0 && (
                  <div className="col-span-full text-center py-8 text-dark-text-muted">
                    <p>Drag sets here to organize them</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Sets without folder */}
          {setsWithoutFolder.length > 0 && (
            <div>
              <h2 className="text-[20px] font-semibold text-dark-text-primary mb-4">Other Sets</h2>
              <div
                onDragOver={(e) => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  dragOverFolderId === null
                    ? 'border-brand-primary bg-dark-background-cardMuted'
                    : 'border-transparent'
                }`}
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {setsWithoutFolder.map((set) => (
                    <div
                      key={set.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, set.id)}
                      onDragEnd={handleDragEnd}
                      className={`hover:shadow-lg transition-shadow cursor-pointer h-full ${
                        draggedSetId === set.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Link href={`/sets/${set.id}`} className="block h-full">
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                            <p className="text-bodySecondary text-dark-text-secondary line-clamp-2 mt-2">
                              {set.description || 'No description'}
                            </p>
                          </CardHeader>
                          <div className="px-6 pb-6">
                            <div className="flex items-center justify-between text-bodySm text-dark-text-muted">
                              <span>{set.is_public ? 'Public' : 'Private'}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />
    </>
  );
}

