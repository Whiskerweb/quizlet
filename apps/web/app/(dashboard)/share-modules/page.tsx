'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { foldersService, type FolderWithSets } from '@/lib/supabase/folders';
import { classesService } from '@/lib/supabase/classes';
import { classModulesService } from '@/lib/supabase/class-modules';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Folder, 
  Users, 
  BookOpen, 
  ArrowLeft,
  Check,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

interface TeacherClass {
  class_id: string;
  class_name: string;
  class_description: string;
  class_code: string;
  class_color: string;
  created_at: string;
  student_count: number;
}

interface ClassModule {
  module_id: string;
  module_name: string;
  module_color: string;
  shared_at: string;
  sets_count: number;
}

export default function ShareModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<FolderWithSets[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classModules, setClassModules] = useState<Record<string, ClassModule[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [modulesData, classesData] = await Promise.all([
        foldersService.getWithSets(),
        classesService.getMyClasses()
      ]);
      
      setModules(modulesData.folders || []);
      setClasses(classesData || []);
      
      // Load modules for each class
      for (const cls of classesData || []) {
        const modules = await classModulesService.getClassModules(cls.class_id);
        setClassModules(prev => ({ ...prev, [cls.class_id]: modules }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModuleId(moduleId);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragEnd = () => {
    setDraggedModuleId(null);
    setDragOverClassId(null);
  };

  const handleDragOver = (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverClassId(classId);
  };

  const handleDragLeave = () => {
    setDragOverClassId(null);
  };

  const handleDrop = async (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClassId(null);

    if (!draggedModuleId) return;

    const moduleData = modules.find(m => m.id === draggedModuleId);
    const cls = classes.find(c => c.class_id === classId);
    
    if (!moduleData || !cls) return;

    // Check if already shared
    const isAlreadyShared = classModules[classId]?.some(m => m.module_id === draggedModuleId);
    
    if (isAlreadyShared) {
      alert(`Le module "${moduleData.name}" est déjà partagé avec cette classe.`);
      setDraggedModuleId(null);
      return;
    }

    try {
      await classModulesService.shareModuleWithClass(draggedModuleId, classId);
      
      // Show success message
      setSuccessMessage(`✅ Module "${moduleData.name}" partagé avec "${cls.class_name}" !`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload class modules
      const updatedModules = await classModulesService.getClassModules(classId);
      setClassModules(prev => ({ ...prev, [classId]: updatedModules }));
      
    } catch (error: any) {
      console.error('Failed to share module:', error);
      alert(error.message || 'Erreur lors du partage du module.');
    }
    
    setDraggedModuleId(null);
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
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-[14px] text-content-muted hover:text-content-emphasis"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
        
        <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-emphasis p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Partage de contenu</p>
            <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
              Partager des Modules
            </h1>
            <p className="text-[14px] text-content-muted">
              Glissez-déposez vos modules sur vos classes pour les partager avec vos élèves.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Instructions */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
            i
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-blue-900 mb-1">Comment ça marche ?</h3>
            <ol className="text-[13px] text-blue-700 space-y-1">
              <li>1. Sélectionnez un module dans la liste de gauche</li>
              <li>2. Glissez-le sur la classe de votre choix à droite</li>
              <li>3. Le module sera dupliqué et partagé avec tous les élèves de la classe</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Modules */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-content-emphasis">
              Mes Modules ({modules.length})
            </h2>
          </div>

          {modules.length === 0 ? (
            <Card className="p-6 text-center">
              <Folder className="h-10 w-10 text-content-subtle mx-auto mb-3" />
              <p className="text-[14px] text-content-muted">
                Aucun module. Créez-en un depuis le dashboard.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, module.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border border-border-subtle bg-bg-emphasis p-4 cursor-grab active:cursor-grabbing transition-all",
                    draggedModuleId === module.id && "opacity-50 scale-95",
                    "hover:shadow-card hover:border-brand-primary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-subtle">
                      <Folder className="h-5 w-5" style={{ color: module.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-semibold text-content-emphasis">
                        {module.name}
                      </h3>
                      <p className="text-[13px] text-content-muted">
                        {module.sets.length} cardz
                      </p>
                    </div>
                    <div className="text-[24px] text-content-subtle">
                      ⋮⋮
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Classes */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-content-emphasis">
              Mes Classes ({classes.length})
            </h2>
          </div>

          {classes.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-10 w-10 text-content-subtle mx-auto mb-3" />
              <p className="text-[14px] text-content-muted mb-3">
                Aucune classe. Créez-en une pour commencer.
              </p>
              <Link href="/dashboard">
                <Button size="sm">Créer une classe</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const modules = classModules[cls.class_id] || [];
                const isDragOver = dragOverClassId === cls.class_id;

                return (
                  <div
                    key={cls.class_id}
                    onDragOver={(e) => handleDragOver(e, cls.class_id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, cls.class_id)}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-4 transition-all",
                      isDragOver 
                        ? "border-brand-primary bg-blue-50 shadow-lg scale-105" 
                        : "border-border-muted bg-bg-emphasis hover:border-border-emphasis"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg" 
                        style={{ backgroundColor: cls.class_color + '20' }}
                      >
                        <Users className="h-5 w-5" style={{ color: cls.class_color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[16px] font-semibold text-content-emphasis mb-1">
                          {cls.class_name}
                        </h3>
                        <p className="text-[13px] text-content-muted mb-3">
                          {cls.student_count} élève{cls.student_count > 1 ? 's' : ''}
                        </p>
                        
                        {/* Shared modules */}
                        {modules.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">
                              Modules partagés
                            </p>
                            {modules.map((module) => (
                              <div
                                key={module.module_id}
                                className="flex items-center gap-2 text-[13px] text-content-muted"
                              >
                                <Check className="h-3.5 w-3.5 text-green-600" />
                                <span>{module.module_name}</span>
                                <span className="text-content-subtle">({module.sets_count})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {isDragOver && (
                          <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-brand-primary">
                            <ArrowRight className="h-4 w-4" />
                            Déposez pour partager
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">
            Retour au dashboard
          </Button>
        </Link>
        <Link href="/classes" className="flex-1">
          <Button variant="outline" className="w-full">
            Gérer les classes
          </Button>
        </Link>
      </div>
    </>
  );
}

