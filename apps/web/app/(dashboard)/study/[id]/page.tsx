'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { setsApi } from '@/lib/api/sets.api';
import { studyApi } from '@/lib/api/study.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, X } from 'lucide-react';
import { StudyModeSelector } from './components/StudyModeSelector';
import { QuizMode } from './components/QuizMode';
import { WritingMode } from './components/WritingMode';
import { MatchMode } from './components/MatchMode';
import { 
  initializeSession, 
  recordAnswer, 
  getNextCard, 
  moveToNext, 
  isSessionComplete,
  getProgress,
  type StudySessionState,
  type CardReview
} from '@/lib/utils/study-session';

type StudyMode = 'flashcard' | 'quiz' | 'writing' | 'match';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  imageUrl?: string;
  audioUrl?: string;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<StudySessionState | null>(null);
  const [currentCard, setCurrentCard] = useState<CardReview | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const set = await setsApi.getOne(setId);
      if (set.flashcards && Array.isArray(set.flashcards) && set.flashcards.length > 0) {
        const validFlashcards = set.flashcards.filter(
          card => card && typeof card.front === 'string' && typeof card.back === 'string'
        );
        if (validFlashcards.length > 0) {
          setFlashcards(validFlashcards);
          // Initialize session state
          const initialState = initializeSession(validFlashcards);
          setSessionState(initialState);
          const firstCard = getNextCard(initialState);
          setCurrentCard(firstCard);
        } else {
          setFlashcards([]);
        }
      } else {
        setFlashcards([]);
      }
    } catch (error) {
      console.error('Failed to load set:', error);
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const session = await studyApi.startSession({
        setId,
        mode,
      });
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleAnswer = async (isCorrect: boolean, timeSpent: number = 0) => {
    if (!sessionId || !sessionState || !currentCard) return;

    const flashcardId = currentCard.flashcardId;

    try {
      // Submit to backend
      await studyApi.submitAnswer(sessionId, {
        flashcardId,
        isCorrect,
        timeSpent,
      });

      // Update session state
      const updatedState = recordAnswer(sessionState, flashcardId, isCorrect);
      setSessionState(updatedState);

      // Check if session is complete
      if (isSessionComplete(updatedState)) {
        await completeSession();
        return;
      }

      // Move to next card
      const nextState = moveToNext(updatedState);
      setSessionState(nextState);
      
      // Get next card (will prioritize incorrect ones if needed)
      const nextCard = getNextCard(nextState);
      if (nextCard) {
        setCurrentCard(nextCard);
        setIsFlipped(false);
      } else {
        // All cards mastered - this should not happen if isSessionComplete check above works
        await completeSession();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleMatchComplete = async (correctCount: number, totalTime: number) => {
    if (!sessionId || !sessionState) return;

    // Mark all cards as correct for match mode
    let updatedState = sessionState;
    for (const card of flashcards) {
      updatedState = recordAnswer(updatedState, card.id, true);
      
      try {
        await studyApi.submitAnswer(sessionId, {
          flashcardId: card.id,
          isCorrect: true,
          timeSpent: totalTime / flashcards.length,
        });
      } catch (error) {
        console.error('Failed to submit match answer:', error);
      }
    }

    setSessionState(updatedState);
    setMatchCompleted(true);
    
    // Check if all mastered
    if (isSessionComplete(updatedState)) {
      setTimeout(() => {
        completeSession();
      }, 2000);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      await studyApi.completeSession(sessionId);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  useEffect(() => {
    if (flashcards.length > 0 && !sessionId) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcards, mode]);

  useEffect(() => {
    // Reset when mode changes
    if (sessionId && flashcards.length > 0 && sessionState) {
      // Reinitialize session state for new mode
      const initialState = initializeSession(flashcards);
      setSessionState(initialState);
      const firstCard = getNextCard(initialState);
      setCurrentCard(firstCard);
      setIsFlipped(false);
      setMatchCompleted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No flashcards in this set</p>
          <Button onClick={() => router.push(`/sets/${setId}`)}>
            Back to Set
          </Button>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    const progress = sessionState ? getProgress(sessionState) : { progress: 100, masteredCount: flashcards.length, totalCards: flashcards.length };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Study Complete! 🎉</h2>
          <p className="text-3xl font-bold text-primary-600 mb-2">100%</p>
          <p className="text-gray-600 mb-6">
            You mastered all {progress.totalCards} cards!
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => router.push(`/sets/${setId}`)}>
              Back to Set
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Study Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0 || !currentCard || !sessionState) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>No flashcards available</p>
      </div>
    );
  }

  const progress = getProgress(sessionState);

  // Match mode - show all flashcards at once
  if (mode === 'match') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudyModeSelector currentMode={mode} onModeChange={setMode} />
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Match all pairs
            </span>
          </div>
        </div>

        <Card className="p-6">
          <MatchMode
            flashcards={flashcards}
            onComplete={handleMatchComplete}
          />
        </Card>

        {matchCompleted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-900 font-semibold">All matched! Great job!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StudyModeSelector currentMode={mode} onModeChange={setMode} />

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {progress.masteredCount} / {progress.totalCards} mastered
            {progress.incorrectCount > 0 && (
              <span className="ml-2 text-orange-600">
                ({progress.incorrectCount} to review)
              </span>
            )}
          </span>
          <span className="text-sm text-gray-600 font-semibold">{progress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        {progress.needsReview && (
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ You need to master all cards before completing. Incorrect cards will be reviewed again.
          </p>
        )}
      </div>

      <Card className="min-h-[400px] flex items-center justify-center p-8">
        {mode === 'flashcard' && (
          <div className="text-center w-full max-w-2xl">
            {!isFlipped ? (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-6">Front</p>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 break-words whitespace-pre-wrap leading-relaxed">
                  {currentCard.front || 'No front text'}
                </div>
                <p className="text-sm text-gray-400 mt-8">Click to flip</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-6">Back</p>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 break-words whitespace-pre-wrap leading-relaxed">
                  {currentCard.back || 'No back text'}
                </div>
                <div className="flex justify-center space-x-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnswer(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Incorrect
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnswer(true);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Correct
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'quiz' && (
          <QuizMode
            flashcard={{
              id: currentCard.flashcardId,
              front: currentCard.front,
              back: currentCard.back,
            }}
            allFlashcards={flashcards}
            onAnswer={handleAnswer}
          />
        )}

        {mode === 'writing' && (
          <WritingMode
            flashcard={{
              id: currentCard.flashcardId,
              front: currentCard.front,
              back: currentCard.back,
            }}
            onAnswer={handleAnswer}
          />
        )}
      </Card>

      {mode === 'flashcard' && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {isFlipped ? 'Show Front' : 'Flip Card'}
          </Button>
        </div>
      )}
    </div>
  );
}
