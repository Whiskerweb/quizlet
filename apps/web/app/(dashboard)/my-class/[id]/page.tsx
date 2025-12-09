'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { classesService } from '@/lib/supabase/classes';
import { classModulesService } from '@/lib/supabase/class-modules';
import { evaluationsService } from '@/lib/supabase/evaluations';
import { setsService } from '@/lib/supabase/sets';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeft,
  Folder,
  Target,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  XCircle,
  Play,
  ChevronRight,
  Activity,
  BarChart3,
  Zap,
  Flame,
  Sparkles,
  ArrowUpRight,
  Circle,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_code: string;
  color: string;
  teacher_id: string;
}

interface ClassModule {
  module_id: string;
  module_name: string;
  module_color: string;
  sets_count: number;
  shared_at?: string;
}

interface Evaluation {
  id: string;
  title: string;
  description?: string;
  mode: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  studentSession?: {
    id: string;
    is_completed: boolean;
    final_score?: number;
    correct_answers: number;
    total_questions: number;
    completed_at?: string;
  } | null;
}


interface WeakFlashcard {
  flashcard_id: string;
  front: string;
  back: string;
  error_count: number;
  set_title: string;
  module_name: string;
}

interface ModuleProgress {
  module_id: string;
  completed_sets: number;
  total_sets: number;
  mastered_cards: number;
  total_cards: number;
  progress_percentage: number;
}

