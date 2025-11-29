'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle } from 'lucide-react';

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

  useEffect(() => {
    // Generate multiple choice options
    const generateOptions = () => {
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
    };

    generateOptions();
  }, [flashcard, allFlashcards]);

  const handleSelect = (option: string) => {
    if (showResult) return;
    
    setSelectedAnswer(option);
    setShowResult(true);
    
    const isCorrect = option === flashcard.back;
    const timeSpent = Date.now() - startTime;
    
    // Auto-advance after showing result
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-sm text-gray-700 mb-2 font-medium">Question</p>
        <p className="text-2xl font-bold text-gray-900">{flashcard.front}</p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === flashcard.back;
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
            {selectedAnswer === flashcard.back 
              ? '✓ Correct!' 
              : `✗ Incorrect. The correct answer is: ${flashcard.back}`
            }
          </p>
        </div>
      )}
    </div>
  );
}

