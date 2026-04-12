/**
 * Study Session Manager - Queue-Based Algorithm
 * Simple and predictable card review system
 */

export interface CardReview {
  flashcardId: string;
  front: string;
  back: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: Date;
  isMastered: boolean;
  level: number; // Progress level (0-3+)
  originalIndex?: number; // Position in the full original set (before filtering/shuffling)
}

export interface StudySessionState {
  queue: string[]; // Queue of card IDs to review
  cardData: Map<string, CardReview>; // Card data by ID
  completedCards: Set<string>; // IDs of mastered cards
  order?: string[]; // Optional: original card IDs in order for tracking
}

/**
 * Initialize study session with flashcards
 * @param flashcards - Array of flashcards with optional originalIndex
 */
export function initializeSession(
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    originalIndex?: number
  }>
): StudySessionState {
  const queue = flashcards.map(card => card.id);
  const cardData = new Map<string, CardReview>();

  flashcards.forEach(card => {
    cardData.set(card.id, {
      flashcardId: card.id,
      front: card.front,
      back: card.back,
      correctCount: 0,
      incorrectCount: 0,
      isMastered: false,
      level: 0,
      originalIndex: card.originalIndex,
    });
  });

  return {
    queue,
    cardData,
    completedCards: new Set(),
    order: flashcards.map(c => c.id),
  };
}

/**
 * Get next card to review
 * Simply returns the first card in the queue
 */
export function getNextCard(state: StudySessionState): CardReview | null {
  if (state.queue.length === 0) {
    return null; // No more cards to review
  }

  const nextCardId = state.queue[0];
  const card = state.cardData.get(nextCardId);

  if (!card) {
    console.error('[getNextCard] Card not found in cardData:', nextCardId);
    return null;
  }

  console.log('[getNextCard]', {
    nextCardId,
    queueLength: state.queue.length,
    completedCount: state.completedCards.size,
    totalCards: state.cardData.size,
  });

  return card;
}

/**
 * Record answer and update card state
 * Uses queue-based insertion logic:
 * - Correct answer: Card goes to end of queue (or removed if mastered)
 * - Incorrect answer: Card is reinserted after 3 positions
 */
export function recordAnswer(
  state: StudySessionState,
  flashcardId: string,
  isCorrect: boolean
): StudySessionState {
  const card = state.cardData.get(flashcardId);
  if (!card) {
    console.error('[recordAnswer] Card not found:', flashcardId);
    return state;
  }

  // Remove card from queue (it was at position 0)
  const newQueue = state.queue.filter(id => id !== flashcardId);

  // Update counts and level
  const newCorrectCount = isCorrect ? card.correctCount + 1 : card.correctCount;
  const newIncorrectCount = isCorrect ? card.incorrectCount : card.incorrectCount + 1;
  const newLevel = isCorrect ? card.level + 1 : Math.max(0, card.level - 1);

  // Calculate mastery (Simple: 1 correct answer = mastered!)
  let isMastered = false;
  if (isCorrect) {
    // Any correct answer immediately masters the card
    isMastered = true;
  }
  // Note: If incorrect, card stays in queue and will come back after 3 positions
  // These are kept for logging purposes, even if not directly used for isMastered calculation
  const totalAttempts = newCorrectCount + newIncorrectCount;
  const successRate = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0;

  // Update card data
  const updatedCard: CardReview = {
    ...card,
    correctCount: newCorrectCount,
    incorrectCount: newIncorrectCount,
    level: newLevel,
    isMastered,
    lastReviewed: new Date(),
  };

  const newCardData = new Map(state.cardData);
  newCardData.set(flashcardId, updatedCard);

  const newCompletedCards = new Set(state.completedCards);

  // Queue insertion logic
  if (isMastered) {
    // Card is mastered: don't put it back in the queue
    newCompletedCards.add(flashcardId);
    console.log('[recordAnswer] ✅ Card mastered:', {
      flashcardId,
      correctCount: newCorrectCount,
      incorrectCount: newIncorrectCount,
      successRate: Math.round(successRate * 100) + '%',
    });
  } else if (isCorrect) {
    // Correct but not mastered: add to end of queue
    newQueue.push(flashcardId);
    console.log('[recordAnswer] ✅ Correct, to end of queue:', {
      flashcardId,
      correctCount: newCorrectCount,
      level: newLevel,
    });
  } else {
    // Incorrect: reinsert after 3 cards (or at end if queue < 3)
    const insertPosition = Math.min(3, newQueue.length);
    newQueue.splice(insertPosition, 0, flashcardId);
    console.log('[recordAnswer] ❌ Incorrect, reinserted at position', insertPosition, {
      flashcardId,
      incorrectCount: newIncorrectCount,
      level: newLevel,
    });
  }

  return {
    queue: newQueue,
    cardData: newCardData,
    completedCards: newCompletedCards,
    order: state.order,
  };
}

/**
 * Check if session is complete (queue is empty)
 */
