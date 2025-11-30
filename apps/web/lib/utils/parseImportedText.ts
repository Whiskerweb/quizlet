export interface ParsedCard {
  term: string;
  definition: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  errors: string[];
}

/**
 * Parse imported text into flashcards
 * @param text - The text to parse
 * @param termSeparator - Separator between term and definition (tab, comma, or custom)
 * @param cardSeparator - Separator between cards (newline, semicolon, or custom)
 * @returns Object with parsed cards and errors
 */
export function parseImportedText(
  text: string,
  termSeparator: string,
  cardSeparator: string
): ParseResult {
  const cards: ParsedCard[] = [];
  const errors: string[] = [];

  if (!text.trim()) {
    return { cards, errors };
  }

  // Normalize separators
  let actualTermSeparator: string;
  if (termSeparator === 'Tab') {
    actualTermSeparator = '\t';
  } else if (termSeparator === 'Virgule') {
    actualTermSeparator = ',';
  } else {
    actualTermSeparator = termSeparator;
  }

  let actualCardSeparator: string;
  if (cardSeparator === 'Nouvelle ligne') {
    actualCardSeparator = '\n';
  } else if (cardSeparator === 'Point-virgule') {
    actualCardSeparator = ';';
  } else {
    actualCardSeparator = cardSeparator;
  }

  // Split cards by card separator
  const cardLines = text.split(actualCardSeparator);

  cardLines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      return;
    }

    // Split by term separator
    const parts = trimmedLine.split(actualTermSeparator);

    // Clean each part: trim and remove double spaces
    const cleanedParts = parts.map(part => 
      part.trim().replace(/\s+/g, ' ')
    );

    // Must have exactly 2 parts
    if (cleanedParts.length !== 2) {
      errors.push(`Ligne ${index + 1}: Format invalide (${cleanedParts.length} colonnes au lieu de 2)`);
      return;
    }

    const [term, definition] = cleanedParts;

    // Both term and definition must be non-empty
    if (!term || !definition) {
      errors.push(`Ligne ${index + 1}: Terme ou définition vide`);
      return;
    }

    cards.push({ term, definition });
  });

  return { cards, errors };
}


