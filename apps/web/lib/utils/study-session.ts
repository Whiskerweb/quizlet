/**
 * Study Session Manager
 * Manages card review with spaced repetition and mastery system
 */

export interface CardReview {
  flashcardId: string;
  front: string;
  back: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: Date;
  isMastered: boolean;
  nextReview?: Date;
}

export interface StudySessionState {
  cards: CardReview[];
  currentIndex: number;
  masteredCards: Set<string>;
  incorrectCards: string[]; // Queue of cards to review again
  reviewInterval: number; // Number of cards before reviewing incorrect ones
}

/**
 * Initialize study session with flashcards
 */
export function initializeSession(flashcards: Array<{ id: string; front: string; back: string }>): StudySessionState {
  const cards: CardReview[] = flashcards.map(card => ({
    flashcardId: card.id,
    front: card.front,
    back: card.back,
    correctCount: 0,
    incorrectCount: 0,
    isMastered: false,
  }));

  return {
    cards,
    currentIndex: 0,
    masteredCards: new Set(),
    incorrectCards: [],
    reviewInterval: 3, // Review incorrect cards every 3 cards
  };
}

/**
 * Record answer and update card state
 */
export function recordAnswer(
  state: StudySessionState,
  flashcardId: string,
  isCorrect: boolean
): StudySessionState {
  const cardIndex = state.cards.findIndex(c => c.flashcardId === flashcardId);
  if (cardIndex === -1) return state;

  const card = state.cards[cardIndex];
  const updatedCard: CardReview = {
    ...card,
    lastReviewed: new Date(),
    correctCount: isCorrect ? card.correctCount + 1 : card.correctCount,
    incorrectCount: isCorrect ? card.incorrectCount : card.incorrectCount + 1,
    isMastered: isCorrect && card.correctCount >= 1, // Mastered if answered correctly at least once
  };

  const newCards = [...state.cards];
  newCards[cardIndex] = updatedCard;

  let newMasteredCards = new Set(state.masteredCards);
  if (updatedCard.isMastered) {
    newMasteredCards.add(flashcardId);
  } else {
    newMasteredCards.delete(flashcardId);
  }

  // Add to incorrect queue if wrong
  let newIncorrectCards = [...state.incorrectCards];
  if (!isCorrect && !newIncorrectCards.includes(flashcardId)) {
    newIncorrectCards.push(flashcardId);
  }

  return {
    ...state,
    cards: newCards,
    masteredCards: newMasteredCards,
    incorrectCards: newIncorrectCards,
  };
}

/**
 * Get next card to review
 * Prioritizes incorrect cards that need review
 */
export function getNextCard(state: StudySessionState): CardReview | null {
  // First, check if we have unmastered cards that need review
  const unmasteredCards = state.cards.filter(c => !c.isMastered);
  
  if (unmasteredCards.length === 0) {
    return null; // All cards mastered
  }

  // If we have incorrect cards in queue and we've reviewed enough new cards
  if (state.incorrectCards.length > 0 && state.currentIndex >= state.reviewInterval && state.currentIndex % state.reviewInterval === 0) {
    const nextIncorrectId = state.incorrectCards[0];
    const card = state.cards.find(c => c.flashcardId === nextIncorrectId);
    if (card && !card.isMastered) {
      return card;
    }
  }

  // Otherwise, get next unmastered card in sequence
  // Cycle through unmastered cards
  const unmasteredIndex = state.currentIndex % unmasteredCards.length;
  return unmasteredCards[unmasteredIndex];
}

/**
 * Move to next card
 */
export function moveToNext(state: StudySessionState): StudySessionState {
  // If we just reviewed an incorrect card from the queue, rotate it to the end
  if (state.incorrectCards.length > 0 && state.currentIndex >= state.reviewInterval && state.currentIndex % state.reviewInterval === 0) {
    const newIncorrectCards = [...state.incorrectCards.slice(1), state.incorrectCards[0]];
    return {
      ...state,
      incorrectCards: newIncorrectCards,
      currentIndex: state.currentIndex + 1,
    };
  }

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
  };
}

/**
 * Check if session is complete (all cards mastered)
 */
export function isSessionComplete(state: StudySessionState): boolean {
  return state.cards.every(card => card.isMastered);
}

/**
 * Get progress statistics
 */
export function getProgress(state: StudySessionState) {
  const totalCards = state.cards.length;
  const masteredCount = state.masteredCards.size;
  const incorrectCount = state.incorrectCards.length;
  const progress = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  return {
    totalCards,
    masteredCount,
    incorrectCount,
    progress: Math.round(progress),
    needsReview: incorrectCount > 0,
  };
}

