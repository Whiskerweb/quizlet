'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { setsService } from '@/lib/supabase/sets';
import { studyService } from '@/lib/supabase/study';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { Check, X, Settings } from 'lucide-react';
import { StudyModeSelector } from './components/StudyModeSelector';
import { StudySettings } from './components/StudySettings';
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

interface ModeMemory {
  sessionState: StudySessionState | null;
  currentCard: CardReview | null;
  isFlipped: boolean;
  sessionId: string | null;
  flashcards: Flashcard[];
  matchCompleted: boolean;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const previousModeRef = useRef<StudyMode>('flashcard');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<StudySessionState | null>(null);
  const [currentCard, setCurrentCard] = useState<CardReview | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [originalFlashcards, setOriginalFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  // Memory system: store state for each mode
  const [modeMemory, setModeMemory] = useState<Record<StudyMode, ModeMemory>>({
    flashcard: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    quiz: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    writing: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    match: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
  });

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const set = await setsService.getOne(setId);
      if (set.flashcards && Array.isArray(set.flashcards) && set.flashcards.length > 0) {
        const validFlashcards = set.flashcards.filter(
          card => card && typeof card.front === 'string' && typeof card.back === 'string'
        );
        if (validFlashcards.length > 0) {
          setOriginalFlashcards(validFlashcards);
          setFlashcards(validFlashcards);
        } else {
          setFlashcards([]);
          setOriginalFlashcards([]);
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
      const session = await studyService.startSession({
        setId,
        mode,
      });
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleAnswer = useCallback(async (isCorrect: boolean, timeSpent: number = 0) => {
    if (!sessionId || !sessionState || !currentCard) return;

    const flashcardId = currentCard.flashcardId;

    try {
      // Submit to backend
      await studyService.submitAnswer(sessionId, {
        flashcardId,
        isCorrect,
        timeSpent,
      });

      // Update session state
      const updatedState = recordAnswer(sessionState, flashcardId, isCorrect);
      console.log('[Study] Answer recorded:', { flashcardId, isCorrect, updatedState });

      // Check if session is complete
      if (isSessionComplete(updatedState)) {
        console.log('[Study] Session complete');
        setSessionState(updatedState);
        await completeSession();
        return;
      }

      // Move to next card
      const nextState = moveToNext(updatedState);
      console.log('[Study] Moved to next:', { currentIndex: nextState.currentIndex, previousCardId: flashcardId });
      
      // Get next card (will prioritize incorrect ones if needed)
      // Pass current card ID to ensure we don't get the same card
      let nextCard = getNextCard(nextState, flashcardId);
      console.log('[Study] Next card (first attempt):', nextCard?.flashcardId);
      
      // If we got the same card or null, try incrementing index until we find a different card
      let attempts = 0;
      let finalState = nextState;
      while ((!nextCard || nextCard.flashcardId === flashcardId) && attempts < 10) {
        finalState = {
          ...finalState,
          currentIndex: finalState.currentIndex + 1,
        };
        nextCard = getNextCard(finalState, flashcardId);
        attempts++;
        console.log('[Study] Next card (attempt', attempts, '):', nextCard?.flashcardId, 'index:', finalState.currentIndex);
      }
      
      // Update state with final state
      setSessionState(finalState);
      console.log('[Study] Final state:', { currentIndex: finalState.currentIndex, nextCardId: nextCard?.flashcardId });
      
      if (nextCard && nextCard.flashcardId !== flashcardId) {
        console.log('[Study] Setting new card:', nextCard.flashcardId);
        // Use functional updates to ensure we're using the latest state
        setCurrentCard(() => nextCard);
        setIsFlipped(() => false);
        
        // Update memory with new state
        setTimeout(() => {
          setModeMemory(prev => ({
            ...prev,
            [mode]: {
              sessionState: finalState,
              currentCard: nextCard,
              isFlipped: false,
              sessionId,
              flashcards,
              matchCompleted,
            },
          }));
        }, 0);
      } else {
        // All cards mastered or no more cards available
        console.log('[Study] No more cards available, completing session');
        await completeSession();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  }, [sessionId, sessionState, currentCard, mode, flashcards, matchCompleted]);

  const handleMatchComplete = async (correctCount: number, totalTime: number) => {
    if (!sessionId || !sessionState) return;

    // Mark all cards as correct for match mode
    let updatedState = sessionState;
    for (const card of flashcards) {
      updatedState = recordAnswer(updatedState, card.id, true);
      
      try {
        await studyService.submitAnswer(sessionId, {
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
    
    // Update memory for match mode
    setTimeout(() => {
      setModeMemory(prev => ({
        ...prev,
        match: {
          sessionState: updatedState,
          currentCard,
          isFlipped,
          sessionId,
          flashcards,
          matchCompleted: true,
        },
      }));
    }, 0);
    
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
      await studyService.completeSession(sessionId);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleStartStudy = async (options: { shuffle: boolean; startFrom: number }) => {
    let cardsToUse = [...originalFlashcards];
    
    // Shuffle if requested
    if (options.shuffle) {
      cardsToUse = [...cardsToUse].sort(() => Math.random() - 0.5);
    }
    
    // Start from specific card if requested
    if (options.startFrom > 1) {
      const startIndex = options.startFrom - 1;
      cardsToUse = [
        ...cardsToUse.slice(startIndex),
        ...cardsToUse.slice(0, startIndex)
      ];
    }
    
    setFlashcards(cardsToUse);
    
    // Initialize session state
    const initialState = initializeSession(cardsToUse);
    setSessionState(initialState);
    const firstCard = getNextCard(initialState);
    if (firstCard) {
      setCurrentCard(firstCard);
    }
    
    setShowSettings(false);
    setHasStarted(true);
    
    // Start session
    try {
      const session = await studyService.startSession({
        setId,
        mode,
      });
      setSessionId(session.id);
      
      // Save initial state to memory for this mode
      setModeMemory(prev => ({
        ...prev,
        [mode]: {
          sessionState: initialState,
          currentCard: firstCard,
          isFlipped: false,
          sessionId: session.id,
          flashcards: cardsToUse,
          matchCompleted: false,
        },
      }));
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleCancelSettings = () => {
    router.push(`/sets/${setId}`);
  };

  // Helper function to update memory for current mode
  const updateModeMemory = useCallback(() => {
    if (hasStarted && sessionState) {
      setModeMemory(prev => ({
        ...prev,
        [mode]: {
          sessionState,
          currentCard,
          isFlipped,
          sessionId,
          flashcards,
          matchCompleted,
        },
      }));
    }
  }, [hasStarted, sessionState, mode, currentCard, isFlipped, sessionId, flashcards, matchCompleted]);

  // Save current state to memory before changing mode
  const saveCurrentModeState = (currentMode: StudyMode) => {
    if (hasStarted && sessionState && currentCard) {
      setModeMemory(prev => ({
        ...prev,
        [currentMode]: {
          sessionState,
          currentCard,
          isFlipped,
          sessionId,
          flashcards,
          matchCompleted,
        },
      }));
    }
  };

  // Restore state from memory when switching to a mode
  const restoreModeState = async (targetMode: StudyMode) => {
    const savedState = modeMemory[targetMode];
    
    if (savedState && savedState.sessionState && savedState.flashcards.length > 0) {
      // Restore from memory - use the flashcards from memory (they may be shuffled differently)
      setFlashcards(savedState.flashcards);
      setSessionState(savedState.sessionState);
      setCurrentCard(savedState.currentCard);
      setIsFlipped(savedState.isFlipped);
      setSessionId(savedState.sessionId);
      setMatchCompleted(savedState.matchCompleted);
    } else if (hasStarted && originalFlashcards.length > 0) {
      // Initialize new session for this mode if no memory exists
      // Use original flashcards (not shuffled) for new mode
      const cardsToUse = [...originalFlashcards];
      const initialState = initializeSession(cardsToUse);
      setSessionState(initialState);
      const firstCard = getNextCard(initialState);
      if (firstCard) {
        setCurrentCard(firstCard);
      }
      setIsFlipped(false);
      setMatchCompleted(false);
      setFlashcards(cardsToUse);
      
      // Start new session for this mode
      try {
        const session = await studyService.startSession({
          setId,
          mode: targetMode,
        });
        setSessionId(session.id);
        // Update memory with new session
        setModeMemory(prev => ({
          ...prev,
          [targetMode]: {
            sessionState: initialState,
            currentCard: firstCard,
            isFlipped: false,
            sessionId: session.id,
            flashcards: cardsToUse,
            matchCompleted: false,
          },
        }));
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    }
  };

  // Wrapper function to handle mode changes with memory
  const handleModeChange = (newMode: StudyMode) => {
    if (hasStarted && mode !== newMode) {
      // Save current state before switching
      saveCurrentModeState(mode);
      previousModeRef.current = mode;
    }
    setMode(newMode);
  };

  useEffect(() => {
    // Only handle mode changes if already started
    if (!hasStarted) return;

    // Restore or initialize state for the new mode
    restoreModeState(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasStarted]);

  // Keyboard shortcuts for flashcard mode
  useEffect(() => {
    if (mode !== 'flashcard' || !currentCard) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newFlipped = !isFlipped;
        setIsFlipped(newFlipped);
        // Update memory with flipped state
        setTimeout(() => {
          if (sessionState && currentCard) {
            updateModeMemory();
          }
        }, 0);
      } else if (e.key === 'ArrowLeft' && isFlipped) {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === 'ArrowRight' && isFlipped) {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [mode, isFlipped, currentCard, handleAnswer, sessionState, updateModeMemory]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (flashcards.length === 0 && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No cardz in this set</p>
          <Button onClick={() => router.push(`/sets/${setId}`)}>
            Back to Set
          </Button>
        </Card>
      </div>
    );
  }

  // Show settings screen before starting
  if (showSettings && originalFlashcards.length > 0) {
    return (
      <StudySettings
        totalCards={originalFlashcards.length}
        onStart={handleStartStudy}
        onCancel={handleCancelSettings}
      />
    );
  }

  if (isCompleted) {
    const progress = sessionState ? getProgress(sessionState) : { progress: 100, masteredCount: flashcards.length, totalCards: flashcards.length };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Study Complete! 🎉</h2>
          <p className="text-3xl font-bold text-brand-primary mb-2">100%</p>
          <p className="text-white mb-6">
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
        <p>No cardz available</p>
      </div>
    );
  }

  const progress = getProgress(sessionState);

  // Match mode - show all flashcards at once
  if (mode === 'match') {
    return (
      <div className="min-h-screen bg-dark-background-base flex flex-col">
        {/* Top bar with mode selector centered - below search bar */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
          <StudyModeSelector currentMode={mode} onModeChange={handleModeChange} />
        </div>

        {/* Main content - full screen */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-background-base flex flex-col">
      {/* Top bar with mode selector centered - below search bar */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
        <StudyModeSelector currentMode={mode} onModeChange={setMode} />
      </div>

      {/* Main content - full screen centered */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-4xl">
          <Card className="min-h-[500px] flex flex-col p-8">
            {/* Progress bar integrated in card */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white">
                  {progress.masteredCount} / {progress.totalCards} maîtrisées
                  {progress.incorrectCount > 0 && (
                    <span className="ml-2 text-orange-400">
                      ({progress.incorrectCount} à revoir)
                    </span>
                  )}
                </span>
                <span className="text-sm text-white font-semibold">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.needsReview && (
                <p className="text-xs text-orange-400 mt-2">
                  ⚠️ Vous devez maîtriser toutes les cartes avant de terminer.
                </p>
              )}
            </div>

            {/* Card content */}
            <div className="flex-1 flex items-center justify-center">
              {mode === 'flashcard' && (
                <div className="text-center w-full max-w-2xl">
            {!isFlipped ? (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-dark-text-muted mb-6">Front</p>
                <FormattedText 
                  text={currentCard.front || 'No front text'} 
                  className="text-3xl md:text-4xl font-bold text-white break-words whitespace-pre-wrap leading-relaxed" 
                />
                <div className="mt-8 flex flex-col items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFlipped(true);
                      setTimeout(updateModeMemory, 0);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Flip Card
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-dark-text-muted mb-6">Back</p>
                <FormattedText 
                  text={currentCard.back || 'No back text'} 
                  className="text-3xl md:text-4xl font-bold text-white break-words whitespace-pre-wrap leading-relaxed" 
                />
                <div className="mt-8 space-y-4">
                  <div className="flex flex-col items-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFlipped(false);
                        setTimeout(updateModeMemory, 0);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Show Front
                    </Button>
                  </div>
                  <div className="flex justify-center space-x-4 mt-6">
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
            </div>
          </Card>

          {mode === 'flashcard' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-dark-text-muted">
                Raccourcis : <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">Entrée</kbd> pour retourner • <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">←</kbd> Incorrect • <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">→</kbd> Correct
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
