'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { classesService } from '@/lib/supabase/classes';
import { classModulesService } from '@/lib/supabase/class-modules';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Folder,
  BookOpen,
  Plus,
  School,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface StudentClass {
  class_id: string;
  class_name: string;
  class_description: string;
  class_code: string;
  class_color: string;
  teacher_name: string;
  modules_count: number;
  joined_at: string;
}

interface ClassModule {
  module_id: string;
  module_name: string;
  module_color: string;
  sets_count: number;
}

export default function MyClassPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, ClassModule[]>>({});

  useEffect(() => {
    if (!user) {
      router.push('/home');
      return;
    }

    if (profile?.role !== 'student') {
      router.push('/home');
      return;
    }

    loadClasses();
  }, [user, profile]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      console.log('[MyClass] Loading classes for user:', user?.id);
      const data = await classesService.getStudentClasses(user?.id || '');
      console.log('[MyClass] Classes loaded:', data);
      
      // Transform data to match interface
      const transformed = (data || []).map((cls: any) => ({
        class_id: cls.class_id,
        class_name: cls.class_name,
        class_description: cls.class_description || '',
        class_code: cls.class_code || '',
        class_color: cls.class_color || '#3b82f6',
        teacher_name: cls.teacher_username || 'Professeur',
        modules_count: 0, // Will be loaded separately
        joined_at: cls.joined_at,
      }));
      
      setClasses(transformed);
    } catch (error) {
      console.error('[MyClass] Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!joinCode.trim()) {
      setJoinError('Veuillez entrer un code');
      return;
    }

    try {
      setJoining(true);
      setJoinError(null);
      console.log('[MyClass] Joining class with code:', joinCode.trim().toUpperCase());
      console.log('[MyClass] User:', user?.id);
      console.log('[MyClass] Profile role:', profile?.role);
      
      const result = await classesService.joinClassByCode(joinCode.trim().toUpperCase());
      console.log('[MyClass] Join result:', result);
      
      setJoinCode('');
      setShowJoinForm(false);
      await loadClasses();
    } catch (error: any) {
      console.error('[MyClass] Failed to join class:', error);
      setJoinError(error.message || 'Code invalide ou classe introuvable');
    } finally {
      setJoining(false);
    }
  };

  const loadClassModules = async (classId: string) => {
    if (modules[classId]) return; // Already loaded

    try {
      const data = await classModulesService.getClassModules(classId);
      setModules(prev => ({ ...prev, [classId]: data as any }));
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  // Load modules for all classes
  useEffect(() => {
    if (classes.length > 0) {
      classes.forEach(cls => {
        loadClassModules(cls.class_id);
      });
    }
  }, [classes]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-semibold text-content-emphasis mb-2">
          Mes classes
        </h1>
        <p className="text-[15px] text-content-muted">
          Accédez aux modules partagés par vos professeurs
        </p>
      </div>

      {/* Join Class Section */}
      <Card className="mb-6 border-border-subtle">
        {!showJoinForm ? (
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="text-[18px] font-semibold text-content-emphasis mb-1">
                Rejoindre une classe
              </h2>
              <p className="text-[14px] text-content-muted">
                Entrez le code classe fourni par votre professeur
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowJoinForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Rejoindre
            </Button>
          </div>
        ) : (
          <form onSubmit={handleJoinClass} className="p-5">
            <h2 className="text-[18px] font-semibold text-content-emphasis mb-4">
              Rejoindre une classe
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="classCode" className="block text-[14px] font-medium text-content-emphasis mb-2">
                  Code de la classe
                </label>
                <input
                  id="classCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleJoinClass();
                    }
                  }}
                  placeholder="Ex: A3KP9Z"
                  className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-bg-emphasis text-content-emphasis text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase"
                  maxLength={6}
                  autoFocus
                />
                {joinError && (
                  <p className="mt-2 text-[13px] text-content-error flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    {joinError}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinCode('');
                    setJoinError(null);
                  }}
                  className="flex-1"
                  disabled={joining}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={joining || !joinCode.trim()}
                  className="flex-1"
                >
                  {joining ? 'Connexion...' : 'Rejoindre'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>

      {/* Classes List */}
      {classes.length === 0 ? (
        <Card className="p-12 text-center border-border-subtle">
          <School className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[18px] font-semibold text-content-emphasis mb-2">
            Aucune classe rejointe
          </h3>
          <p className="text-[15px] text-content-muted">
            Rejoignez une classe avec un code pour accéder aux modules de votre professeur
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => {
            const classModules = modules[cls.class_id] || [];
            const totalCards = classModules.reduce((sum, m) => sum + m.sets_count, 0);

            return (
              <Card 
                key={cls.class_id} 
                className="group cursor-pointer border-border-subtle hover:shadow-card-hover transition-all"
                onClick={() => router.push(`/my-class/${cls.class_id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cls.class_color }}
                        />
                        <h2 className="text-[18px] font-semibold text-content-emphasis truncate">
                          {cls.class_name}
                        </h2>
                      </div>
                      {cls.class_description && (
                        <p className="text-[14px] text-content-muted mb-2 line-clamp-2">
                          {cls.class_description}
                        </p>
                      )}
                      <p className="text-[13px] text-content-subtle">
                        Par {cls.teacher_name} • Rejoint le {new Date(cls.joined_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-[13px] text-content-muted">
                      <Folder className="h-4 w-4" />
                      <span>{classModules.length} module{classModules.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-content-muted">
                      <BookOpen className="h-4 w-4" />
                      <span>{totalCards} cardz</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[14px] font-medium text-brand-primary">
                    Voir les détails
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
