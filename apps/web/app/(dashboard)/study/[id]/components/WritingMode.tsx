'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormattedText } from '@/components/FormattedText';
import { CheckCircle2, XCircle, Check, RotateCcw } from 'lucide-react';
import { isSimilarEnough, getSimilarityFeedback } from '@/lib/utils/text-similarity';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface WritingModeProps {
  flashcard: Flashcard;
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
}

export function WritingMode({ flashcard, onAnswer }: WritingModeProps) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [isReversed, setIsReversed] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;

    // In reversed mode: compare with front, in normal mode: compare with back
    const correctAnswer = isReversed ? flashcard.front : flashcard.back;
    
    // Check if answer is similar enough (>= 90%)
    const correct = isSimilarEnough(answer, correctAnswer, 90);
    const feedback = getSimilarityFeedback(answer, correctAnswer);
    
    setIsCorrect(correct);
    setSimilarity(feedback.similarity);
    setShowResult(true);

    // Only auto-advance if correct
    if (correct) {
      const timeSpent = Date.now() - startTime;
      setTimeout(() => {
        onAnswer(true, timeSpent);
        setAnswer('');
        setShowResult(false);
        setSimilarity(null);
      }, 2500);
    }
  };

  const handleMarkAsCorrect = () => {
    const timeSpent = Date.now() - startTime;
    onAnswer(true, timeSpent);
    setAnswer('');
    setShowResult(false);
    setSimilarity(null);
  };

  const handleContinue = () => {
    const timeSpent = Date.now() - startTime;
    onAnswer(false, timeSpent);
    setAnswer('');
    setShowResult(false);
    setSimilarity(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmit();
    }
  };

  // Determine question and correct answer based on mode
  const questionText = isReversed ? flashcard.back : flashcard.front;
  const questionLabel = isReversed ? 'Description' : 'Question';
  const correctAnswerText = isReversed ? flashcard.front : flashcard.back;

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-content-subtle">{questionLabel}</p>
          <button
            onClick={() => {
              setIsReversed(!isReversed);
              setAnswer('');
              setShowResult(false);
              setSimilarity(null);
            }}
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-content-emphasis transition-colors hover:bg-bg-muted/70"
            title={isReversed ? 'Mode normal: Question → Réponse' : 'Mode inversé: Description → Terme'}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isReversed ? 'Mode inversé' : 'Mode normal'}</span>
          </button>
        </div>
        <FormattedText text={questionText} className="text-2xl font-bold text-content-emphasis" as="p" />
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          disabled={showResult}
          className="text-lg text-content-emphasis"
          autoFocus
        />

        {showResult && (
          <div className={`
            p-4 rounded-lg border-2
            ${isCorrect 
              ? 'border-green-500 bg-green-50 text-gray-900' 
              : 'border-red-500 bg-red-50 text-gray-900'
            }
          `}>
            <div className="flex items-center space-x-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Incorrect</span>
                </>
              )}
            </div>
            {similarity !== null && (
              <div className="mt-2">
                <p className="text-sm text-gray-700 mb-1">
                  Similarity: <span className="font-semibold">{similarity.toFixed(1)}%</span>
                </p>
                {!isCorrect && (
                  <>
                    <p className="text-sm text-gray-700 mb-1">Correct answer:</p>
                    <FormattedText text={correctAnswerText} className="font-semibold text-gray-900" as="p" />
                    <p className="text-xs text-gray-600 mt-2">
                      You need at least 90% similarity to pass.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!showResult ? (
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="w-full"
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-2">
            {isCorrect ? (
              <Button
                onClick={handleContinue}
                className="w-full"
              >
                Continue
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  Accepter l'erreur et continuer
                </Button>
                <Button
                  onClick={handleMarkAsCorrect}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marquer comme correct
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