export default function StudentClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuthStore();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [modules, setModules] = useState<ClassModule[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [weakFlashcards, setWeakFlashcards] = useState<WeakFlashcard[]>([]);
  const [modulesProgress, setModulesProgress] = useState<Record<string, ModuleProgress>>({});
  const [overallStats, setOverallStats] = useState({ completedModules: 0, masteredCards: 0, totalCards: 0 });
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const lastClassIdRef = useRef<string | null>(null);

  const loadClassData = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[StudentClassDetail] Already loading, skipping...');
      return;
    }
    
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      console.log('[StudentClassDetail] Starting loadClassData for classId:', classId);
      
      const studentClasses = await classesService.getStudentClasses(user.id);
      const classInfo = (studentClasses as any[]).find((cls: any) => cls.class_id === classId);
      
      if (!classInfo) {
        throw new Error('Classe introuvable ou vous n\'êtes pas membre de cette classe');
      }

      const classData: ClassData = {
        id: classInfo.class_id,
        name: classInfo.class_name,
        description: classInfo.class_description || '',
        class_code: classInfo.class_code || '',
        color: classInfo.class_color || '#3b82f6',
        teacher_id: '',
      };
      
      setClassData(classData);

      const [modulesData, evaluationsData] = await Promise.all([
        classModulesService.getClassModules(classId),
        evaluationsService.getClassEvaluations(classId),
      ]);

      const modulesList = modulesData as any;
      setModules(modulesList);
      
      // Charger les sessions d'évaluation pour chaque évaluation
      const evaluationsWithSessions = await Promise.all(
        (evaluationsData || []).map(async (evaluation: any) => {
          try {
            const session = await evaluationsService.getStudentEvaluationSession(evaluation.id, user.id);
            return {
              ...evaluation,
              studentSession: session,
            };
          } catch (error) {
            console.error(`[StudentClassDetail] Failed to load session for evaluation ${evaluation.id}:`, error);
            return {
              ...evaluation,
              studentSession: null,
            };
          }
        })
      );
      
      setEvaluations(evaluationsWithSessions);

      if (modulesList.length > 0) {
        await Promise.all([
          loadWeakFlashcards(modulesList),
          loadModulesProgress(modulesList),
        ]);
      }
    } catch (error) {
      console.error('[StudentClassDetail] Failed to load class data:', error);
      alert(`Erreur: ${(error as any).message || 'Impossible de charger la classe'}`);
      router.push('/my-class');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      lastClassIdRef.current = classId; // Mark as loaded
    }
  }, [classId, user?.id, router]);

  // Main effect - load data when component mounts or classId/user changes
  useEffect(() => {
    if (!user) {
      router.push('/home');
      return;
    }
    
    const userRole = (profile as any)?.role;
    if (userRole && userRole !== 'student') {
      router.push('/home');
      return;
    }
    
    // Only load if classId changed or not loaded yet, and not currently loading
    if (userRole === 'student' && lastClassIdRef.current !== classId && !isLoadingRef.current) {
      console.log('[StudentClassDetail] useEffect: Triggering initial load for classId:', classId);
      loadClassData();
    }
    
    // Recharger les données si on revient après avoir complété une évaluation
    const evaluationCompleted = searchParams.get('evaluation_completed');
    if (evaluationCompleted && userRole === 'student' && !isLoadingRef.current) {
      setTimeout(() => {
        console.log('[StudentClassDetail] Evaluation completed, forcing reload...');
        lastClassIdRef.current = null; // Force reload
        loadClassData();
        router.replace(`/my-class/${classId}`);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, user?.id, (profile as any)?.role, searchParams]);

  const loadModulesProgress = useCallback(async (modulesList: ClassModule[]) => {
    if (!user?.id) {
      console.warn('[loadModulesProgress] No user ID');
      return;
    }

    if (!classId) {
      console.warn('[loadModulesProgress] No classId');
      return;
    }

    console.log('[loadModulesProgress] Starting with modules:', modulesList.length, modulesList, 'classId:', classId);

    try {
      const progressMap: Record<string, ModuleProgress> = {};
      let totalMasteredCards = 0;
      let totalCards = 0;
      let completedModules = 0;

      for (const module of modulesList) {
        console.log(`[loadModulesProgress] Processing module:`, {
          module_id: (module as any).module_id,
          module_name: (module as any).module_name,
        });
        
        // Get sets in this module - use RPC to bypass RLS
        let setsData: any[] = [];
        try {
          // Use class_modules service which uses RPC with SECURITY DEFINER
          const moduleSets = await classModulesService.getClassModuleSets(classId, (module as any).module_id);
          console.log(`[loadModulesProgress] getClassModuleSets response for module ${(module as any).module_id}:`, moduleSets);
          
          if (moduleSets && Array.isArray(moduleSets) && moduleSets.length > 0) {
            setsData = moduleSets.map((s: any) => ({ id: s.set_id || s.id }));
            console.log(`[loadModulesProgress] ✅ Extracted ${setsData.length} sets from RPC response`);
          } else {
            console.warn(`[loadModulesProgress] ⚠️ RPC returned empty array or invalid data`);
          }
        } catch (error) {
          console.error(`[loadModulesProgress] ❌ Failed to get sets via classModulesService:`, error);
          // Don't fallback to direct query as it will likely fail due to RLS
          setsData = [];
        }

        console.log(`[loadModulesProgress] Sets query for module ${(module as any).module_id}:`, {
          setsCount: setsData.length,
          setsData: setsData.map((s: any) => s.id),
        });

        if (!setsData || setsData.length === 0) {
          console.warn(`[loadModulesProgress] ⚠️ No sets found for module ${(module as any).module_id}`);
          progressMap[module.module_id] = {
            module_id: module.module_id,
            completed_sets: 0,
            total_sets: 0,
            mastered_cards: 0,
            total_cards: 0,
            progress_percentage: 0,
          };
          continue;
        }

        let moduleMasteredCards = 0;
        let moduleTotalCards = 0;
        let moduleCompletedSets = 0;

        // Use get_set_progress for each set (uses SECURITY DEFINER, bypasses RLS)
        // This reliably gets total_cards and mastered_cards for each set
        console.log(`[loadModulesProgress] Processing ${setsData.length} sets for module ${(module as any).module_id}...`);
        
        for (const set of setsData) {
          try {
            const setId = (set as any).id;
            if (!setId) {
              console.warn(`[loadModulesProgress] ⚠️ Set has no id:`, set);
              continue;
            }

            console.log(`[loadModulesProgress] 🔍 Calling getProgress for set ${setId}...`);
            const progress = await setsService.getProgress(setId);
            console.log(`[loadModulesProgress] 📊 Set ${setId} progress RESPONSE:`, JSON.stringify(progress, null, 2));
            
            if (progress) {
              const total = Number(progress.total_cards) || 0;
              const mastered = Number(progress.mastered_cards) || 0;
              const percentage = Number(progress.progress_percentage) || 0;
              
              console.log(`[loadModulesProgress] 📈 Parsed values: total=${total}, mastered=${mastered}, percentage=${percentage}%`);
              
              if (total > 0) {
                moduleTotalCards += total;
                moduleMasteredCards += mastered;
                
                // Set is completed if 100% progress
                if (percentage === 100) {
                  moduleCompletedSets++;
                }
                
                console.log(`[loadModulesProgress] ✅ Set ${setId}: ${mastered}/${total} mastered (${percentage}%) - Module totals: ${moduleMasteredCards}/${moduleTotalCards}`);
              } else {
                console.warn(`[loadModulesProgress] ⚠️ Set ${setId}: total_cards is 0, skipping`);
              }
            } else {
              console.warn(`[loadModulesProgress] ⚠️ Set ${setId}: progress is null/undefined`);
            }
          } catch (error) {
            console.error(`[loadModulesProgress] ❌ ERROR for set ${(set as any).id}:`, error);
            // Continue with other sets even if one fails
          }
        }
        
        // Add to cumulative totals
        totalCards += moduleTotalCards;
        totalMasteredCards += moduleMasteredCards;
        
        console.log(`[loadModulesProgress] Module ${(module as any).module_id} summary:`, {
          setsCount: setsData.length,
          moduleTotalCards,
          moduleMasteredCards,
          cumulativeTotalCards: totalCards,
          cumulativeMasteredCards: totalMasteredCards,
        });

        const progressPercentage = moduleTotalCards > 0
          ? Math.round((moduleMasteredCards / moduleTotalCards) * 100)
          : 0;

        progressMap[(module as any).module_id] = {
          module_id: (module as any).module_id,
          completed_sets: moduleCompletedSets,
          total_sets: setsData.length,
          mastered_cards: moduleMasteredCards,
          total_cards: moduleTotalCards,
          progress_percentage: progressPercentage,
        };

        if (progressPercentage === 100 && setsData.length > 0 && moduleTotalCards > 0) {
          completedModules++;
        }
      }

      console.log('[loadModulesProgress] ✅ FINAL STATS:', {
        completedModules,
        masteredCards: totalMasteredCards,
        totalCards,
        modulesCount: modulesList.length,
      });
      console.log('[loadModulesProgress] ⚠️ EXPECTED: totalCards should be 6 (from SQL query)');
      console.log('[loadModulesProgress] ⚠️ ACTUAL: totalCards =', totalCards);
      
      if (totalCards === 0) {
        console.error('[loadModulesProgress] ❌ PROBLEM: totalCards is 0! This means get_set_progress is not returning total_cards correctly.');
      }
      
      setModulesProgress(progressMap);
      setOverallStats({
        completedModules,
        masteredCards: totalMasteredCards,
        totalCards,
      });
    } catch (error) {
      console.error('Failed to load modules progress:', error);
    }
  }, [classId, user?.id]);

  // Window focus effect - reload progress only (separate to avoid loops)
  useEffect(() => {
    if (modules.length === 0 || loading) return;

    const handleFocus = () => {
      if (!isLoadingRef.current && modules.length > 0) {
        console.log('[StudentClassDetail] Window focused, reloading progress only...');
        loadModulesProgress(modules);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [modules.length, loading, loadModulesProgress]);


  const loadWeakFlashcards = async (modulesList?: ClassModule[]) => {
    if (!user?.id || !classId) return;

    const currentModules = modulesList || modules;
    if (currentModules.length === 0) {
      setWeakFlashcards([]);
      return;
    }

    try {
      const { data, error } = await supabaseBrowser
        .rpc('get_student_weak_flashcards', {
          p_student_id: user.id,
          p_class_id: classId,
          p_limit: 5,
        } as any);

      if (error) {
        console.warn('RPC not available, querying manually');
        await loadWeakFlashcardsManual(currentModules);
        return;
      }

      setWeakFlashcards(data || []);
    } catch (error) {
      console.error('Failed to load weak flashcards:', error);
      await loadWeakFlashcardsManual(currentModules);
    }
  };

  const loadWeakFlashcardsManual = async (modulesList: ClassModule[]) => {
    if (!user?.id || !classId || modulesList.length === 0) return;

    try {
      const moduleIds = modulesList.map(m => m.module_id);
      const { data: setsData, error: setsError } = await supabaseBrowser
        .from('sets')
        .select('id, folder_id')
        .in('folder_id', moduleIds);

      if (setsError) throw setsError;

      const setIds = (setsData || []).map((s: any) => s.id);
      if (setIds.length === 0) {
        setWeakFlashcards([]);
        return;
      }

      const { data: sessionsData, error: sessionsError } = await supabaseBrowser
        .from('study_sessions')
        .select('id')
        .eq('user_id', user.id)
        .in('set_id', setIds);

      if (sessionsError) throw sessionsError;

      const sessionIds = (sessionsData || []).map((s: any) => s.id);
      if (sessionIds.length === 0) {
        setWeakFlashcards([]);
        return;
      }

      const { data: wrongAnswers, error } = await supabaseBrowser
        .from('answers')
        .select(`
          flashcard_id,
          flashcards:flashcard_id (
            id,
            front,
            back,
            set_id,
            sets:set_id (
              title,
              folder_id,
              folders:folder_id (
                id,
                name
              )
            )
          )
        `)
        .eq('is_correct', false)
        .in('session_id', sessionIds);

      if (error) throw error;

      const errorCounts: Record<string, { count: number; data: any }> = {};
      
      (wrongAnswers || []).forEach((answer: any) => {
        const flashcard = answer.flashcards;
        if (!flashcard) return;
        
        const moduleId = flashcard.sets?.folders?.id;
        if (!moduleId) return;

        const belongsToClass = modulesList.some((m: ClassModule) => m.module_id === moduleId);
        if (!belongsToClass) return;

        const id = flashcard.id;
        if (!errorCounts[id]) {
          errorCounts[id] = {
            count: 0,
            data: {
              flashcard_id: id,
              front: flashcard.front,
              back: flashcard.back,
              set_title: flashcard.sets?.title || 'Sans titre',
              module_name: flashcard.sets?.folders?.name || 'Sans module',
            },
          };
        }
        errorCounts[id].count++;
      });

      const weakCards = Object.values(errorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({
          ...item.data,
          error_count: item.count,
        }));

      setWeakFlashcards(weakCards);
    } catch (error) {
      console.error('Failed to load weak flashcards manually:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-default">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-[14px] text-content-muted">Chargement de la classe...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-default">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-content-subtle mx-auto mb-3" />
          <p className="text-[16px] font-medium text-content-emphasis mb-1">Classe introuvable</p>
          <p className="text-[14px] text-content-muted">Cette classe n'existe pas ou vous n'y avez pas accès.</p>
        </div>
      </div>
    );
  }

  const overallProgress = overallStats.totalCards > 0
    ? Math.round((overallStats.masteredCards / overallStats.totalCards) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg-default">
      {/* Hero Header with Gradient */}
      <div 
        className="relative overflow-hidden border-b border-border-subtle"
        style={{
          background: `linear-gradient(135deg, ${classData.color}08 0%, ${classData.color}03 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push('/my-class')}
            className="mb-6 flex items-center gap-2 text-[14px] font-medium text-content-muted hover:text-content-emphasis transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour aux classes
          </button>

          {/* Class Info */}
          <div className="mb-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="h-5 w-5 rounded-full flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: classData.color }}
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-[32px] sm:text-[40px] font-bold text-content-emphasis leading-tight mb-2">
                    {classData.name}
                  </h1>
                  {classData.description && (
                    <p className="text-[15px] text-content-muted max-w-3xl leading-relaxed">
                      {classData.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card className="p-6 bg-white/90 backdrop-blur-sm border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.1em] font-semibold text-content-subtle mb-2">
                        Progression globale
                      </p>
                      <p className="text-[32px] font-bold text-content-emphasis mb-2">
                        {overallProgress}%
                      </p>
                      <div className="w-full bg-bg-subtle rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${overallProgress}%`,
                            background: `linear-gradient(90deg, ${classData.color} 0%, ${classData.color}dd 100%)`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white/90 backdrop-blur-sm border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.1em] font-semibold text-content-subtle mb-2">
                        Modules
                      </p>
                      <p className="text-[32px] font-bold text-content-emphasis">
                        {modules.length}
                      </p>
                      <p className="text-[13px] text-content-muted mt-1">
                        {overallStats.completedModules} complété{overallStats.completedModules > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
                      <Layers className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white/90 backdrop-blur-sm border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.1em] font-semibold text-content-subtle mb-2">
                        Cardz maîtrisées
                      </p>
                      <p className="text-[32px] font-bold text-content-emphasis">
                        {overallStats.masteredCards}
                      </p>
                      <p className="text-[13px] text-content-muted mt-1">
                        sur {overallStats.totalCards} au total
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Modules Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-[24px] font-bold text-content-emphasis mb-2">
                  Modules de cours
                </h2>
                <p className="text-[14px] text-content-muted">
                  {modules.length} module{modules.length > 1 ? 's' : ''} disponible{modules.length > 1 ? 's' : ''} • Parcourez et étudiez les contenus partagés
                </p>
              </div>

              {modules.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-border-subtle bg-bg-subtle/50">
                  <Folder className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
                  <p className="text-[15px] font-medium text-content-emphasis mb-1">
                    Aucun module disponible
                  </p>
                  <p className="text-[13px] text-content-muted">
                    Votre professeur n'a pas encore partagé de modules
                  </p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {modules.map((module) => {
                    const progress = modulesProgress[module.module_id] || {
                      progress_percentage: 0,
                      completed_sets: 0,
                      total_sets: module.sets_count,
                      mastered_cards: 0,
                      total_cards: 0,
                    };
                    const isCompleted = progress.progress_percentage === 100;

                    return (
                      <Link
                        key={module.module_id}
                        href={`/class/${classId}/module/${module.module_id}`}
                      >
                        <Card className="p-6 border-2 border-border-subtle hover:border-brand-primary/30 hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm cursor-pointer group relative overflow-hidden">
                          {/* Background accent */}
                          <div 
                            className="absolute top-0 left-0 w-1 h-full opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: module.module_color || '#8b5cf6' }}
                          />
                          
                          <div className="relative">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: module.module_color || '#8b5cf6' }}
                                  />
                                  <h3 className="text-[18px] font-bold text-content-emphasis group-hover:text-brand-primary transition-colors">
                                    {module.module_name}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4 text-[13px] text-content-muted mb-3">
                                  <span className="flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4" />
                                    {module.sets_count} set{module.sets_count > 1 ? 's' : ''}
                                  </span>
                                  {module.shared_at && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-4 w-4" />
                                      {new Date(module.shared_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCompleted && (
                                <div className="flex-shrink-0">
                                  <div className="p-2 rounded-full bg-green-100 shadow-sm">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Progress Section */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[12px]">
                                <span className="font-medium text-content-subtle">Progression</span>
                                <span className="font-bold text-content-emphasis">{progress.progress_percentage}%</span>
                              </div>
                              <div className="w-full bg-bg-subtle rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                                  style={{
                                    width: `${progress.progress_percentage}%`,
                                    background: `linear-gradient(90deg, ${module.module_color || '#8b5cf6'} 0%, ${module.module_color || '#8b5cf6'}dd 100%)`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-content-muted pt-1">
                                <span>{progress.mastered_cards} cardz maîtrisée{progress.mastered_cards > 1 ? 's' : ''}</span>
                                <span>{progress.completed_sets}/{progress.total_sets} set{progress.total_sets > 1 ? 's' : ''} complété{progress.total_sets > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Evaluations Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-[24px] font-bold text-content-emphasis mb-2">
                  Évaluations
                </h2>
                <p className="text-[14px] text-content-muted">
                  {evaluations.filter(e => e.is_active && !e.is_closed).length} évaluation{evaluations.filter(e => e.is_active && !e.is_closed).length > 1 ? 's' : ''} active{evaluations.filter(e => e.is_active && !e.is_closed).length > 1 ? 's' : ''} • Testez vos connaissances
                </p>
              </div>

              {evaluations.filter(e => e.is_active && !e.is_closed).length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-border-subtle bg-bg-subtle/50">
                  <Target className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
                  <p className="text-[15px] font-medium text-content-emphasis mb-1">
                    Aucune évaluation active
                  </p>
                  <p className="text-[13px] text-content-muted">
                    Aucune évaluation n'est disponible pour le moment
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {evaluations
                    .filter((evaluation) => evaluation.is_active && !evaluation.is_closed)
                    .map((evaluation) => {
                      const isCompleted = evaluation.studentSession?.is_completed || false;
                      const finalScore = evaluation.studentSession?.final_score;
                      
                      return (
                        <Card
                          key={evaluation.id}
                          className={cn(
                            "p-5 border-l-4 transition-all",
                            isCompleted 
                              ? "border-green-500 bg-gradient-to-r from-green-50/50 to-emerald-50/30 opacity-90" 
                              : "border-border-subtle hover:shadow-card-hover bg-gradient-to-r from-orange-50/50 to-red-50/30"
                          )}
                          style={isCompleted ? { borderLeftColor: '#10b981' } : { borderLeftColor: '#f97316' }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-[17px] font-bold text-content-emphasis">
                                  {evaluation.title}
                                </h3>
                                {isCompleted ? (
                                  <span className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[11px] font-bold rounded-full uppercase tracking-[0.05em] shadow-sm flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Terminée
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-bold rounded-full uppercase tracking-[0.05em] shadow-sm">
                                    Active
                                  </span>
                                )}
                              </div>
                              {evaluation.description && (
                                <p className="text-[14px] text-content-muted mb-3 line-clamp-2">
                                  {evaluation.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-2 py-1 bg-white/60 rounded-lg font-medium capitalize text-[12px] text-content-subtle">
                                  {evaluation.mode}
                                </span>
                                {isCompleted && finalScore !== undefined && finalScore !== null && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg border border-green-200">
                                    <Award className="h-4 w-4 text-green-600" />
                                    <span className="text-[14px] font-bold text-green-700">
                                      {finalScore.toFixed(1)}%
                                    </span>
                                    <span className="text-[11px] text-content-muted">
                                      ({evaluation.studentSession?.correct_answers || 0}/{evaluation.studentSession?.total_questions || 0})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isCompleted ? (
                              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                <span className="text-[12px] text-content-muted text-right">
                                  Complétée
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Terminée
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="flex-shrink-0"
                                onClick={async () => {
                                  if (!user?.id) {
                                    alert('Vous devez être connecté');
                                    return;
                                  }
                                  try {
                                    const sessionId = await evaluationsService.startEvaluationSession(evaluation.id, user.id);
                                    // Rediriger vers la page d'étude avec l'évaluation
                                    router.push(`/evaluation/${evaluation.id}/study?session=${sessionId}`);
                                  } catch (error: any) {
                                    console.error('Failed to start evaluation:', error);
                                    alert(error?.message || 'Impossible de démarrer l\'évaluation');
                                  }
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Commencer
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Weak Flashcards */}
            {weakFlashcards.length > 0 && (
              <Card className="p-5 border-border-subtle bg-white">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-xl bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-content-emphasis">
                      À revoir
                    </h3>
                    <p className="text-[11px] text-content-subtle mt-0.5">
                      Vos difficultés
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {weakFlashcards.map((flashcard, idx) => (
                    <div
                      key={flashcard.flashcard_id}
                      className="p-3.5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-content-emphasis line-clamp-2 mb-1">
                            {flashcard.front}
                          </p>
                          <p className="text-[11px] text-content-subtle truncate">
                            {flashcard.set_title}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm">
                            {flashcard.error_count}
                          </div>
                        </div>
                      </div>
                      <p className="text-[12px] text-content-muted line-clamp-1">
                        {flashcard.back}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Stats Card */}
            <Card className="p-5 border-border-subtle bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-100/50">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Award className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-[16px] font-bold text-content-emphasis">
                  Performance
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[12px] text-content-muted mb-2">
                    <span>Modules complétés</span>
                    <span className="font-bold text-content-emphasis">
                      {overallStats.completedModules}/{modules.length}
                    </span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ 
                        width: `${modules.length > 0 ? (overallStats.completedModules / modules.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="pt-3 border-t border-white/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-content-muted">Cardz maîtrisées</span>
                    <span className="text-[18px] font-bold text-content-emphasis">
                      {overallStats.masteredCards}
                    </span>
                  </div>
                  {overallStats.totalCards > 0 && (
                    <p className="text-[11px] text-content-subtle mt-1">
                      sur {overallStats.totalCards} au total
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
