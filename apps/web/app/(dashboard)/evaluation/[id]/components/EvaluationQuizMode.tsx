'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FormattedText } from '@/components/FormattedText';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface EvaluationQuizModeProps {
  flashcard: Flashcard;
  allFlashcards: Flashcard[];
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
  questionTimeLimit?: number; // Durée max en secondes
}

export function EvaluationQuizMode({ flashcard, allFlashcards, onAnswer, questionTimeLimit }: EvaluationQuizModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(questionTimeLimit || null);
  const [isReversed, setIsReversed] = useState(false);

  useEffect(() => {
    // Generate multiple choice options
    const generateOptions = () => {
      if (isReversed) {
        // Reversed mode: description (back) as question, titles (front) as options
        const wrongTitles = allFlashcards
          .filter(card => card.id !== flashcard.id)
          .map(card => card.front)
          .sort(() => Math.random() - 0.5);

        const neededWrong = Math.min(3, wrongTitles.length);
        const selectedWrong = wrongTitles.slice(0, neededWrong);
        const allOptions = [flashcard.front, ...selectedWrong].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      } else {
        // Normal mode: term (front) as question, definitions (back) as options
        const wrongAnswers = allFlashcards
          .filter(card => card.id !== flashcard.id)
          .map(card => card.back)
          .sort(() => Math.random() - 0.5);

        const neededWrong = Math.min(3, wrongAnswers.length);
        const selectedWrong = wrongAnswers.slice(0, neededWrong);
        const allOptions = [flashcard.back, ...selectedWrong].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      }
    };

    generateOptions();
    setSelectedAnswer(null);
    setTimeRemaining(questionTimeLimit || null);
  }, [flashcard, allFlashcards, isReversed, questionTimeLimit]);

  // Timer pour la durée max par question
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Temps écoulé, réponse automatique (incorrecte)
          const timeSpent = Date.now() - startTime;
          onAnswer(false, timeSpent); // Réponse incorrecte par défaut
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, selectedAnswer, startTime, onAnswer]);

  const handleSelect = (option: string) => {
    if (selectedAnswer !== null) return; // Déjà répondu
    
    setSelectedAnswer(option);
    
    // Vérifier si la réponse est correcte
    const isCorrect = isReversed 
      ? option === flashcard.front
      : option === flashcard.back;
    
    const timeSpent = Date.now() - startTime;
    
    // En mode évaluation : pas de retour visuel, on continue directement
    // Petit délai pour la transition
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
      setSelectedAnswer(null);
    }, 300);
  };

  const questionText = isReversed ? flashcard.back : flashcard.front;
  const questionLabel = isReversed ? 'Description' : 'Question';

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-content-muted">{questionLabel}</p>
              {timeRemaining !== null && timeRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                  <span>⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
            <FormattedText text={questionText} className="text-2xl font-bold text-content-emphasis" as="p" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={selectedAnswer !== null || (timeRemaining !== null && timeRemaining <= 0)}
              className={`
                w-full rounded-lg border-2 p-4 text-left transition-all
                ${isSelected
                  ? 'border-brand-primary bg-brand-primary/10 text-content-emphasis'
                  : 'border-border-subtle bg-bg-subtle text-content-emphasis hover:border-border-emphasis'
                }
                ${selectedAnswer !== null || (timeRemaining !== null && timeRemaining <= 0) ? 'cursor-default opacity-60' : 'cursor-pointer'}
              `}
            >
              <FormattedText
                text={option}
                className="font-medium text-content-emphasis"
                as="span"
              />
            </button>
          );
        })}
      </div>

      {timeRemaining !== null && timeRemaining <= 0 && selectedAnswer === null && (
        <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm text-orange-900">
            Temps écoulé. Passage à la question suivante...
          </p>
        </div>
      )}
    </div>
  );
}

