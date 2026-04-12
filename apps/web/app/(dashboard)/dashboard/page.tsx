'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { ActiveSessions } from '@/components/ActiveSessions';
import { InviteFriendsCTA } from '@/components/InviteFriendsCTA';
import { Plus, BookOpen, Folder, FolderPlus, Trash2, ChevronDown, Play, Pencil, Share2 } from 'lucide-react';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import { useRouter } from 'next/navigation';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';

type Set = Database['public']['Tables']['sets']['Row'];

export default function DashboardPage() {
  const { profile } = useAuthStore();

  // Conditional rendering based on role
  if (profile?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  // Student dashboard (existing code)
  return <StudentDashboard />;
}

function StudentDashboard() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  const [folders, setFolders] = useState<FolderWithSets[]>([]);
  const [setsWithoutFolder, setSetsWithoutFolder] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [draggedSetId, setDraggedSetId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isOtherCollapsed, setIsOtherCollapsed] = useState(false);
  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm(t('deleteCardzConfirm'))) return;
    try {
      const { setsService } = await import('@/lib/supabase/sets');
      await setsService.delete(setId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete set:', error);
      alert(t('deletionFailed'));
    }
  };

  const renderSetActions = (setId: string) => {
    const iconClasses =
      'flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis';
    return (
      <div className="flex items-center gap-2">
        <Link href={`/study/${setId}`} aria-label={t('studyThisCard')} className={iconClasses}>
          <Play className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/sets/${setId}/edit`} aria-label={t('editThisCard')} className={iconClasses}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/sets/${setId}`} aria-label={t('shareThisCard')} className={iconClasses}>
          <Share2 className="h-3.5 w-3.5" />
        </Link>
        <button
          className={`${iconClasses} hover:text-state-danger`}
          aria-label={t('deleteThisCard')}
          onClick={() => handleDeleteSet(setId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

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
    if (!confirm('Are you sure you want to delete this folder? Cardz will be moved out of the folder.')) return;
    
    try {
      await foldersService.delete(folderId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert(t('deleteFolderFailed'));
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

  const totalSets =
    folders.reduce((acc, folder) => acc + folder.sets.length, 0) +
    setsWithoutFolder.length;

  const insights = [
    {
      label: t('organizedCards'),
      value: totalSets,
      detail: `${folders.length} ${t('activeFolders')}`,
    },
    {
      label: t('cardsWithoutFolder'),
      value: setsWithoutFolder.length,
      detail: setsWithoutFolder.length > 0 ? t('toClassifyQuickly') : t('everythingOrganized'),
    },
    {
      label: t('collaborativeFolders'),
      value: folders.filter((folder) => folder.sets.length > 0).length,
      detail: t('foldersWithCards'),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-emphasis p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">{t('dashboard')}</p>
          <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
            {t('welcomeBack')}, {profile?.username}!
          </h1>
          <p className="text-[14px] text-content-muted">
            {t('visualizeProgress')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="justify-center text-[13px] sm:text-[14px]"
            onClick={() => setIsCreateFolderModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4 sm:mr-2" />
            {t('newFolder')}
          </Button>
          <Button
            size="sm"
            className="justify-center text-[13px] sm:text-[14px]"
            onClick={async () => {
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
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            {isCreatingSet ? t('creating') : t('createSet')}
          </Button>
        </div>
      </div>

      {/* Invite Friends CTA */}
      <div className="mb-6">
        <InviteFriendsCTA />
      </div>

      <div className="mb-8 rounded-[32px] border border-border-subtle/80 bg-bg-emphasis/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-content-muted">
          {insights.map((insight, index) => (
            <div key={insight.label} className="flex items-center gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle/80">
                  {insight.label}
                </p>
                <p className="text-[18px] font-semibold text-content-emphasis leading-tight">{insight.value}</p>
              </div>
              <span className="text-[12px] text-content-muted/80">{insight.detail}</span>
              {index < insights.length - 1 && (
                <span className="hidden h-px w-8 bg-border-subtle/60 sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Study Sessions */}
      <div className="mb-8">
        <ActiveSessions />
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-content-muted">{t('loadingYourCards')}</p>
        </div>
      ) : folders.length === 0 && setsWithoutFolder.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <BookOpen className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">
            {t('noCardsYet')}
          </h3>
          <p className="text-[15px] text-content-muted mb-4">
            {t('createFirstSet')}
          </p>
          <Button
            onClick={async () => {
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
          >
            {isCreatingSet ? t('creating') : t('createYourFirstSet')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Folders */}
          {folders.map((folder) => {
            const previewSets = folder.sets.slice(0, 3);
            const remaining = Math.max(0, folder.sets.length - previewSets.length);
            const isCollapsed = collapsedFolders[folder.id];

            return (
              <div
                key={folder.id}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={`rounded-2xl border bg-bg-emphasis/90 p-5 transition-all ${
                  dragOverFolderId === folder.id ? 'border-brand-primary shadow-card-hover' : 'border-border-subtle'
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle text-sm font-semibold" style={{ color: folder.color || '#0F172A' }}>
                      <Folder className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-semibold text-content-emphasis">{folder.name}</h2>
                      <p className="text-[13px] text-content-muted">{folder.sets.length} {t('cardsTotal')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFolderCollapse(folder.id)}
                      className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-content-emphasis"
                      aria-label={isCollapsed ? t('expandFolder') : t('collapseFolder')}
                    >
                      <ChevronDown className={`h-4 w-4 transition ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    <Link href={`/folders/${folder.id}`} className="text-[13px] text-content-muted hover:text-content-emphasis">
                      {t('viewFolder')}
                    </Link>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="rounded-full border border-border-subtle p-2 text-content-subtle transition-colors hover:text-state-danger"
                      title={t('deleteFolder')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-3">
                  {previewSets.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border-muted p-4 text-center text-content-subtle">
                      {t('dragCardsHere')}
                    </div>
                  )}

                    {previewSets.map((set) => (
                      <div
                        key={set.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, set.id)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-xl border border-border-subtle bg-bg-emphasis px-4 py-3 transition-all hover:shadow-card ${
                          draggedSetId === set.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Link href={`/sets/${set.id}`} className="text-[15px] font-semibold text-content-emphasis line-clamp-1">
                              {set.title}
                            </Link>
                            <span className="text-[12px] text-content-muted">{set.is_public ? t('public') : t('private')}</span>
                          </div>
                          <p className="text-[13px] text-content-muted line-clamp-2">{set.description || t('noDescription')}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[12px] text-content-muted">{new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                            {renderSetActions(set.id)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {remaining > 0 && (
                      <div className="flex justify-center">
                        <Link
                          href={`/folders/${folder.id}`}
                          className="flex items-center gap-2 rounded-xl border border-dashed border-border-muted px-4 py-2 text-sm font-medium text-content-muted hover:text-content-emphasis"
                        >
                          <span className="text-[12px] uppercase tracking-[0.2em]">{t('seeMore')}</span>
                          <span>+ {remaining} {t('cardsTotal')}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {setsWithoutFolder.length > 0 && (
            <div
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`rounded-2xl border bg-bg-emphasis/90 p-5 transition-all ${
                dragOverFolderId === null ? 'border-brand-primary shadow-card-hover' : 'border-border-subtle'
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle text-sm font-semibold">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-content-emphasis">{t('otherCards')}</h2>
                    <p className="text-[13px] text-content-muted">{setsWithoutFolder.length} {t('cardsToOrganize')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOtherCollapsed((prev) => !prev)}
                    className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-content-emphasis"
                    aria-label={isOtherCollapsed ? t('expandOtherCards') : t('collapseOtherCards')}
                  >
                    <ChevronDown className={`h-4 w-4 transition ${isOtherCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                  <Link href="/dashboard" className="text-[13px] text-content-muted hover:text-content-emphasis">
                    {t('showAll')}
                  </Link>
                </div>
              </div>

              {!isOtherCollapsed && (
                <div className="space-y-3">
                  {setsWithoutFolder.map((set) => (
                    <div
                      key={set.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, set.id)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-xl border border-border-subtle bg-bg-emphasis px-4 py-3 transition-all hover:shadow-card ${
                        draggedSetId === set.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Link href={`/sets/${set.id}`} className="text-[15px] font-semibold text-content-emphasis line-clamp-1">
                            {set.title}
                          </Link>
                          <span className="text-[12px] text-content-muted">{set.is_public ? t('public') : t('private')}</span>
                        </div>
                        <p className="text-[13px] text-content-muted line-clamp-2">{set.description || t('noDescription')}</p>
                        <div className="flex items-center justify-between text-[12px] text-content-muted pt-1">
                          <span>{new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                          {renderSetActions(set.id)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

