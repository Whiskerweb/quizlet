/**
 * Text Similarity Utilities
 * Calculate similarity between two strings using various algorithms
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()\[\]{}'"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n');
}

/**
 * Calculate similarity percentage between two strings
 * Returns a value between 0 and 100
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  // If both are empty, return 100%
  if (normalized1.length === 0 && normalized2.length === 0) {
    return 100;
  }

  // If one is empty, return 0%
  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  // Calculate similarity percentage
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if two texts are similar enough (>= threshold)
 */
export function isSimilarEnough(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 90
): boolean {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  return similarity >= threshold;
}

/**
 * Get similarity feedback message
 */
export function getSimilarityFeedback(
  userAnswer: string,
  correctAnswer: string
): { similarity: number; message: string } {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  let message = '';
  if (similarity >= 90) {
    message = 'Excellent! Your answer is very close.';
  } else if (similarity >= 70) {
    message = 'Close! Try to be more precise.';
  } else if (similarity >= 50) {
    message = 'Not quite right. Review the answer.';
  } else {
    message = 'Incorrect. Please try again.';
  }

  return { similarity, message };
}

