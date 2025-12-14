'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { classesService } from '@/lib/supabase/classes';
import { classModulesService } from '@/lib/supabase/class-modules';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreateClassModal } from '@/components/teacher/CreateClassModal';
import { 
  Plus, 
  Users, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  BookOpen,
  Folder,
  ChevronRight
} from 'lucide-react';
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

export default function ClassesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [classModules, setClassModules] = useState<Record<string, ClassModule[]>>({});

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const data = await classesService.getMyClasses(user?.id);
      setClasses(data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      alert(t('errorLoadingClasses'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassModules = async (classId: string) => {
    try {
      const modules = await classModulesService.getClassModules(classId);
      setClassModules(prev => ({ ...prev, [classId]: modules }));
    } catch (error) {
      console.error('Failed to load class modules:', error);
    }
  };

  const handleCreateClass = async (data: { name: string; description?: string }) => {
    try {
      await classesService.createClass(data);
      await loadClasses();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create class:', error);
      alert(t('errorCreatingClass'));
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(t('confirmDeleteClass').replace('{className}', className))) return;
    
    try {
      await classesService.deleteClass(classId, user?.id);
      await loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert(t('errorDeletingClass'));
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copié dans le presse-papier !');
  };

  const toggleCodeVisibility = (classId: string) => {
    setVisibleCodes(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const toggleClassExpansion = async (classId: string) => {
    const isCurrentlyExpanded = expandedClasses[classId];
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
    
    // Load modules if expanding and not already loaded
    if (!isCurrentlyExpanded && !classModules[classId]) {
      await loadClassModules(classId);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-content-muted">{t('loading')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-emphasis p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">{t('classManagement')}</p>
          <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
            {t('myClasses')}
          </h1>
          <p className="text-[14px] text-content-muted">
            {t('manageClassesShareModules')}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="justify-center text-[13px] sm:text-[14px]"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          {t('newClass')}
        </Button>
      </div>

      {/* Empty state */}
      {classes.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <Users className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">
            {t('noClassesCreated')}
          </h3>
          <p className="text-[15px] text-content-muted mb-4">
            {t('createFirstClassDescription')}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            {t('createMyFirstClass')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expandedClasses[cls.class_id];
            const modules = classModules[cls.class_id] || [];

            return (
              <Card key={cls.class_id} className="p-5">
                {/* Class Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: cls.class_color }}
                      />
                      <h2 className="text-[20px] font-semibold text-content-emphasis">
                        {cls.class_name}
                      </h2>
                    </div>
                    {cls.class_description && (
                      <p className="text-[14px] text-content-muted mb-3">
                        {cls.class_description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-[13px] text-content-muted">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{cls.student_count} {cls.student_count > 1 ? t('students') : t('student')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Folder className="h-4 w-4" />
                        <span>{modules.length} {modules.length > 1 ? t('modules') : t('module')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        <span>{modules.reduce((sum, m) => sum + m.sets_count, 0)} {t('cards')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {/* Class Code */}
                    <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle mb-2">{t('classCode')}</p>
                      <div className="flex items-center gap-2">
                        {visibleCodes[cls.class_id] ? (
                          <>
                            <code className="flex-1 text-[15px] font-mono font-semibold text-content-emphasis">
                              {cls.class_code}
                            </code>
                            <button
                              onClick={() => copyClassCode(cls.class_code)}
                              className="p-2 hover:bg-bg-emphasis rounded transition"
                              title={t('copy')}
                            >
                              <Copy className="h-4 w-4 text-content-muted" />
                            </button>
                            <button
                              onClick={() => toggleCodeVisibility(cls.class_id)}
                              className="p-2 hover:bg-bg-emphasis rounded transition"
                              title={t('hide')}
                            >
                              <EyeOff className="h-4 w-4 text-content-muted" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleCodeVisibility(cls.class_id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-brand-primary hover:bg-blue-50 rounded transition"
                          >
                            <Eye className="h-4 w-4" />
                            {t('show')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClass(cls.class_id, cls.class_name)}
                      className="text-state-danger hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('deleteFolder')}
                    </Button>
                  </div>
                </div>

                {/* Expand/Collapse Details */}
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <button
                    onClick={() => toggleClassExpansion(cls.class_id)}
                    className="flex items-center gap-2 text-[14px] text-brand-primary hover:underline"
                  >
                    <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                    {isExpanded ? t('hideDetails') : t('viewDetails')}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Modules shared */}
                      <div>
                        <h3 className="text-[15px] font-semibold text-content-emphasis mb-3">
                          {t('sharedModules')} ({modules.length})
                        </h3>
                        {modules.length === 0 ? (
                          <p className="text-[13px] text-content-muted italic">
                            {t('noSharedModules')}
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {modules.map((module) => (
                              <div
                                key={module.module_id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-emphasis"
                              >
                                <div className="flex items-center gap-2">
                                  <Folder className="h-4 w-4" style={{ color: module.module_color }} />
                                  <div>
                                    <p className="text-[14px] font-medium text-content-emphasis">
                                      {module.module_name}
                                    </p>
                                    <p className="text-[12px] text-content-muted">
                                      {module.sets_count} {t('cards')}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[11px] text-content-subtle">
                                  {new Date(module.shared_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Students */}
                      <div>
                        <h3 className="text-[15px] font-semibold text-content-emphasis mb-3">
                          {t('students')} ({cls.student_count})
                        </h3>
                        <Link
                          href={`/classes/${cls.class_id}/students`}
                          className="inline-flex items-center gap-2 text-[13px] text-brand-primary hover:underline"
                        >
                          {t('viewStudentsList')}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateClass}
      />
    </>
  );
}

