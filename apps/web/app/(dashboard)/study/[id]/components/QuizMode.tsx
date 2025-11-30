'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

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
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 font-medium">{questionLabel}</p>
              <button
                onClick={() => setIsReversed(!isReversed)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={isReversed ? 'Mode normal: Question → Réponses' : 'Mode inversé: Description → Titres'}
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isReversed ? 'Mode inversé' : 'Mode normal'}</span>
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900">{questionText}</p>
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
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${showCorrect 
                  ? 'border-green-500 bg-green-50 text-gray-900' 
                  : showIncorrect
                  ? 'border-red-500 bg-red-50 text-gray-900'
                  : isSelected
                  ? 'border-primary-600 bg-primary-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }
                ${showResult ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option}</span>
                {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {showIncorrect && <XCircle className="h-5 w-5 text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedAnswer === correctAnswer 
              ? '✓ Correct!' 
              : `✗ Incorrect. The correct answer is: ${correctAnswer}`
            }
          </p>
        </div>
      )}
    </div>
  );
}

