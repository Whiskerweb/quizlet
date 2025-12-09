'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { setsService } from '@/lib/supabase/sets';
import { studyService } from '@/lib/supabase/study';
import { classModulesService } from '@/lib/supabase/class-modules';
import { useAuthStore } from '@/store/authStore';
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
type ModeMemoryMap = Record<StudyMode, ModeMemory>;

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  const setId = params.id as string;
  const [mode, setMode] = useState<StudyMode>('flashcard');
  
  // Check if we should resume a session from URL params
  const [shouldAutoResume, setShouldAutoResume] = useState(false);
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
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
  const [classInfo, setClassInfo] = useState<{ class_id: string; class: any } | null>(null);
  // Track time when card is flipped (for flashcard mode)
  const [cardStartTime, setCardStartTime] = useState<number | null>(null);
  // Memory system: store state for each mode
  const [modeMemory, setModeMemory] = useState<ModeMemoryMap>({
    flashcard: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    quiz: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    writing: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
    match: { sessionState: null, currentCard: null, isFlipped: false, sessionId: null, flashcards: [], matchCompleted: false },
  });

  useEffect(() => {
    loadSet();
    
    // Check URL params for resume session
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const resumeId = urlParams.get('resume');
      if (resumeId) {
        setResumeSessionId(resumeId);
        setShouldAutoResume(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  // Check if set belongs to a class (for students only)
  useEffect(() => {
    const checkSetClass = async () => {
      const userRole = (profile as any)?.role;
      console.log('[Study] Checking if set belongs to a class:', { role: userRole, setId });
      if (userRole === 'student' && setId) {
        try {
          console.log('[Study] Looking for class for set:', setId);
          const foundClass = await classModulesService.findSetClass(setId);
          console.log('[Study] Found class:', foundClass);
          if (foundClass) {
            setClassInfo(foundClass);
            console.log('[Study] Class info set:', foundClass);
          } else {
            console.log('[Study] No class found for this set');
          }
        } catch (error) {
          console.error('[Study] Failed to find set class:', error);
        }
      } else {
        const userRole = (profile as any)?.role;
        console.log('[Study] Not a student or no setId:', { role: userRole, setId });
      }
    };

    if (profile) {
      checkSetClass();
    } else {
      console.log('[Study] No profile yet, waiting...');
    }
  }, [setId, profile]);

  // Auto-save session state periodically (backup - main save is after each answer)
  useEffect(() => {
    if (!sessionId || !sessionState || !hasStarted || sessionId.startsWith('local-')) return;

    const saveInterval = setInterval(async () => {
      try {
        await studyService.updateSessionState(sessionId, sessionState);
        console.log('[Study] Session state auto-saved (periodic backup)');
      } catch (error) {
        console.warn('[Study] Failed to auto-save session state:', error);
      }
    }, 30000); // Save every 30 seconds as backup

    return () => clearInterval(saveInterval);
  }, [sessionId, sessionState, hasStarted]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      console.log('[Study] Loading set:', setId);
      const set = await setsService.getOne(setId);
      console.log('[Study] Set loaded:', { 
        id: set.id, 
        title: set.title, 
        flashcardsCount: set.flashcards?.length || 0,
        flashcardsType: typeof set.flashcards,
        isArray: Array.isArray(set.flashcards),
        sampleFlashcard: set.flashcards?.[0] ? {
          id: set.flashcards[0].id,
          hasFront: !!set.flashcards[0].front,
          hasBack: !!set.flashcards[0].back,
          frontType: typeof set.flashcards[0].front,
          backType: typeof set.flashcards[0].back,
        } : null,
      });
      
      if (set.flashcards && Array.isArray(set.flashcards) && set.flashcards.length > 0) {
        const validFlashcards = set.flashcards.filter(
          card => card && typeof card.front === 'string' && typeof card.back === 'string'
        );
        console.log('[Study] Valid flashcards:', {
          total: set.flashcards.length,
          valid: validFlashcards.length,
          invalid: set.flashcards.length - validFlashcards.length,
          invalidCards: set.flashcards.filter(
            card => !card || typeof card.front !== 'string' || typeof card.back !== 'string'
          ).map(c => ({ id: c?.id, frontType: typeof c?.front, backType: typeof c?.back })),
        });
        
        if (validFlashcards.length > 0) {
          // Ensure all flashcards have required fields
          const processedFlashcards = validFlashcards.map(card => ({
            id: card.id,
            front: String(card.front || ''),
            back: String(card.back || ''),
            image_url: card.image_url || null,
            audio_url: card.audio_url || null,
            order: card.order || 0,
            set_id: card.set_id || setId,
            created_at: card.created_at,
            updated_at: card.updated_at,
          }));
          
          console.log('[Study] Processed flashcards:', processedFlashcards.length);
          setOriginalFlashcards(processedFlashcards);
          setFlashcards(processedFlashcards);
        } else {
          console.warn('[Study] No valid flashcards found');
          setFlashcards([]);
          setOriginalFlashcards([]);
        }
      } else {
        console.warn('[Study] No flashcards in set or set.flashcards is not an array', {
          hasFlashcards: !!set.flashcards,
          isArray: Array.isArray(set.flashcards),
          length: set.flashcards?.length,
        });
        setFlashcards([]);
        setOriginalFlashcards([]);
      }
    } catch (error) {
      console.error('[Study] Failed to load set:', error);
      setFlashcards([]);
      setOriginalFlashcards([]);
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
    console.log('[Study] handleAnswer called:', { 
      isCorrect, 
      hasSessionId: !!sessionId, 
      hasSessionState: !!sessionState, 
      hasCurrentCard: !!currentCard,
      mode,
      cardStartTime: cardStartTime ? new Date(cardStartTime).toISOString() : null
    });

    if (!sessionState || !currentCard) {
      console.error('[Study] Cannot handle answer - missing state:', {
        sessionState: !!sessionState,
        currentCard: !!currentCard,
      });
      return;
    }

    const flashcardId = currentCard.flashcardId;

    // For flashcard mode, calculate time spent if card was flipped
    if (mode === 'flashcard' && timeSpent === 0 && cardStartTime) {
      timeSpent = Date.now() - cardStartTime;
      console.log('[Study] Calculated time spent in flashcard mode:', timeSpent, 'ms');
    }

    // Try to submit to backend first (if we have a real session)
    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await studyService.submitAnswer(sessionId, {
          flashcardId,
          isCorrect,
          timeSpent,
        });
        console.log('[Study] Answer submitted via API');
      } catch (error) {
        // If API fails, try direct save
        console.warn('[Study] API submission failed, trying direct save:', error);
        try {
          await studyService.saveAnswerDirect(setId, flashcardId, isCorrect, timeSpent);
          console.log('[Study] Answer saved directly to database');
        } catch (directError) {
          console.warn('[Study] Direct save also failed:', directError);
        }
      }
    } else {
      // For local sessions, save directly to database
      try {
        await studyService.saveAnswerDirect(setId, flashcardId, isCorrect, timeSpent);
        console.log('[Study] Answer saved directly (local session)');
      } catch (error) {
        console.warn('[Study] Failed to save answer directly:', error);
      }
    }

    try {
      // Update session state (always do this, even if backend submission failed)
      const updatedState = recordAnswer(sessionState, flashcardId, isCorrect);
      console.log('[Study] Answer recorded:', { 
        flashcardId, 
        isCorrect, 
        masteredCount: updatedState.masteredCards.size,
        totalCards: updatedState.cards.length,
        allMastered: updatedState.cards.every(c => c.isMastered),
      });

      // Check if session is complete BEFORE moving to next card
      if (isSessionComplete(updatedState)) {
        console.log('[Study] ✅ All cards mastered - completing session');
        setSessionState(updatedState);
        await completeSession();
        return;
      }

      // Move to next card - just increment index
      const nextState = moveToNext(updatedState);
      const unmasteredCount = nextState.cards.filter(c => !c.isMastered).length;
      console.log('[Study] Moved to next:', { 
        currentIndex: nextState.currentIndex, 
        previousCardId: flashcardId,
        totalCards: nextState.cards.length,
        unmasteredCount,
        masteredCount: nextState.masteredCards.size,
      });
      
      // Double-check: if no unmastered cards, complete session
      if (unmasteredCount === 0) {
        console.log('[Study] ✅ No unmastered cards remaining - completing session');
        setSessionState(nextState);
        await completeSession();
        return;
      }
      
      // Get next card (will prioritize incorrect ones if needed)
      // Always pass current card ID to ensure we don't get the same card
      let nextCard = getNextCard(nextState, flashcardId);
      console.log('[Study] Next card (first attempt):', {
        nextCardId: nextCard?.flashcardId,
        nextCardFront: nextCard?.front?.substring(0, 50),
        isSameCard: nextCard?.flashcardId === flashcardId,
        availableUnmastered: nextState.cards.filter(c => !c.isMastered && c.flashcardId !== flashcardId).length,
      });
      
      // If we got the same card (shouldn't happen with fixed getNextCard, but safety check)
      // or null, we need to handle it
      if (nextCard && nextCard.flashcardId === flashcardId) {
        console.warn('[Study] WARNING: Got same card, finding alternative');
        // Force get a different card by trying different states
        const unmasteredCards = nextState.cards.filter(c => !c.isMastered && c.flashcardId !== flashcardId);
        if (unmasteredCards.length > 0) {
          nextCard = unmasteredCards[0];
          console.log('[Study] Using alternative card:', nextCard.flashcardId);
        } else {
          nextCard = null;
          console.log('[Study] No alternative cards available - session complete');
        }
      }
      
      // Update state
      setSessionState(nextState);
      console.log('[Study] Final state:', { currentIndex: nextState.currentIndex, nextCardId: nextCard?.flashcardId });
      
      // Save progress to backend immediately after each answer
      if (sessionId && sessionId.startsWith('local-') === false) {
        try {
          await studyService.updateSessionState(sessionId, nextState);
          console.log('[Study] Progress auto-saved after answer');
        } catch (error) {
          console.warn('[Study] Failed to auto-save progress:', error);
        }
      }
      
      // Check if we have a valid next card
      if (!nextCard || nextCard.flashcardId === flashcardId) {
        // No more cards available or same card - session is complete
        console.log('[Study] ✅ No valid next card available - completing session');
        await completeSession();
        return;
      }
      
      // We have a valid next card - proceed to it
      console.log('[Study] Setting new card:', nextCard.flashcardId);
      // Use functional updates to ensure we're using the latest state
      setCurrentCard(() => nextCard);
      setIsFlipped(() => false);
      // Reset card start time for next card
      setCardStartTime(null);
      
      // Update memory with new state
      setTimeout(() => {
        setModeMemory(prev => ({
          ...prev,
          [mode]: {
            sessionState: nextState,
            currentCard: nextCard,
            isFlipped: false,
            sessionId,
            flashcards,
            matchCompleted,
          },
        }));
      }, 0);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  }, [sessionId, sessionState, currentCard, mode, flashcards, matchCompleted, cardStartTime]);

  const handleMatchComplete = async (correctCount: number, totalTime: number) => {
    if (!sessionState) return;

    // Mark all cards as correct for match mode
    let updatedState = sessionState;
    for (const card of flashcards) {
      updatedState = recordAnswer(updatedState, card.id, true);
      
      // Save answers directly (works for both local and backend sessions)
      try {
        if (sessionId && !sessionId.startsWith('local-')) {
          await studyService.submitAnswer(sessionId, {
            flashcardId: card.id,
            isCorrect: true,
            timeSpent: totalTime / flashcards.length,
          });
        } else {
          // For local sessions, save directly
          await studyService.saveAnswerDirect(setId, card.id, true, totalTime / flashcards.length);
        }
      } catch (error) {
        console.error('[Study] Failed to save match answer:', error);
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
    console.log('[Study] Completing session...', { sessionId, hasSessionState: !!sessionState });
    
    // Reset card start time
    setCardStartTime(null);
    
    // Always mark as completed locally, even if backend call fails
    setIsCompleted(true);
    
    // Try to mark as completed in backend (but don't block if it fails)
    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await studyService.completeSession(sessionId);
        console.log('[Study] ✅ Session marked as completed in backend');
      } catch (error) {
        console.warn('[Study] Failed to mark session as completed in backend (but marked locally):', error);
      }
    } else {
      console.log('[Study] Local session - marked as completed locally only');
    }
  };

  const handleStartStudy = async (options: { shuffle: boolean; startFrom: number; forceNew?: boolean }) => {
    console.log('[Study] Starting study with options:', options);
    
    // Start from specific card if requested (always applied to original order)
    const startIndex = options.startFrom > 1 
      ? Math.min(Math.max(options.startFrom - 1, 0), originalFlashcards.length - 1)
      : 0;
    
    // Create subset with original indices preserved
    let cardsToUse = originalFlashcards.slice(startIndex).map((card, idx) => ({
      ...card,
      originalIndex: startIndex + idx, // Track position in full original set
    }));
    
    // Shuffle the selected subset if requested (preserves originalIndex)
    if (options.shuffle) {
      cardsToUse = [...cardsToUse].sort(() => Math.random() - 0.5);
    }
    
    setFlashcards(cardsToUse);
    
    // Initialize session state with cards that have originalIndex
    const initialState = initializeSession(cardsToUse);
    setSessionState(initialState);
    const firstCard = getNextCard(initialState);
    if (firstCard) {
      setCurrentCard(firstCard);
    }
    
    setShowSettings(false);
    setHasStarted(true);
    
    // Start session with parameters for persistence
    try {
      const session = await studyService.startSession({
        setId,
        mode,
        shuffle: options.shuffle,
        startFrom: options.startFrom,
        cardOrder: cardsToUse.map(c => c.id), // Save the exact card order
        sessionState: initialState, // Save initial session state
        forceNew: options.forceNew, // Force creation of new session if requested
      });
      setSessionId(session.id);
      
      if (options.forceNew) {
        console.log('[Study] New session forced and created:', session.id);
      } else {
        console.log('[Study] Session started (may be resumed if existing):', session.id);
      }
      
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
      console.error('[Study] Failed to start session - continuing without backend persistence:', error);
      // Continue anyway - local state is already initialized
      // Set a temporary session ID so handleAnswer doesn't fail
      setSessionId('local-' + Date.now());
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
    } else if (hasStarted && flashcards.length > 0) {
      // Initialize new session for this mode if no memory exists
      // IMPORTANT: Use the SAME flashcards subset from the current session (don't reset to all cards)
      const cardsToUse = [...flashcards];
      const initialState = initializeSession(cardsToUse);
      setSessionState(initialState);
      const firstCard = getNextCard(initialState);
      if (firstCard) {
        setCurrentCard(firstCard);
      }
      setIsFlipped(false);
      setMatchCompleted(false);
      
      // Get current session to reuse its parameters
      if (sessionId) {
        try {
          const currentSession = await studyService.getSession(sessionId);
          // Create new session for this mode with SAME parameters
          const newSession = await studyService.startSession({
            setId,
            mode: targetMode,
            shuffle: currentSession.shuffle || false,
            startFrom: currentSession.start_from || 1,
            cardOrder: currentSession.card_order,
            sessionState: initialState,
          });
          setSessionId(newSession.id);
          // Update memory with new session
          setModeMemory(prev => ({
            ...prev,
            [targetMode]: {
              sessionState: initialState,
              currentCard: firstCard,
              isFlipped: false,
              sessionId: newSession.id,
              flashcards: cardsToUse,
              matchCompleted: false,
            },
          }));
        } catch (error) {
          console.error('Failed to start session:', error);
        }
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

  // Track time when card is flipped in flashcard mode
  useEffect(() => {
    if (mode === 'flashcard' && isFlipped && !cardStartTime) {
      // Card was just flipped, start tracking time
      setCardStartTime(Date.now());
      console.log('[Study] Card flipped, started tracking time');
    } else if (mode === 'flashcard' && !isFlipped) {
      // Card is not flipped, reset timer
      setCardStartTime(null);
    }
  }, [mode, isFlipped, cardStartTime]);

  // Reset card start time when card changes
  useEffect(() => {
    if (currentCard) {
      setCardStartTime(null);
    }
  }, [currentCard?.flashcardId]);

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

  // Auto-resume if URL parameter is present (with timeout)
  useEffect(() => {
    if (!shouldAutoResume || !resumeSessionId) {
      return;
    }

    // Check if we have the necessary data
    if (originalFlashcards.length === 0) {
      console.log('[Study] Waiting for flashcards to load...');
      return;
    }

    if (hasStarted) {
      console.log('[Study] Session already started, skipping auto-resume');
      setShouldAutoResume(false);
      return;
    }

    // Timeout de sécurité : si après 10 secondes ça ne charge toujours pas, on annule
    const timeout = setTimeout(() => {
      console.error('[Study] ⏱️ Timeout: Auto-resume took too long');
      setShouldAutoResume(false);
      setShowSettings(true);
      alert('La reprise de session a pris trop de temps.\n\nVeuillez réessayer ou créer une nouvelle session.');
    }, 10000); // 10 secondes

    const resumeSession = async () => {
      try {
        console.log('[Study] Auto-resuming session:', resumeSessionId);
        
        const session = await studyService.getSession(resumeSessionId);
        console.log('[Study] Session data received:', session);
        
        if (!session) {
          throw new Error('Session introuvable en base de données');
        }

        // Clear timeout si succès
        clearTimeout(timeout);
        setShouldAutoResume(false);

        // Check if we have card_order, otherwise fallback to originalFlashcards
        let orderedCards;
        
        if (session.card_order && Array.isArray(session.card_order) && session.card_order.length > 0) {
          console.log('[Study] Using card_order from session:', session.card_order.length, 'cards');
          orderedCards = session.card_order
            .map((cardId: string) => originalFlashcards.find((c: any) => c.id === cardId))
            .filter(Boolean)
            .map((card: any, idx: number) => ({
              ...card,
              originalIndex: (session.start_from || 1) - 1 + idx,
            }));
        } else {
          console.log('[Study] No card_order, using all flashcards');
          orderedCards = originalFlashcards.map((card, idx) => ({
            ...card,
            originalIndex: idx,
          }));
        }
        
        if (orderedCards.length === 0) {
          throw new Error('Aucune carte trouvée pour cette session');
        }
        
        console.log('[Study] Cards prepared:', orderedCards.length);
        setFlashcards(orderedCards);
        
        // Variables for state restoration
        let restoredState;
        let nextCard;
        
        // Restore session state if available
        if (session.session_state && session.session_state.cards && Array.isArray(session.session_state.cards)) {
          console.log('[Study] Restoring session state with', session.session_state.cards.length, 'cards');
          console.log('[Study] Raw session_state:', session.session_state);
          console.log('[Study] Current index from DB:', session.session_state.currentIndex);
          console.log('[Study] Mastered cards from DB:', session.session_state.masteredCards);
          
          restoredState = {
            ...session.session_state,
            masteredCards: new Set(
              Array.isArray(session.session_state.masteredCards) 
                ? session.session_state.masteredCards 
                : []
            ),
            incorrectCards: Array.isArray(session.session_state.incorrectCards)
              ? session.session_state.incorrectCards
              : [],
          };
          
          console.log('[Study] Restored state:', {
            currentIndex: restoredState.currentIndex,
            totalCards: restoredState.cards.length,
            masteredCount: restoredState.masteredCards.size,
            incorrectCount: restoredState.incorrectCards.length,
          });
          
          setSessionState(restoredState);
          nextCard = getNextCard(restoredState);
          console.log('[Study] Next card after restore:', nextCard?.flashcardId);
          
          if (nextCard) {
            setCurrentCard(nextCard);
          } else {
            throw new Error('Aucune carte suivante trouvée');
          }
        } else {
          console.log('[Study] Initializing fresh state');
          const initialState = initializeSession(orderedCards);
          const firstCard = getNextCard(initialState);
          console.log('[Study] First card:', firstCard?.flashcardId);
          
          // Use initialState as restoredState for memory
          restoredState = initialState;
          nextCard = firstCard;
          
          setSessionState(initialState);
          if (firstCard) {
            setCurrentCard(firstCard);
          } else {
            throw new Error('Impossible d\'obtenir la première carte');
          }
        }
        
        setSessionId(session.id);
        const restoredMode = session.mode || 'flashcard';
        setMode(restoredMode);
        
        // IMPORTANT: Save to modeMemory BEFORE setHasStarted(true)
        // to prevent the useEffect from overwriting our restored state
        setModeMemory(prev => ({
          ...prev,
          [restoredMode]: {
            sessionState: restoredState,
            currentCard: nextCard || restoredState.cards[0],
            isFlipped: false,
            sessionId: session.id,
            flashcards: orderedCards,
            matchCompleted: false,
          },
        }));
        
        setShowSettings(false);
        setHasStarted(true);
        
        console.log('[Study] ✅ Auto-resume successful:', session.id);
      } catch (error: any) {
        console.error('[Study] ❌ Failed to auto-resume session:', error);
        console.error('[Study] Error stack:', error?.stack);
        
        // Clear timeout et reset
        clearTimeout(timeout);
        setShouldAutoResume(false);
        setShowSettings(true);
        setHasStarted(false);
        
        alert(`Impossible de reprendre la session.\n\n${error?.message || 'Erreur inconnue'}\n\nVous pouvez créer une nouvelle session.`);
      }
    };

    resumeSession();

    // Cleanup : clear timeout if component unmounts
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoResume, resumeSessionId, originalFlashcards.length, hasStarted]);

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

  // Handler for manual resume (from settings modal)
  const handleResumeSession = async (sessionId: string) => {
    try {
      console.log('[Study] Attempting to resume session:', sessionId);
      const session = await studyService.getSession(sessionId);
      console.log('[Study] Session data received:', session);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if we have card_order, otherwise fallback to originalFlashcards
      let orderedCards;
      
      if (session.card_order && Array.isArray(session.card_order) && session.card_order.length > 0) {
        console.log('[Study] Using card_order from session:', session.card_order.length, 'cards');
        // Reconstruct flashcards in the saved order with original indices
        orderedCards = session.card_order
          .map((cardId: string) => originalFlashcards.find((c: any) => c.id === cardId))
          .filter(Boolean)
          .map((card: any, idx: number) => ({
            ...card,
            originalIndex: (session.start_from || 1) - 1 + idx,
          }));
      } else {
        console.log('[Study] No card_order, using all flashcards');
        // Fallback: use all original flashcards
        orderedCards = originalFlashcards.map((card, idx) => ({
          ...card,
          originalIndex: idx,
        }));
      }
      
      if (orderedCards.length === 0) {
        throw new Error('No cards found for this session');
      }

      console.log('[Study] Ordered cards prepared:', orderedCards.length);
      setFlashcards(orderedCards);
      
      // Variables for state restoration
      let restoredState;
      let nextCard;
      
      // Restore session state if available
      if (session.session_state && session.session_state.cards && Array.isArray(session.session_state.cards)) {
        console.log('[Study] Restoring session state with', session.session_state.cards.length, 'cards');
        console.log('[Study] Manual resume - Raw session_state:', session.session_state);
        console.log('[Study] Manual resume - Current index from DB:', session.session_state.currentIndex);
        
        // Reconstruct the session state with proper types
        restoredState = {
          ...session.session_state,
          masteredCards: new Set(
            Array.isArray(session.session_state.masteredCards) 
              ? session.session_state.masteredCards 
              : []
          ),
          incorrectCards: Array.isArray(session.session_state.incorrectCards)
            ? session.session_state.incorrectCards
            : [],
        };
        
        console.log('[Study] Manual resume - Restored state:', {
          currentIndex: restoredState.currentIndex,
          totalCards: restoredState.cards.length,
          masteredCount: restoredState.masteredCards.size,
          incorrectCount: restoredState.incorrectCards.length,
        });
        
        setSessionState(restoredState);
        nextCard = getNextCard(restoredState);
        console.log('[Study] Manual resume - Next card:', nextCard?.flashcardId);
        
        if (nextCard) {
          setCurrentCard(nextCard);
        } else {
          console.warn('[Study] Manual resume - No next card found, showing first card as fallback');
          nextCard = restoredState.cards[0];
          setCurrentCard(nextCard);
        }
      } else {
        console.log('[Study] No valid session_state, initializing fresh state');
        // Initialize fresh state with restored cards
        const initialState = initializeSession(orderedCards);
        const firstCard = getNextCard(initialState);
        console.log('[Study] First card from fresh state:', firstCard?.flashcardId);
        
        // Use initialState as restoredState for memory
        restoredState = initialState;
        nextCard = firstCard;
        
        setSessionState(initialState);
        if (firstCard) {
          setCurrentCard(firstCard);
        }
      }
      
      setSessionId(session.id);
      const restoredMode = session.mode || 'flashcard';
      setMode(restoredMode);
      
      // IMPORTANT: Save to modeMemory BEFORE setHasStarted(true)
      // to prevent the useEffect from overwriting our restored state
      setModeMemory(prev => ({
        ...prev,
        [restoredMode]: {
          sessionState: restoredState,
          currentCard: nextCard || restoredState.cards[0],
          isFlipped: false,
          sessionId: session.id,
          flashcards: orderedCards,
          matchCompleted: false,
        },
      }));
      
      setShowSettings(false);
      setHasStarted(true);
      
      console.log('[Study] Session resumed successfully:', session.id);
    } catch (error: any) {
      console.error('[Study] Failed to resume session:', error);
      console.error('[Study] Error details:', {
        message: error?.message,
        stack: error?.stack,
        sessionId,
      });
      alert(`Impossible de reprendre la session.\n\nRaison: ${error?.message || 'Erreur inconnue'}\n\nLa session a peut-être été supprimée ou les données sont corrompues.`);
      setShowSettings(true);
    }
  };

  // Show settings screen before starting (but not if we're auto-resuming)
  if (showSettings && originalFlashcards.length > 0 && !shouldAutoResume) {
    return (
      <StudySettings
        totalCards={originalFlashcards.length}
        setId={setId}
        mode={mode}
        onStart={handleStartStudy}
        onResume={handleResumeSession}
        onCancel={handleCancelSettings}
      />
    );
  }

  // Show loading while auto-resuming
  if (shouldAutoResume && resumeSessionId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            <p className="text-content-emphasis font-medium">Reprise de la session en cours...</p>
            <p className="text-content-muted text-sm">Chargement de votre progression</p>
            <p className="text-content-subtle text-xs mt-2">
              Ouvrez la console (F12) pour voir les détails
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    const progress = sessionState ? getProgress(sessionState) : { progress: 100, masteredCount: flashcards.length, totalCards: flashcards.length };

    console.log('[Study] Study completed, classInfo:', classInfo);
    console.log('[Study] Will show buttons:', classInfo ? 'Finish (class)' : 'Back to Set + Study Again (personal)');

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="py-12 text-center">
          <h2 className="text-2xl font-bold text-content-emphasis mb-4">Study Complete! 🎉</h2>
          <p className="text-3xl font-bold text-brand-primary mb-2">100%</p>
          <p className="text-content-muted mb-6">
            You mastered all {progress.totalCards} cards!
          </p>
          <div className="flex justify-center space-x-4">
            {classInfo ? (
              // If set belongs to a class, show "Finish" button to return to class
              <Button onClick={() => {
                console.log('[Study] Finish button clicked, navigating to class:', classInfo.class_id);
                router.push(`/my-class/${classInfo.class_id}`);
              }}>
                Finish
              </Button>
            ) : (
              // Otherwise, show normal buttons for personal sets
              <>
                <Button onClick={() => router.push(`/sets/${setId}`)}>
                  Back to Set
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Study Again
                </Button>
              </>
            )}
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
  
  // Get the card's position in the ORIGINAL full set (not the filtered subset)
  // This ensures the counter always shows the true card number (e.g., "10/52")
  const cardInSession = sessionState.cards.find(c => c.flashcardId === currentCard.flashcardId);
  const cardPosition = cardInSession?.originalIndex ?? 0;

  // Match mode - show all flashcards at once
  if (mode === 'match') {
    return (
      <div className="min-h-screen bg-bg-default flex flex-col">
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
    <div className="min-h-screen bg-bg-default flex flex-col">
      {/* Top bar with mode selector centered - below search bar */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
        <StudyModeSelector currentMode={mode} onModeChange={setMode} />
      </div>

      {/* Main content - full screen centered */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-4xl">
          <Card className="relative min-h-[500px] flex flex-col p-8">
            {/* Progress bar integrated in card */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-content-muted">
                  {progress.masteredCount} / {progress.totalCards} maîtrisées
                  {progress.incorrectCount > 0 && (
                    <span className="ml-2 text-orange-400">
                      ({progress.incorrectCount} à revoir)
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-content-emphasis">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="mt-3 text-right text-[12px] font-medium text-content-muted">
                Card {cardPosition + 1} of {originalFlashcards.length}
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
                <p className="text-xs uppercase tracking-wide text-content-subtle mb-6">Front</p>
                <FormattedText 
                  text={currentCard.front || 'No front text'} 
                  className="text-3xl md:text-4xl font-bold text-content-emphasis break-words whitespace-pre-wrap leading-relaxed" 
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
                <p className="text-xs uppercase tracking-wide text-content-subtle mb-6">Back</p>
                <FormattedText 
                  text={currentCard.back || 'No back text'} 
                  className="text-3xl md:text-4xl font-bold text-content-emphasis break-words whitespace-pre-wrap leading-relaxed" 
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
              <p className="text-xs text-content-subtle">
                Raccourcis : <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">Entrée</kbd> pour retourner • <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">←</kbd> Incorrect • <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono">→</kbd> Correct
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
