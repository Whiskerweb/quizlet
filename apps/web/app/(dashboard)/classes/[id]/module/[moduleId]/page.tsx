'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { classModulesService } from '@/lib/supabase/class-modules';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ArrowLeft, 
  Folder, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface ModuleSet {
  set_id: string;
  set_title: string;
  set_description: string | null;
  set_language: string | null;
  flashcard_count: number;
  created_at: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  order: number;
}

interface SetWithFlashcards extends ModuleSet {
  flashcards: Flashcard[];
}

export default function ClassModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  const classId = params.id as string;
  const moduleId = params.moduleId as string;

  const [moduleName, setModuleName] = useState('');
  const [moduleColor, setModuleColor] = useState('#3b82f6');
  const [sets, setSets] = useState<SetWithFlashcards[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [visibleFlashcards, setVisibleFlashcards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.role !== 'teacher') {
      router.push('/home');
      return;
    }
    if (classId && moduleId) {
      loadModuleData();
    }
  }, [classId, moduleId, profile]);

  const loadModuleData = async () => {
    try {
      setIsLoading(true);

      // Load module info and sets
      const setsData = await classModulesService.getClassModuleSets(classId, moduleId);
      
      // Get module name from folders table
      const { data: folderData } = await supabaseBrowser
        .from('folders')
        .select('name, color')
        .eq('id', moduleId)
        .single();

      if (folderData && folderData.name) {
        setModuleName(folderData.name);
        setModuleColor((folderData.color as string) || '#3b82f6');
      }

      // Load flashcards for each set
      const setsWithFlashcards: SetWithFlashcards[] = await Promise.all(
        (setsData || []).map(async (set: ModuleSet) => {
          const { data: flashcards } = await supabaseBrowser
            .from('flashcards')
            .select('id, front, back, order')
            .eq('set_id', set.set_id)
            .order('order', { ascending: true });

          return {
            ...set,
            flashcards: (flashcards || []) as Flashcard[],
          };
        })
      );

      setSets(setsWithFlashcards);
      
      // Expand all sets by default
      const allSetIds = new Set<string>(setsWithFlashcards.map(s => s.set_id));
      setExpandedSets(allSetIds);
    } catch (error) {
      console.error('Failed to load module data:', error);
      console.error('Error details:', error);
      // Don't redirect on error, show error message instead
      alert(`Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetExpansion = (setId: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
      // Also hide all flashcards when collapsing
      const newVisible = new Set(visibleFlashcards);
      sets.find(s => s.set_id === setId)?.flashcards.forEach(fc => {
        newVisible.delete(fc.id);
      });
      setVisibleFlashcards(newVisible);
    } else {
      newExpanded.add(setId);
    }
    setExpandedSets(newExpanded);
  };

  const toggleFlashcardVisibility = (flashcardId: string) => {
    const newVisible = new Set(visibleFlashcards);
    if (newVisible.has(flashcardId)) {
      newVisible.delete(flashcardId);
    } else {
      newVisible.add(flashcardId);
    }
    setVisibleFlashcards(newVisible);
  };

  const toggleAllFlashcards = (setId: string) => {
    const set = sets.find(s => s.set_id === setId);
    if (!set) return;

    const allVisible = set.flashcards.every(fc => visibleFlashcards.has(fc.id));
    const newVisible = new Set(visibleFlashcards);

    set.flashcards.forEach(fc => {
      if (allVisible) {
        newVisible.delete(fc.id);
      } else {
        newVisible.add(fc.id);
      }
    });

    setVisibleFlashcards(newVisible);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  const totalFlashcards = sets.reduce((sum, set) => sum + set.flashcards.length, 0);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/classes/${classId}`)}
          className="mb-4 flex items-center gap-2 text-[14px] text-content-muted hover:text-content-emphasis transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la classe
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: moduleColor + '20' }}
          >
            <Folder className="h-6 w-6" style={{ color: moduleColor }} />
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-content-emphasis">
              {moduleName || 'Module'}
            </h1>
            <p className="text-[14px] text-content-muted">
              {sets.length} cardz • {totalFlashcards} questions/réponses
            </p>
          </div>
        </div>
      </div>

      {/* Sets List */}
      {sets.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="h-12 w-12 text-content-subtle mx-auto mb-3" />
          <h3 className="text-[18px] font-semibold text-content-emphasis mb-2">
            Aucun cardz dans ce module
          </h3>
          <p className="text-[15px] text-content-muted">
            Ce module ne contient pas encore de cardz.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sets.map((set) => {
            const isExpanded = expandedSets.has(set.set_id);
            const allVisible = set.flashcards.length > 0 && set.flashcards.every(fc => visibleFlashcards.has(fc.id));

            return (
              <Card key={set.set_id} className="p-5">
                {/* Set Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[18px] font-semibold text-content-emphasis">
                        {set.set_title || 'Sans titre'}
                      </h3>
                      {set.set_language && (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-bg-subtle text-content-muted">
                          {set.set_language}
                        </span>
                      )}
                    </div>
                    {set.set_description && (
                      <p className="text-[14px] text-content-muted mb-2">
                        {set.set_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-[13px] text-content-subtle">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {set.flashcard_count} question{set.flashcard_count > 1 ? 's' : ''}
                      </span>
                      <span>• Créé le {new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {set.flashcards.length > 0 && (
                      <button
                        onClick={() => toggleAllFlashcards(set.set_id)}
                        className="px-3 py-1.5 text-[13px] text-brand-primary hover:bg-blue-50 rounded-lg transition"
                        title={allVisible ? 'Masquer toutes les réponses' : 'Afficher toutes les réponses'}
                      >
                        {allVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => toggleSetExpansion(set.set_id)}
                      className="p-2 hover:bg-bg-subtle rounded-lg transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-content-muted" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-content-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Flashcards List */}
                {isExpanded && (
                  <div className="pt-4 border-t border-border-subtle space-y-3">
                    {set.flashcards.length === 0 ? (
                      <p className="text-[14px] text-content-muted text-center py-4">
                        Aucune question dans ce cardz
                      </p>
                    ) : (
                      set.flashcards.map((flashcard, index) => {
                        const isVisible = visibleFlashcards.has(flashcard.id);
                        return (
                          <div
                            key={flashcard.id}
                            className="p-4 rounded-lg border border-border-subtle bg-bg-subtle/50"
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <span className="flex-shrink-0 text-[12px] font-medium text-content-subtle">
                                #{index + 1}
                              </span>
                              <button
                                onClick={() => toggleFlashcardVisibility(flashcard.id)}
                                className="flex-shrink-0 p-1 hover:bg-white rounded transition"
                                title={isVisible ? 'Masquer la réponse' : 'Afficher la réponse'}
                              >
                                {isVisible ? (
                                  <EyeOff className="h-4 w-4 text-content-muted" />
                                ) : (
                                  <Eye className="h-4 w-4 text-content-muted" />
                                )}
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-wider text-content-subtle mb-1">
                                  Question
                                </p>
                                <p className="text-[15px] text-content-emphasis whitespace-pre-wrap">
                                  {flashcard.front}
                                </p>
                              </div>
                              {isVisible && (
                                <div className="pt-3 border-t border-border-muted">
                                  <p className="text-[11px] uppercase tracking-wider text-content-subtle mb-1">
                                    Réponse
                                  </p>
                                  <p className="text-[15px] text-brand-primary font-medium whitespace-pre-wrap">
                                    {flashcard.back}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