export function isSessionComplete(state: StudySessionState): boolean {
  return state.queue.length === 0;
}

/**
 * Get progress statistics
 */
export function getProgress(state: StudySessionState) {
  const totalCards = state.cardData.size;
  const masteredCount = state.completedCards.size;
  const inProgressCount = state.queue.length;
  const progress = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  // Count cards with incorrect answers that haven't been mastered yet
  // This represents cards that need to be reviewed because of mistakes
  const incorrectCount = Array.from(state.cardData.values())
    .filter(card => 
      card.incorrectCount > 0 && 
      !state.completedCards.has(card.flashcardId)
    ).length;

  // Check if there are cards that haven't been mastered yet
  // A card needs review if it's in the queue OR if it exists in cardData but isn't in completedCards
  const unmasteredCards = Array.from(state.cardData.values())
    .filter(card => !state.completedCards.has(card.flashcardId));
  const needsReview = unmasteredCards.length > 0;

  return {
    totalCards,
    masteredCount,
    incorrectCount, // Number of cards with incorrect answers that need review
    inProgressCount,
    progress: Math.round(progress),
    needsReview,
  };
}

/**
 * Migration function: Convert old session state to new format
 * Used for loading saved sessions from database
 */
export function migrateOldSessionState(oldState: any): StudySessionState {
  console.log('[migrate] Converting old session state to new format');

  // Handle old format with cards array
  if (oldState.cards && Array.isArray(oldState.cards)) {
    const cards = oldState.cards;
    const queue: string[] = [];
    const cardData = new Map<string, CardReview>();
    const completedCards = new Set<string>();

    cards.forEach((card: any) => {
      const cardReview: CardReview = {
        flashcardId: card.flashcardId,
        front: card.front,
        back: card.back,
        correctCount: card.correctCount || 0,
        incorrectCount: card.incorrectCount || 0,
        isMastered: card.isMastered || false,
        level: card.level || 0,
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
        originalIndex: card.originalIndex,
      };

      cardData.set(card.flashcardId, cardReview);

      if (card.isMastered) {
        completedCards.add(card.flashcardId);
      } else {
        queue.push(card.flashcardId);
      }
    });

    // Restore incorrect cards to queue if they exist
    if (oldState.incorrectCards && Array.isArray(oldState.incorrectCards)) {
      oldState.incorrectCards.forEach((cardId: string) => {
        if (!queue.includes(cardId) && !completedCards.has(cardId)) {
          queue.unshift(cardId); // Add to front of queue
        }
      });
    }

    console.log('[migrate] Migration complete:', {
      totalCards: cardData.size,
      queueLength: queue.length,
      completedCount: completedCards.size,
    });

    return {
      queue,
      cardData,
      completedCards,
      order: oldState.order || cards.map((c: any) => c.flashcardId),
    };
  }

  // Check if it's already in new format (has queue, cardData arrays)
  if (oldState.queue && oldState.cardData) {
    console.log('[migrate] State is in new format, deserializing');
    return deserializeState(oldState);
  }

  // Unknown format - try to deserialize anyway
  console.log('[migrate] Unknown format, attempting deserialization');
  try {
    return deserializeState(oldState);
  } catch (error) {
    console.error('[migrate] Failed to deserialize state:', error);
    // Return a minimal valid state as fallback
    return {
      queue: [],
      cardData: new Map(),
      completedCards: new Set(),
      order: [],
    };
  }
}

/**
 * Serialize state for database storage
 * Converts Map and Set to JSON-compatible format
 */
export function serializeState(state: StudySessionState): any {
  return {
    queue: state.queue,
    cardData: Array.from(state.cardData.entries()).map(([id, card]) => ({
      id,
      ...card,
      lastReviewed: card.lastReviewed?.toISOString(),
    })),
    completedCards: Array.from(state.completedCards),
    order: state.order,
  };
}

/**
 * Deserialize state from database
 * Converts JSON format back to Map and Set
 */
export function deserializeState(data: any): StudySessionState {
  const cardData = new Map<string, CardReview>();

  if (data.cardData && Array.isArray(data.cardData)) {
    data.cardData.forEach((item: any) => {
      const { id, ...card } = item;
      cardData.set(id, {
        ...card,
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      });
    });
  }

  // ✅ FIX: Handle completedCards in all possible formats
  let completedCardsSet = new Set<string>();

  if (data.completedCards) {
    if (Array.isArray(data.completedCards)) {
      // Already an array
      completedCardsSet = new Set(data.completedCards);
    } else if (data.completedCards instanceof Set) {
      // Already a Set
      completedCardsSet = data.completedCards;
    } else if (typeof data.completedCards === 'object') {
      // Object format (from old serialization) - convert to array
      completedCardsSet = new Set(Object.values(data.completedCards));
    }
  }

  return {
    queue: data.queue || [],
    cardData,
    completedCards: completedCardsSet,
    order: data.order || [],
  };
}
