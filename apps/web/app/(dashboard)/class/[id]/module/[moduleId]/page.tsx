'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { classModulesService } from '@/lib/supabase/class-modules';
import { setsService } from '@/lib/supabase/sets';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookOpen, Play, ArrowLeft, Folder, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ModuleSet {
  set_id: string;
  set_title: string;
  set_description: string;
  set_language: string;
  flashcard_count: number;
  created_at: string;
  module_shared_at?: string;
}

export default function ClassModulePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const classId = params.id as string;
  const moduleId = params.moduleId as string;
  
  const [sets, setSets] = useState<ModuleSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleName, setModuleName] = useState('');
  const [progressMap, setProgressMap] = useState<Record<string, { total_cards: number; mastered_cards: number; progress_percentage: number }>>({});

  useEffect(() => {
    loadModuleSets();
  }, [classId, moduleId]);

  // Reload progress when user returns from study page
  useEffect(() => {
    const handleFocus = () => {
      if (sets.length > 0 && user) {
        loadProgressForSets(sets);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [sets, user]);

  const loadProgressForSets = async (setsList: ModuleSet[]) => {
    if (!user || setsList.length === 0) {
      console.log('[ClassModulePage] Skipping progress load:', { hasUser: !!user, setsCount: setsList.length });
      return;
    }

    console.log('[ClassModulePage] Loading progress for', setsList.length, 'sets');
    const progressPromises = setsList.map(async (set: ModuleSet) => {
      try {
        console.log('[ClassModulePage] Loading progress for set:', set.set_id);
        const progress = await setsService.getProgress(set.set_id);
        console.log('[ClassModulePage] Progress loaded:', { setId: set.set_id, progress });
        return { setId: set.set_id, progress };
      } catch (error) {
        console.error(`[ClassModulePage] Failed to load progress for set ${set.set_id}:`, error);
        return { setId: set.set_id, progress: { total_cards: 0, mastered_cards: 0, progress_percentage: 0 } };
      }
    });

    const progressResults = await Promise.all(progressPromises);
    console.log('[ClassModulePage] All progress loaded:', progressResults);
    const newProgressMap: Record<string, { total_cards: number; mastered_cards: number; progress_percentage: number }> = {};
    progressResults.forEach(({ setId, progress }) => {
      newProgressMap[setId] = progress;
    });
    console.log('[ClassModulePage] Setting progress map:', newProgressMap);
    setProgressMap(newProgressMap);
  };

  const loadModuleSets = async () => {
    try {
      setIsLoading(true);
      const [setsData, modulesData] = await Promise.all([
        classModulesService.getClassModuleSets(classId, moduleId),
        classModulesService.getClassModules(classId),
      ]);
      
      setSets(setsData || []);
      
      // Find module name from modules list
      const module = (modulesData || []).find((m: any) => m.module_id === moduleId);
      if (module) {
        setModuleName(module.module_name || 'Module');
      }

      // Load progress for each set (after sets are loaded)
      if (setsData && setsData.length > 0 && user) {
        loadProgressForSets(setsData);
      }
    } catch (error) {
      console.error('Failed to load module sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-[14px] text-content-muted hover:text-content-emphasis"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mes classes
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle">
            <Folder className="h-6 w-6 text-content-muted" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Module</p>
            <h1 className="text-[24px] font-semibold text-content-emphasis sm:text-[28px]">
              {moduleName || 'Chargement...'}
            </h1>
            <p className="text-[14px] text-content-muted">
              {sets.length} cardz disponible{sets.length > 1 ? 's' : ''}
            </p>
            {sets.length > 0 && sets[0].module_shared_at && (
              <div className="flex items-center gap-1.5 mt-1 text-[12px] text-content-subtle">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Ajouté le {new Date(sets[0].module_shared_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sets List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-content-muted">Chargement des cardz...</p>
        </div>
      ) : sets.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <BookOpen className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">
            Aucun cardz dans ce module
          </h3>
          <p className="text-[15px] text-content-muted">
            Votre professeur n'a pas encore ajouté de contenu.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Card key={set.set_id} className="p-5 hover:shadow-card-hover transition-all">
              <div className="space-y-3">
                <div>
                  <h3 className="text-[16px] font-semibold text-content-emphasis mb-2 line-clamp-2">
                    {set.set_title}
                  </h3>
                  {set.set_description && (
                    <p className="text-[13px] text-content-muted line-clamp-2 mb-3">
                      {set.set_description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[12px] text-content-muted">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{set.flashcard_count} carte{set.flashcard_count > 1 ? 's' : ''}</span>
                  </div>
                  {set.set_language && (
                    <div className="px-2 py-0.5 rounded-full bg-bg-subtle">
                      {set.set_language}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {progressMap[set.set_id] && progressMap[set.set_id].total_cards > 0 ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-content-subtle">Progression</span>
                      <span className={`text-[11px] font-medium ${
                        progressMap[set.set_id].progress_percentage === 100
                          ? 'text-green-600'
                          : 'text-content-emphasis'
                      }`}>
                        {progressMap[set.set_id].progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progressMap[set.set_id].progress_percentage === 100
                            ? 'bg-green-500'
                            : 'bg-brand-primary'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, progressMap[set.set_id].progress_percentage))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary"
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border-subtle">
                  <Link href={`/study/${set.set_id}`}>
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Étudier
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

