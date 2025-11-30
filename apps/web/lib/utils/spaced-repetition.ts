/**
 * Spaced Repetition Algorithm (SM-2)
 * Based on SuperMemo 2 algorithm
 */

export interface CardProgress {
  flashcardId: string;
  easeFactor: number; // Default 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReview: Date; // Next review date
  lastReview?: Date;
}

export interface ReviewResult {
  quality: number; // 0-5 (0: complete blackout, 5: perfect response)
  newInterval: number;
  newEaseFactor: number;
  newRepetitions: number;
  nextReview: Date;
}

/**
 * Calculate next review based on SM-2 algorithm
 */
export function calculateNextReview(
  progress: CardProgress,
  quality: number // 0-5
): ReviewResult {
  let { easeFactor, interval, repetitions } = progress;

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Minimum ease factor is 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Update repetitions and interval based on quality
  if (quality < 3) {
    // Failed - restart
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    quality,
    newInterval: interval,
    newEaseFactor: easeFactor,
    newRepetitions: repetitions,
    nextReview,
  };
}

/**
 * Convert answer quality to SM-2 quality score
 */
export function answerToQuality(isCorrect: boolean, timeSpent?: number): number {
  if (!isCorrect) {
    return 0; // Complete failure
  }

  // If answered quickly (less than 3 seconds), it's easier (quality 5)
  // If answered slowly (more than 10 seconds), it's harder (quality 3)
  if (timeSpent) {
    const seconds = timeSpent / 1000;
    if (seconds < 3) return 5;
    if (seconds < 6) return 4;
    if (seconds < 10) return 3;
    return 3;
  }

  return 4; // Default for correct answer without timing
}

/**
 * Initialize card progress
 */
export function initializeCardProgress(flashcardId: string): CardProgress {
  return {
    flashcardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
  };
}





