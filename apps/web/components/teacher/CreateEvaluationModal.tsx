'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { evaluationsService, ClassModuleFlashcard } from '@/lib/supabase/evaluations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  X, 
  Clock, 
  Shuffle, 
  FileText, 
  Zap, 
  BookOpen, 
  List,
  CheckCircle2,
  AlertCircle,
  Search,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CreateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
}

type EvaluationMode = 'quiz' | 'writing' | 'flashcard' | 'match';

export function CreateEvaluationModal({ isOpen, onClose, classId, onSuccess }: CreateEvaluationModalProps) {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<EvaluationMode>('quiz');
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number | undefined>(undefined);
  const [randomizeOrder, setRandomizeOrder] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);

  // Flashcards
  const [availableFlashcards, setAvailableFlashcards] = useState<ClassModuleFlashcard[]>([]);
  const [selectedFlashcardIds, setSelectedFlashcardIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFlashcards, setLoadingFlashcards] = useState(true);
  const [showFlashcardsSection, setShowFlashcardsSection] = useState(true);

  useEffect(() => {
    if (isOpen && classId) {
      loadFlashcards();
    }
  }, [isOpen, classId]);

  const loadFlashcards = async () => {
    try {
      setLoadingFlashcards(true);
      console.log('[CreateEvaluationModal] Loading flashcards for class:', classId);
      const flashcards = await evaluationsService.getClassModuleFlashcards(classId);
      console.log('[CreateEvaluationModal] Loaded flashcards:', flashcards.length, flashcards);
      setAvailableFlashcards(flashcards);
      if (flashcards.length === 0) {
        setError('Aucune flashcard disponible. Partagez d\'abord des modules à la classe.');
      }
    } catch (err) {
      console.error('[CreateEvaluationModal] Failed to load flashcards:', err);
      setError(`Impossible de charger les flashcards: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleToggleFlashcard = (flashcardId: string) => {
    const newSelected = new Set(selectedFlashcardIds);
    if (newSelected.has(flashcardId)) {
      newSelected.delete(flashcardId);
    } else {
      newSelected.add(flashcardId);
    }
    setSelectedFlashcardIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFlashcardIds.size === filteredFlashcards.length) {
      setSelectedFlashcardIds(new Set());
    } else {
      setSelectedFlashcardIds(new Set(filteredFlashcards.map(f => f.flashcard_id)));
    }
  };

  const filteredFlashcards = availableFlashcards.filter(f => {
    const query = searchQuery.toLowerCase();
    return (
      f.question.toLowerCase().includes(query) ||
      f.answer.toLowerCase().includes(query) ||
      f.module_name.toLowerCase().includes(query) ||
      f.set_title.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (selectedFlashcardIds.size === 0) {
      setError('Sélectionnez au moins une flashcard');
      return;
    }

    if (!profile?.id) {
      setError('Non authentifié');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[CreateEvaluationModal] Creating evaluation with flashcards:', Array.from(selectedFlashcardIds));

      const result = await evaluationsService.createEvaluation({
        class_id: classId,
        title: title.trim(),
        description: description.trim() || undefined,
        mode,
        duration_minutes: durationMinutes || undefined,
        question_time_limit: questionTimeLimit || undefined,
        randomize_order: randomizeOrder,
        flashcard_ids: Array.from(selectedFlashcardIds),
      }, profile.id);

      console.log('[CreateEvaluationModal] Evaluation created:', result);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[CreateEvaluationModal] Failed to create evaluation:', err);
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMode('quiz');
    setQuestionTimeLimit(undefined);
    setRandomizeOrder(false);
    setDurationMinutes(undefined);
    setSelectedFlashcardIds(new Set());
    setSearchQuery('');
    setError(null);
    setSuccess(false);
  };

  if (!isOpen) return null;

  const modeOptions: { value: EvaluationMode; label: string; icon: any; description: string; color: string }[] = [
    { value: 'quiz', label: 'Quiz', icon: FileText, description: 'Choix multiples', color: 'from-blue-500 to-cyan-500' },
    { value: 'writing', label: 'Writing', icon: Zap, description: 'Écrire la réponse', color: 'from-purple-500 to-pink-500' },
    { value: 'flashcard', label: 'Cardz', icon: BookOpen, description: 'Cartes flash', color: 'from-green-500 to-emerald-500' },
    { value: 'match', label: 'Match', icon: List, description: 'Associer les termes', color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl max-h-[95vh] rounded-2xl border border-border-subtle bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header avec gradient */}
        <div className="relative p-6 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-content-emphasis mb-1">
                Créer une évaluation
              </h2>
              <p className="text-sm text-content-muted">
                Configurez les paramètres et sélectionnez les questions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-subtle rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5 text-content-muted" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Messages d'erreur/succès */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Évaluation créée avec succès !</p>
                </div>
              </div>
            )}

            {/* Section 1: Informations de base */}
            <Card className="p-6 border-border-subtle">
              <h3 className="text-lg font-semibold text-content-emphasis mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-brand-primary" />
                Informations de base
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content-emphasis mb-2">
                    Titre de l'évaluation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-border-subtle rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                    placeholder="Ex: Évaluation Chapitre 1 - Histoire"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-content-emphasis mb-2">
                    Description
                    <span className="text-xs text-content-muted font-normal ml-2">(optionnel)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-border-subtle rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none transition-all"
                    placeholder="Description de l'évaluation, instructions spéciales..."
                    disabled={loading}
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Type de jeu */}
            <Card className="p-6 border-border-subtle">
              <h3 className="text-lg font-semibold text-content-emphasis mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                Type de jeu <span className="text-red-500">*</span>
              </h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {modeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setMode(option.value)}
                      disabled={loading}
                      className={`
                        relative p-5 rounded-xl border-2 transition-all text-left group
                        ${isSelected 
                          ? 'border-brand-primary bg-gradient-to-br ' + option.color + ' text-white shadow-lg scale-105' 
                          : 'border-border-subtle hover:border-brand-primary/50 hover:bg-bg-subtle bg-white'
                        }
                      `}
                    >
                      <Icon className={`h-6 w-6 mb-3 ${isSelected ? 'text-white' : 'text-brand-primary'}`} />
                      <p className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-content-emphasis'}`}>
                        {option.label}
                      </p>
                      <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-content-muted'}`}>
                        {option.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Section 3: Paramètres */}
            <Card className="p-6 border-border-subtle">
              <h3 className="text-lg font-semibold text-content-emphasis mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-primary" />
                Paramètres temporels
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-content-emphasis mb-2">
                    Durée max par question
                    <span className="text-xs text-content-muted font-normal ml-2">(secondes)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={questionTimeLimit || ''}
                      onChange={(e) => setQuestionTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                      min={1}
                      className="w-full px-4 py-3 border border-border-subtle rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                      placeholder="Pas de limite"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-content-emphasis mb-2">
                    Durée totale
                    <span className="text-xs text-content-muted font-normal ml-2">(minutes, optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={durationMinutes || ''}
                      onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                      min={1}
                      className="w-full px-4 py-3 border border-border-subtle rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                      placeholder="Indéfinie"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Option randomize */}
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={randomizeOrder}
                    onChange={(e) => setRandomizeOrder(e.target.checked)}
                    className="h-5 w-5 text-brand-primary rounded border-border-subtle focus:ring-brand-primary cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Shuffle className="h-4 w-4 text-content-muted group-hover:text-brand-primary transition-colors" />
                    <span className="text-sm font-medium text-content-emphasis">
                      Ordonner les questions aléatoirement
                    </span>
                  </div>
                </label>
              </div>
            </Card>

            {/* Section 4: Sélection des flashcards */}
            <Card className="p-6 border-border-subtle">
              <button
                onClick={() => setShowFlashcardsSection(!showFlashcardsSection)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-semibold text-content-emphasis flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand-primary" />
                  Sélectionner les questions <span className="text-red-500">*</span>
                  {selectedFlashcardIds.size > 0 && (
                    <span className="ml-2 px-3 py-0.5 bg-brand-primary text-white text-xs font-medium rounded-full">
                      {selectedFlashcardIds.size}
                    </span>
                  )}
                </h3>
                {showFlashcardsSection ? (
                  <ChevronUp className="h-5 w-5 text-content-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-content-muted" />
                )}
              </button>

              {showFlashcardsSection && (
                <div className="space-y-4">
                  {/* Search et select all */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une question..."
                        className="w-full pl-10 pr-4 py-2.5 border border-border-subtle rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={loading || filteredFlashcards.length === 0}
                      className="whitespace-nowrap"
                    >
                      {selectedFlashcardIds.size === filteredFlashcards.length && filteredFlashcards.length > 0
                        ? 'Tout désélectionner' 
                        : 'Tout sélectionner'}
                    </Button>
                  </div>

                  {/* Flashcards list */}
                  {loadingFlashcards ? (
                    <div className="py-12 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto mb-3" />
                      <p className="text-sm text-content-muted">Chargement des questions...</p>
                    </div>
                  ) : filteredFlashcards.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-border-subtle rounded-xl bg-bg-subtle/50">
                      <FileText className="h-12 w-12 text-content-subtle mx-auto mb-3" />
                      <p className="text-sm font-medium text-content-emphasis mb-1">
                        {availableFlashcards.length === 0 
                          ? 'Aucune question disponible'
                          : 'Aucune question trouvée'
                        }
                      </p>
                      <p className="text-xs text-content-muted">
                        {availableFlashcards.length === 0 
                          ? 'Partagez d\'abord des modules à la classe pour créer une évaluation.'
                          : 'Essayez une autre recherche.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 -mr-2">
                      {filteredFlashcards.map((flashcard) => {
                        const isSelected = selectedFlashcardIds.has(flashcard.flashcard_id);
                        return (
                          <button
                            key={flashcard.flashcard_id}
                            onClick={() => handleToggleFlashcard(flashcard.flashcard_id)}
                            disabled={loading}
                            className={`
                              w-full p-4 rounded-xl border-2 transition-all text-left group
                              ${isSelected 
                                ? 'border-brand-primary bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 shadow-md' 
                                : 'border-border-subtle hover:border-brand-primary/50 hover:bg-bg-subtle bg-white'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: flashcard.module_color }}
                                  />
                                  <span className="text-xs font-medium text-content-muted truncate">
                                    {flashcard.module_name} • {flashcard.set_title}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-content-emphasis mb-1.5 line-clamp-2">
                                  {flashcard.question}
                                </p>
                                <p className="text-xs text-content-muted line-clamp-1">
                                  {flashcard.answer}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-bg-subtle/50 flex-shrink-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
            disabled={loading || !title.trim() || selectedFlashcardIds.size === 0}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Création...
              </>
            ) : success ? (
              'Créée !'
            ) : (
              `Créer l'évaluation${selectedFlashcardIds.size > 0 ? ` (${selectedFlashcardIds.size} questions)` : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
