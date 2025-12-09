'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { classesService } from '@/lib/supabase/classes';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { CreateClassModal } from '@/components/teacher/CreateClassModal';
import { 
  Plus, 
  BookOpen, 
  Folder, 
  FolderPlus, 
  Trash2, 
  ChevronDown, 
  Play, 
  Pencil, 
  Share2,
  Users,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import { cn } from '@/lib/utils/cn';

type Set = Database['public']['Tables']['sets']['Row'];

interface TeacherClass {
  class_id: string;
  class_name: string;
  class_description: string;
  class_code: string;
  class_color: string;
  created_at: string;
  student_count: number;
}

export function TeacherDashboard() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const [modules, setModules] = useState<FolderWithSets[]>([]);
  const [setsWithoutModule, setSetsWithoutModule] = useState<Set[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [isOtherCollapsed, setIsOtherCollapsed] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
  const [draggedSetId, setDraggedSetId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'other'>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load modules (folders)
      const foldersData = await foldersService.getWithSets();
      setModules(foldersData.folders || []);
      setSetsWithoutModule(foldersData.setsWithoutFolder || []);
      
      // Load classes
      const classesData = await classesService.getMyClasses(user?.id);
      setClasses(classesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async (name: string) => {
    try {
      await foldersService.create({ name });
      await loadData();
    } catch (error) {
      console.error('Failed to create module:', error);
      alert('Erreur lors de la création du module.');
    }
  };

  const handleCreateClass = async (data: { name: string; description?: string }) => {
    try {
      await classesService.createClass(data);
      await loadData();
      setIsCreateClassModalOpen(false);
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Erreur lors de la création de la classe.');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Voulez-vous supprimer ce module ? Les cardz seront déplacés dans "Autres cardz".')) return;
    try {
      await foldersService.delete(moduleId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert('Suppression impossible.');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm('Voulez-vous supprimer ce cardz ?')) return;
    try {
      const { setsService } = await import('@/lib/supabase/sets');
      await setsService.delete(setId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete set:', error);
      alert('Suppression impossible.');
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copié dans le presse-papier !');
  };

  const toggleCodeVisibility = (classId: string) => {
    setVisibleCodes(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, setId: string) => {
    setDraggedSetId(setId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedSetId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null | 'other') => {
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
      alert('Erreur lors du déplacement du cardz');
    }
  };

  const totalSets = modules.reduce((acc, module) => acc + module.sets.length, 0) + setsWithoutModule.length;
  const totalStudents = classes.reduce((acc, cls) => acc + cls.student_count, 0);

  const renderSetActions = (setId: string) => {
    const iconClasses = 'flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis';
    return (
      <div className="flex items-center gap-2">
        <Link href={`/study/${setId}`} aria-label="Étudier" className={iconClasses}>
          <Play className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/sets/${setId}/edit`} aria-label="Modifier" className={iconClasses}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/sets/${setId}`} aria-label="Partager" className={iconClasses}>
          <Share2 className="h-3.5 w-3.5" />
        </Link>
        <button
          className={`${iconClasses} hover:text-state-danger`}
          aria-label="Supprimer"
          onClick={() => handleDeleteSet(setId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-content-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-emphasis p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Dashboard Professeur</p>
          <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
            Bonjour, {profile?.username} 👨‍🏫
          </h1>
          <p className="text-[14px] text-content-muted">
            Gérez vos modules, classes et partagez du contenu avec vos élèves.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="justify-center text-[13px] sm:text-[14px]"
            onClick={() => setIsCreateClassModalOpen(true)}
          >
            <Users className="h-4 w-4 sm:mr-2" />
            Nouvelle classe
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center text-[13px] sm:text-[14px]"
            onClick={() => setIsCreateModuleModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4 sm:mr-2" />
            Nouveau module
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
                alert('Erreur lors de la création.');
              } finally {
                setIsCreatingSet(false);
              }
            }}
            disabled={isCreatingSet}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            {isCreatingSet ? 'Création…' : 'Créer un cardz'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 rounded-[32px] border border-border-subtle/80 bg-bg-emphasis/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-content-muted">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle/80">Modules</p>
              <p className="text-[18px] font-semibold text-content-emphasis leading-tight">{modules.length}</p>
            </div>
            <span className="text-[12px] text-content-muted/80">{totalSets} cardz au total</span>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle/80">Classes</p>
              <p className="text-[18px] font-semibold text-content-emphasis leading-tight">{classes.length}</p>
            </div>
            <span className="text-[12px] text-content-muted/80">{totalStudents} élèves</span>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle/80">Cardz sans module</p>
              <p className="text-[18px] font-semibold text-content-emphasis leading-tight">{setsWithoutModule.length}</p>
            </div>
            <span className="text-[12px] text-content-muted/80">À organiser</span>
          </div>
        </div>
      </div>

      {/* Quick Action: Share Modules */}
      {modules.length > 0 && classes.length > 0 && (
        <div className="mb-6">
          <Link href="/share-modules">
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-card-hover transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-blue-900 mb-1">
                      Partager des modules avec vos classes
                    </h3>
                    <p className="text-[13px] text-blue-700">
                      Glissez-déposez vos modules pour les partager avec vos élèves
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-blue-600 -rotate-90" />
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Classes Section */}
      {classes.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-content-emphasis">Mes Classes</h2>
            <Link href="/classes" className="text-[13px] text-brand-primary hover:underline">
              Voir toutes
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.slice(0, 3).map((cls) => (
              <Card key={cls.class_id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[16px] text-content-emphasis">{cls.class_name}</h3>
                    {cls.class_description && (
                      <p className="text-[13px] text-content-muted mt-1">{cls.class_description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-content-muted">
                    <Users className="h-3.5 w-3.5" />
                    <span>{cls.student_count}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-content-muted">Code classe :</span>
                    <div className="flex items-center gap-2">
                      {visibleCodes[cls.class_id] ? (
                        <>
                          <code className="text-[13px] font-mono font-semibold text-content-emphasis">
                            {cls.class_code}
                          </code>
                          <button
                            onClick={() => copyClassCode(cls.class_code)}
                            className="p-1 hover:bg-bg-subtle rounded"
                            title="Copier le code"
                          >
                            <Copy className="h-3.5 w-3.5 text-content-muted" />
                          </button>
                          <button
                            onClick={() => toggleCodeVisibility(cls.class_id)}
                            className="p-1 hover:bg-bg-subtle rounded"
                          >
                            <EyeOff className="h-3.5 w-3.5 text-content-muted" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleCodeVisibility(cls.class_id)}
                          className="flex items-center gap-1 px-2 py-1 text-[12px] text-brand-primary hover:bg-blue-50 rounded"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Afficher
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modules Section */}
      <div className="space-y-8">
        <h2 className="text-[18px] font-semibold text-content-emphasis">Mes Modules</h2>
        
        {modules.length === 0 && setsWithoutModule.length === 0 ? (
          <Card variant="emptyState" className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-content-subtle mx-auto mb-4" />
            <h3 className="text-[16px] text-content-emphasis mb-2">Aucun module pour l'instant</h3>
            <p className="text-[15px] text-content-muted mb-4">
              Créez votre premier module pour organiser vos cardz
            </p>
            <Button onClick={() => setIsCreateModuleModalOpen(true)}>
              Créer un module
            </Button>
          </Card>
        ) : (
          <>
            {/* Modules with sets */}
            {modules.map((module) => {
              const previewSets = module.sets.slice(0, 3);
              const remaining = Math.max(0, module.sets.length - previewSets.length);
              const isCollapsed = collapsedModules[module.id];

              return (
                <div
                  key={module.id}
                  className={cn(
                    "rounded-2xl border border-border-subtle bg-bg-emphasis/90 p-5 transition-all",
                    dragOverFolderId === module.id && "border-brand-primary bg-blue-50 shadow-lg"
                  )}
                  onDragOver={(e) => handleDragOver(e, module.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, module.id)}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle">
                        <Folder className="h-4 w-4" style={{ color: module.color || '#0F172A' }} />
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold text-content-emphasis">{module.name}</h3>
                        <p className="text-[13px] text-content-muted">{module.sets.length} cardz</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCollapsedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }))}
                        className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-content-emphasis"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition", isCollapsed && "-rotate-90")} />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        className="rounded-full border border-border-subtle p-2 text-content-subtle transition-colors hover:text-state-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-3">
                      {previewSets.length === 0 && (
                        <div
                          className={cn(
                            "rounded-xl border-2 border-dashed p-8 text-center transition-all",
                            dragOverFolderId === module.id
                              ? "border-brand-primary bg-blue-50 text-brand-primary"
                              : "border-border-muted text-content-subtle"
                          )}
                          onDragOver={(e) => handleDragOver(e, module.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, module.id)}
                        >
                          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-[14px] font-medium">
                            {dragOverFolderId === module.id
                              ? "Déposez ici pour ajouter au module"
                              : "Aucun cardz dans ce module. Glissez-déposez un cardz ici."}
                          </p>
                        </div>
                      )}
                      {previewSets.map((set) => (
                        <div
                          key={set.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, set.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "rounded-xl border border-border-subtle bg-bg-emphasis px-4 py-3 cursor-move transition-all",
                            draggedSetId === set.id && "opacity-50"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Link href={`/sets/${set.id}`} className="text-[15px] font-semibold text-content-emphasis line-clamp-1">
                                {set.title}
                              </Link>
                              <span className="text-[12px] text-content-muted">{set.is_public ? 'Public' : 'Privé'}</span>
                            </div>
                            <p className="text-[13px] text-content-muted line-clamp-2">{set.description || 'Aucune description'}</p>
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
                            href={`/folders/${module.id}`}
                            className="flex items-center gap-2 rounded-xl border border-dashed border-border-muted px-4 py-2 text-sm font-medium text-content-muted hover:text-content-emphasis"
                          >
                            <span className="text-[12px] uppercase tracking-[0.2em]">Voir plus</span>
                            <span>+ {remaining} cardz</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sets without module */}
            {setsWithoutModule.length > 0 && (
              <div
                className={cn(
                  "rounded-2xl border border-border-subtle bg-bg-emphasis/90 p-5 transition-all",
                  dragOverFolderId === 'other' && "border-brand-primary bg-blue-50 shadow-lg"
                )}
                onDragOver={(e) => handleDragOver(e, 'other')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-content-emphasis">Autres Cardz</h3>
                      <p className="text-[13px] text-content-muted">{setsWithoutModule.length} cardz à organiser</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOtherCollapsed(prev => !prev)}
                    className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-content-emphasis"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition", isOtherCollapsed && "-rotate-90")} />
                  </button>
                </div>

                {!isOtherCollapsed && (
                  <div className="space-y-3">
                    {setsWithoutModule.map((set) => (
                      <div
                        key={set.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, set.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "rounded-xl border border-border-subtle bg-bg-emphasis px-4 py-3 cursor-move transition-all",
                          draggedSetId === set.id && "opacity-50"
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Link href={`/sets/${set.id}`} className="text-[15px] font-semibold text-content-emphasis line-clamp-1">
                              {set.title}
                            </Link>
                            <span className="text-[12px] text-content-muted">{set.is_public ? 'Public' : 'Privé'}</span>
                          </div>
                          <p className="text-[13px] text-content-muted line-clamp-2">{set.description || 'Aucune description'}</p>
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
          </>
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateModuleModalOpen}
        onClose={() => setIsCreateModuleModalOpen(false)}
        onCreate={handleCreateModule}
        title="Créer un module"
      />
      
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        onCreate={handleCreateClass}
      />
    </>
  );
}

