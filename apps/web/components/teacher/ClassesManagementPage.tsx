'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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
  ChevronRight,
  School
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

interface ClassStudent {
  member_id: string;
  username: string;
  email: string;
  avatar: string | null;
  joined_at: string;
}

export function ClassesManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classModules, setClassModules] = useState<Record<string, ClassModule[]>>({});
  const [classStudents, setClassStudents] = useState<Record<string, ClassStudent[]>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

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
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassDetails = async (classId: string) => {
    try {
      // Load modules
      const modules = await classModulesService.getClassModules(classId);
      setClassModules(prev => ({ ...prev, [classId]: modules }));
      
      // Load students
      const students = await classesService.getClassStudents(classId);
      setClassStudents(prev => ({ ...prev, [classId]: students as any }));
    } catch (error) {
      console.error('Failed to load class details:', error);
    }
  };

  const handleCreateClass = async (data: { name: string; description?: string }) => {
    try {
      await classesService.createClass(data, user?.id);
      await loadClasses();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error('Failed to create class:', error);
      alert(error.message || 'Erreur lors de la création de la classe.');
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer la classe "${className}" ? Les élèves perdront l'accès.`)) return;
    
    try {
      await classesService.deleteClass(classId, user?.id);
      await loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('Erreur lors de la suppression.');
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copié dans le presse-papier !');
  };

  const toggleCodeVisibility = (classId: string) => {
    setVisibleCodes(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const toggleClassExpansion = async (classId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const isCurrentlyExpanded = expandedClasses[classId];
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
    
    if (!isCurrentlyExpanded && !classModules[classId]) {
      await loadClassDetails(classId);
    }
  };

  const handleRemoveStudent = async (classId: string, studentId: string, username: string) => {
    if (!confirm(`Retirer ${username} de cette classe ?`)) return;
    
    try {
      await classesService.removeStudent(classId, studentId);
      await loadClassDetails(classId);
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('Erreur lors du retrait de l\'élève.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-emphasis p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-brand-primary" />
            <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Gestion</p>
          </div>
          <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
            Mes Classes
          </h1>
          <p className="text-[14px] text-content-muted">
            Créez et gérez vos classes, partagez des modules avec vos élèves.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="justify-center text-[13px] sm:text-[14px]"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          Nouvelle classe
        </Button>
      </div>

      {/* Empty state */}
      {classes.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <Users className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">
            Aucune classe créée
          </h3>
          <p className="text-[15px] text-content-muted mb-4">
            Créez votre première classe pour commencer à partager du contenu avec vos élèves
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer ma première classe
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle">Classes</p>
                  <p className="text-[24px] font-semibold text-content-emphasis leading-tight">{classes.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle">Élèves</p>
                  <p className="text-[24px] font-semibold text-content-emphasis leading-tight">
                    {classes.reduce((sum, cls) => sum + cls.student_count, 0)}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50">
                  <Folder className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle">Modules</p>
                  <p className="text-[24px] font-semibold text-content-emphasis leading-tight">
                    {Object.values(classModules).flat().length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Classes List */}
          <div className="space-y-4">
            {classes.map((cls) => {
              const isExpanded = expandedClasses[cls.class_id];
              const modules = classModules[cls.class_id] || [];

              return (
                <Card 
                  key={cls.class_id} 
                  className="p-5 cursor-pointer hover:shadow-card-hover transition-all duration-200"
                  onClick={() => router.push(`/classes/${cls.class_id}`)}
                >
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
                      
                      <div className="flex flex-wrap gap-4 text-[13px] text-content-muted">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{cls.student_count} élève{cls.student_count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Folder className="h-4 w-4" />
                          <span>{modules.length} module{modules.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{modules.reduce((sum, m) => sum + m.sets_count, 0)} cardz</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-content-subtle mb-2">Code classe</p>
                        <div className="flex items-center gap-2">
                          {visibleCodes[cls.class_id] ? (
                            <>
                              <code className="flex-1 text-[15px] font-mono font-semibold text-content-emphasis">
                                {cls.class_code}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyClassCode(cls.class_code);
                                }}
                                className="p-2 hover:bg-bg-emphasis rounded transition"
                                title="Copier"
                              >
                                <Copy className="h-4 w-4 text-content-muted" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCodeVisibility(cls.class_id);
                                }}
                                className="p-2 hover:bg-bg-emphasis rounded transition"
                                title="Masquer"
                              >
                                <EyeOff className="h-4 w-4 text-content-muted" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCodeVisibility(cls.class_id);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-brand-primary hover:bg-blue-50 rounded transition"
                            >
                              <Eye className="h-4 w-4" />
                              Afficher
                            </button>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.class_id, cls.class_name);
                        }}
                        className="text-state-danger hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-subtle">
                    <button
                      onClick={(e) => toggleClassExpansion(cls.class_id, e)}
                      className="flex items-center gap-2 text-[14px] text-brand-primary hover:underline"
                    >
                      <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                      {isExpanded ? 'Masquer l\'aperçu' : 'Aperçu rapide'}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-6">
                        {/* Students Section */}
                        <div>
                          <h3 className="text-[15px] font-semibold text-content-emphasis mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Élèves ({(classStudents[cls.class_id] || []).length})
                          </h3>
                          {(classStudents[cls.class_id] || []).length === 0 ? (
                            <p className="text-[13px] text-content-muted italic">
                              Aucun élève n'a encore rejoint cette classe.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(classStudents[cls.class_id] || []).map((student: ClassStudent) => (
                                <div
                                  key={student.member_id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-subtle"
                                >
                                  <div className="flex items-center gap-3">
                                    {student.avatar ? (
                                      <img 
                                        src={student.avatar} 
                                        alt={student.username}
                                        className="h-8 w-8 rounded-full"
                                      />
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-[12px] font-semibold">
                                        {student.username.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-[14px] font-medium text-content-emphasis">
                                        {student.username}
                                      </p>
                                      <p className="text-[11px] text-content-muted">
                                        {new Date(student.joined_at).toLocaleDateString('fr-FR')}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveStudent(cls.class_id, student.member_id, student.username);
                                    }}
                                    className="p-2 hover:bg-red-50 rounded-lg transition text-content-subtle hover:text-state-danger"
                                    title="Retirer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Modules Section */}
                        <div>
                          <h3 className="text-[15px] font-semibold text-content-emphasis mb-3 flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            Modules partagés ({modules.length})
                          </h3>
                          {modules.length === 0 ? (
                            <p className="text-[13px] text-content-muted italic">
                              Aucun module partagé. Allez sur "Votre espace" pour partager des modules.
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
                                        {module.sets_count} cardz
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
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateClass}
      />
    </div>
  );
}

