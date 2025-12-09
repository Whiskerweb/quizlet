'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { evaluationsService, type Evaluation as EvaluationType } from '@/lib/supabase/evaluations';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { ArrowLeft } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { EvaluationQuizMode } from '../components/EvaluationQuizMode';

interface EvaluationFlashcard {
  id: string;
  flashcard_id: string;
  display_order: number;
  flashcard: {
    id: string;
    front: string;
    back: string;
  };
}

interface FlashcardForMode {
  id: string;
  front: string;
  back: string;
}

// Composant wrapper pour le mode writing dans les évaluations
function EvaluationWritingMode({ 
  flashcard, 
  onAnswer, 
  onNext, 
  currentIndex, 
  totalQuestions, 
  isSubmitting 
}: { 
  flashcard: FlashcardForMode; 
  onAnswer: (answerText: string, timeSpent: number) => void;
  onNext: () => void;
  currentIndex: number;
  totalQuestions: number;
  isSubmitting: boolean;
}) {
  const [answer, setAnswer] = useState('');
  const startTimeRef = useRef(Date.now());

  return (
    <div>
      <div className="mb-6">
        <label className="text-sm font-medium text-content-subtle mb-2 block">
          Question
        </label>
        <div className="text-2xl font-bold text-content-emphasis">
          <FormattedText text={flashcard.front} />
        </div>
      </div>
      <div className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Tapez votre réponse..."
          className="w-full min-h-[150px] p-4 border border-border-subtle rounded-lg text-content-emphasis bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary"
          autoFocus
        />
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setAnswer('');
              startTimeRef.current = Date.now();
            }}
            disabled={!answer.trim()}
          >
            Effacer
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (answer.trim()) {
                const timeSpent = Date.now() - startTimeRef.current;
                onAnswer(answer.trim(), timeSpent);
                setAnswer('');
                startTimeRef.current = Date.now();
                onNext();
              }
            }}
            disabled={!answer.trim() || isSubmitting}
          >
            {currentIndex < totalQuestions - 1 ? 'Question suivante' : 'Terminer l\'évaluation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EvaluationStudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const evaluationId = params.id as string;
  const sessionId = searchParams.get('session');

  const [evaluation, setEvaluation] = useState<EvaluationType | null>(null);
  const [flashcards, setFlashcards] = useState<EvaluationFlashcard[]>([]);
  const [flashcardsForMode, setFlashcardsForMode] = useState<FlashcardForMode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { is_correct?: boolean; answer_text?: string; time_spent: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEvaluation();
  }, [evaluationId]);

  useEffect(() => {
    // Transformer les flashcards pour les composants de mode
    if (flashcards.length > 0) {
      const transformed = flashcards
        .filter(ef => ef.flashcard && ef.flashcard.front && ef.flashcard.back) // Filtrer les flashcards null
        .map(ef => ({
          id: ef.flashcard_id,
          front: ef.flashcard!.front,
          back: ef.flashcard!.back,
        }));
      setFlashcardsForMode(transformed);
      
      // Si on a filtré des flashcards, mettre à jour la liste
      if (transformed.length !== flashcards.length) {
        console.warn(`[Evaluation] ${flashcards.length - transformed.length} flashcards invalides filtrées`);
        setFlashcards(flashcards.filter(ef => ef.flashcard && ef.flashcard.front && ef.flashcard.back) as EvaluationFlashcard[]);
      }
    }
  }, [flashcards]);

  const loadEvaluation = async () => {
    try {
      setIsLoading(true);
      
      // Charger l'évaluation
      const evalData = await evaluationsService.getEvaluation(evaluationId) as EvaluationType;
      console.log('[EvaluationStudy] Evaluation loaded:', evalData);
      setEvaluation(evalData);

      // Vérifier que l'évaluation est active
      if (!evalData.is_active || evalData.is_closed) {
        alert('Cette évaluation n\'est pas active');
        router.push(`/my-class/${evalData.class_id}`);
        return;
      }

      // Charger les flashcards
      const flashcardsData = await evaluationsService.getEvaluationFlashcards(evaluationId);
      console.log('[EvaluationStudy] Flashcards data received:', flashcardsData);
      
      if (!flashcardsData || flashcardsData.length === 0) {
        console.error('[EvaluationStudy] No flashcards found for evaluation');
        alert('Aucune question dans cette évaluation');
        router.push(`/my-class/${evalData.class_id}`);
        return;
      }

      // Filtrer les flashcards valides
      const validFlashcards = flashcardsData.filter((ef: any) => ef.flashcard && ef.flashcard.front && ef.flashcard.back);
      console.log('[EvaluationStudy] Valid flashcards:', validFlashcards.length);
      
      if (validFlashcards.length === 0) {
        console.error('[EvaluationStudy] No valid flashcards after filtering');
        alert('Aucune question valide dans cette évaluation');
        router.push(`/my-class/${evalData.class_id}`);
        return;
      }
      
      // Trier selon randomize_order
      let sortedFlashcards = [...validFlashcards];
      if (evalData.randomize_order) {
        sortedFlashcards = sortedFlashcards.sort(() => Math.random() - 0.5);
      } else {
        sortedFlashcards = sortedFlashcards.sort((a: any, b: any) => a.display_order - b.display_order);
      }

      console.log('[EvaluationStudy] Final flashcards to set:', sortedFlashcards.length);
      setFlashcards(sortedFlashcards as EvaluationFlashcard[]);
    } catch (error: any) {
      console.error('[EvaluationStudy] Failed to load evaluation:', error);
      alert(error?.message || 'Impossible de charger l\'évaluation');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean, timeSpent: number, answerText?: string) => {
    if (!flashcards[currentIndex]) return;

    const flashcard = flashcards[currentIndex];
    const flashcardId = flashcard.flashcard_id;

    // Sauvegarder la réponse dans l'état
    setAnswers(prev => ({
      ...prev,
      [flashcardId]: {
        is_correct: isCorrect,
        answer_text: answerText,
        time_spent: Math.floor(timeSpent / 1000), // Convertir en secondes
      },
    }));

      // Sauvegarder immédiatement dans la base de données
      if (user?.id) {
        try {
          const { error } = await supabaseBrowser
            .from('evaluation_answers')
            .upsert({
              evaluation_id: evaluationId,
              student_id: user.id,
              flashcard_id: flashcardId,
              is_correct: isCorrect,
              answer_text: answerText || null,
              time_spent: Math.floor(timeSpent / 1000),
              points: isCorrect ? 1 : 0,
            } as any, {
              onConflict: 'evaluation_id,student_id,flashcard_id'
            });
          if (error) throw error;
        } catch (error) {
          console.error('Failed to save answer:', error);
        }
      }

    // Passer à la question suivante après un court délai (sauf pour Writing)
    if (evaluation?.mode !== 'writing') {
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !sessionId) {
      alert('Session invalide');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculer le score
      const correctCount = Object.values(answers).filter(a => a.is_correct).length;
      const totalQuestions = flashcards.length;
      const finalScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      // Mettre à jour la session
      const { error: sessionError } = await supabaseBrowser
        .from('evaluation_sessions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          correct_answers: correctCount,
          total_questions: totalQuestions,
          final_score: finalScore,
          total_points: correctCount,
        } as any)
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Failed to update session:', sessionError);
        throw sessionError;
      }

      // Rediriger vers la classe avec un message de succès
      router.push(`/my-class/${evaluation.class_id}?evaluation_completed=${evaluationId}`);
    } catch (error: any) {
      console.error('Failed to submit evaluation:', error);
      alert(error?.message || 'Erreur lors de la soumission de l\'évaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!evaluation || flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-content-muted">Aucune question dans cette évaluation</p>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcardsForMode[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  if (!currentFlashcard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-content-muted">Chargement de la question...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/my-class/${evaluation.class_id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la classe
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-content-emphasis">{evaluation.title}</h1>
            {evaluation.description && (
              <p className="text-content-muted mt-1">{evaluation.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-content-muted">
              Question {currentIndex + 1} sur {flashcards.length}
            </p>
            <div className="w-32 h-2 bg-bg-subtle rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Card avec le mode approprié */}
      <Card className="p-8 mb-6">
        {evaluation.mode === 'quiz' && (
          <EvaluationQuizMode
            flashcard={currentFlashcard}
            allFlashcards={flashcardsForMode}
            onAnswer={handleAnswer}
            questionTimeLimit={evaluation.question_time_limit || undefined}
          />
        )}

        {evaluation.mode === 'flashcard' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-content-subtle mb-2 block">
                Question
              </label>
              <div className="text-2xl font-bold text-content-emphasis">
                <FormattedText text={currentFlashcard.front} />
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleAnswer(true, Date.now())}
                className="flex-1"
              >
                Je connaissais
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAnswer(false, Date.now())}
                className="flex-1"
              >
                Je ne connaissais pas
              </Button>
            </div>
          </div>
        )}

        {evaluation.mode === 'writing' && (
          <EvaluationWritingMode
            flashcard={currentFlashcard}
            onAnswer={(answerText, timeSpent) => {
              handleAnswer(false, timeSpent, answerText);
            }}
            onNext={handleNext}
            currentIndex={currentIndex}
            totalQuestions={flashcards.length}
            isSubmitting={isSubmitting}
          />
        )}

        {evaluation.mode === 'match' && (
          <div className="space-y-6">
            <p className="text-content-muted">
              Mode match non disponible pour les évaluations individuelles. Veuillez utiliser le mode quiz ou flashcard.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
