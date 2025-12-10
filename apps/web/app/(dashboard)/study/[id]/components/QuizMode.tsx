'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { triggerCorrectEffect, triggerIncorrectEffect } from '@/lib/utils/game-effects';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface QuizModeProps {
  flashcard: Flashcard;
  allFlashcards: Flashcard[];
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
}

export function QuizMode({ flashcard, allFlashcards, onAnswer }: QuizModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [isReversed, setIsReversed] = useState(false);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    // Generate multiple choice options
    const generateOptions = () => {
      if (isReversed) {
        // Reversed mode: description (back) as question, titles (front) as options
        // Get wrong titles from other flashcards
        const wrongTitles = allFlashcards
          .filter(card => card.id !== flashcard.id)
          .map(card => card.front)
          .sort(() => Math.random() - 0.5);

        const neededWrong = Math.min(3, wrongTitles.length);
        const selectedWrong = wrongTitles.slice(0, neededWrong);

        // Combine with correct title and shuffle
        const allOptions = [flashcard.front, ...selectedWrong].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      } else {
        // Normal mode: term (front) as question, definitions (back) as options
        // Get wrong answers from other flashcards
        const wrongAnswers = allFlashcards
          .filter(card => card.id !== flashcard.id)
          .map(card => card.back)
          .sort(() => Math.random() - 0.5);

        // We want at least 4 options total (1 correct + 3 wrong)
        // If we don't have enough wrong answers, we'll use fewer options
        const neededWrong = Math.min(3, wrongAnswers.length);
        const selectedWrong = wrongAnswers.slice(0, neededWrong);

        // Combine with correct answer and shuffle
        const allOptions = [flashcard.back, ...selectedWrong].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      }
    };

    generateOptions();
    setSelectedAnswer(null);
    setShowResult(false);
  }, [flashcard, allFlashcards, isReversed]);

  const handleSelect = (option: string) => {
    if (showResult) return;

    setSelectedAnswer(option);
    setShowResult(true);

    // Check if answer is correct based on mode
    const isCorrect = isReversed
      ? option === flashcard.front  // In reversed mode, correct answer is the front (title)
      : option === flashcard.back;   // In normal mode, correct answer is the back (definition)

    const timeSpent = Date.now() - startTime;

    // Trigger game effects
    const selectedElement = optionRefs.current.get(option);
    if (isCorrect) {
      triggerCorrectEffect(selectedElement);
    } else {
      triggerIncorrectEffect(selectedElement);
    }

    // Auto-advance after showing result
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  const correctAnswer = isReversed ? flashcard.front : flashcard.back;
  const questionText = isReversed ? flashcard.back : flashcard.front;
  const questionLabel = isReversed ? 'Description' : 'Question';

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-content-muted">{questionLabel}</p>
              <button
                onClick={() => setIsReversed(!isReversed)}
                className="flex items-center gap-1 sm:gap-2 rounded-lg border border-border-subtle px-2 sm:px-3 py-1.5 text-sm text-content-emphasis transition-colors hover:bg-bg-muted/70 min-h-[44px]"
                title={isReversed ? 'Mode normal: Question → Réponses' : 'Mode inversé: Description → Titres'}
                aria-label={isReversed ? 'Mode inversé' : 'Mode normal'}
              >
                <RotateCcw className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{isReversed ? 'Mode inversé' : 'Mode normal'}</span>
              </button>
            </div>
            <FormattedText text={questionText} className="text-xl sm:text-2xl font-bold text-content-emphasis" as="p" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={index}
              ref={(el) => {
                if (el) {
                  optionRefs.current.set(option, el);
                } else {
                  optionRefs.current.delete(option);
                }
              }}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`
                w-full rounded-lg border-2 p-3 sm:p-4 text-left transition-all min-h-[56px]
                ${showCorrect
                  ? 'border-green-500 bg-green-50 text-content-emphasis'
                  : showIncorrect
                    ? 'border-red-500 bg-red-50 text-content-emphasis'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 text-content-emphasis shadow-md'
                      : 'border-blue-400 bg-white text-content-emphasis hover:border-blue-500 hover:shadow-md'
                }
                ${showResult ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <FormattedText
                  text={option}
                  className={`font-medium text-sm sm:text-base ${showCorrect || showIncorrect ? 'text-content-emphasis' : 'text-content-emphasis'}`}
                  as="span"
                />
                {showCorrect && <CheckCircle2 className="h-6 w-6 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />}
                {showIncorrect && <XCircle className="h-6 w-6 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-4 p-4 rounded-lg bg-bg-subtle">
          <p className="text-sm text-content-muted">
            {selectedAnswer === correctAnswer
              ? '✓ Correct!'
              : (
                <>
                  ✗ Incorrect. The correct answer is: <FormattedText text={correctAnswer} as="span" />
                </>
              )
            }
          </p>
        </div>
      )}
    </div>
  );
}

