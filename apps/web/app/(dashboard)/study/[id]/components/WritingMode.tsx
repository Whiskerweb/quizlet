'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, XCircle } from 'lucide-react';
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

  const handleSubmit = () => {
    if (!answer.trim()) return;

    // Check if answer is similar enough (>= 90%)
    const correct = isSimilarEnough(answer, flashcard.back, 90);
    const feedback = getSimilarityFeedback(answer, flashcard.back);
    
    setIsCorrect(correct);
    setSimilarity(feedback.similarity);
    setShowResult(true);

    const timeSpent = Date.now() - startTime;

    setTimeout(() => {
      onAnswer(correct, timeSpent);
      setAnswer('');
      setShowResult(false);
      setSimilarity(null);
    }, 2500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Type the answer</p>
        <p className="text-2xl font-bold text-gray-900">{flashcard.front}</p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          disabled={showResult}
          className="text-lg"
          autoFocus
        />

        {showResult && (
          <div className={`
            p-4 rounded-lg border-2 text-gray-900
            ${isCorrect 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
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
                    <p className="font-semibold text-gray-900">{flashcard.back}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      You need at least 90% similarity to pass.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || showResult}
          className="w-full"
        >
          {showResult ? (isCorrect ? 'Correct!' : 'Continue') : 'Check Answer'}
        </Button>
      </div>
    </div>
  );
}

