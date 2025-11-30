'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FormattedText } from '@/components/FormattedText';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface MatchModeProps {
  flashcards: Flashcard[];
  onComplete: (correctCount: number, totalTime: number) => void;
}

const BATCH_SIZE = 5;

export function MatchMode({ flashcards, onComplete }: MatchModeProps) {
  const [selectedFront, setSelectedFront] = useState<string | null>(null);
  const [selectedBack, setSelectedBack] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Shuffle all flashcards
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setAllFlashcards(shuffled);
    // Reset matched pairs when flashcards change
    setMatchedPairs(new Set());
    setCurrentBatch(0);
  }, [flashcards]);

  // Get current batch of cards (5 at a time)
  const getCurrentBatch = () => {
    const start = currentBatch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allFlashcards.length);
    
    // Get 5 complete flashcards for this batch
    const batchCards = allFlashcards.slice(start, end);
    
    // Extract fronts and backs from these 5 cards
    const batchFronts = batchCards.map(card => ({
      id: card.id,
      front: card.front,
    }));
    
    const batchBacks = batchCards.map(card => ({
      id: card.id,
      text: card.back,
    }));
    
    // Shuffle fronts and backs separately (but they're from the same 5 cards)
    const shuffledFronts = [...batchFronts].sort(() => Math.random() - 0.5);
    const shuffledBacks = [...batchBacks].sort(() => Math.random() - 0.5);
    
    return { 
      batchFronts: shuffledFronts, 
      batchBacks: shuffledBacks, 
      hasMore: end < allFlashcards.length 
    };
  };

  const { batchFronts, batchBacks, hasMore } = getCurrentBatch();
  
  // Check if current batch is complete
  const isBatchComplete = () => {
    return batchFronts.every(card => matchedPairs.has(card.id));
  };

  const handleSelect = (type: 'front' | 'back', id: string, text: string) => {
    if (matchedPairs.has(id)) return; // Already matched

    if (type === 'front') {
      if (selectedFront === id) {
        setSelectedFront(null);
      } else {
        setSelectedFront(id);
        if (selectedBack) {
          checkMatch(id, selectedBack);
        }
      }
    } else {
      if (selectedBack === id) {
        setSelectedBack(null);
      } else {
        setSelectedBack(id);
        if (selectedFront) {
          checkMatch(selectedFront, id);
        }
      }
    }
  };

  const checkMatch = (frontId: string, backId: string) => {
    // Check if front and back belong to the same flashcard
    if (frontId === backId) {
      // Correct match
      const newMatched = new Set([...matchedPairs, frontId]);
      setMatchedPairs(newMatched);
      setSelectedFront(null);
      setSelectedBack(null);

      // Check if current batch is complete
      setTimeout(() => {
        if (isBatchComplete()) {
          // If there are more batches, move to next
          if (hasMore) {
            setCurrentBatch(currentBatch + 1);
            setSelectedFront(null);
            setSelectedBack(null);
            setMatchedPairs(new Set()); // Reset for new batch
          } else {
            // All flashcards matched
            const totalTime = Date.now() - startTime;
            onComplete(allFlashcards.length, totalTime);
          }
        }
      }, 500);
    } else {
      // Wrong match - reset selection after a delay
      setTimeout(() => {
        setSelectedFront(null);
        setSelectedBack(null);
      }, 500);
    }
  };

  const isMatched = (id: string) => matchedPairs.has(id);
  const isSelected = (id: string, type: 'front' | 'back') => {
    return type === 'front' ? selectedFront === id : selectedBack === id;
  };

  // Count matched in current batch
  const matchedInBatch = batchFronts.filter(card => matchedPairs.has(card.id)).length;

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-900 font-medium">
            Match each term with its definition
          </p>
          <p className="text-sm text-gray-600">
            Batch {currentBatch + 1} of {Math.ceil(allFlashcards.length / BATCH_SIZE)} • {matchedPairs.size}/{batchFronts.length} in this batch
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${(matchedPairs.size / batchFronts.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Current batch: {matchedInBatch}/{batchFronts.length} matched
        </p>
      </div>

      {isBatchComplete() && hasMore && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-900 font-semibold mb-2">Batch complete! Moving to next batch...</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Fronts (Terms) */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Terms</h3>
          <div className="space-y-2">
            {batchFronts.map((card) => {
              const matched = isMatched(card.id);
              const selected = isSelected(card.id, 'front');

              return (
                <button
                  key={card.id}
                  onClick={() => handleSelect('front', card.id, card.front)}
                  disabled={matched}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all text-gray-900
                    ${matched
                      ? 'border-green-500 bg-green-50 opacity-60'
                      : selected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${matched ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <FormattedText text={card.front} className="font-medium text-gray-900" as="span" />
                    {matched && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Backs (Definitions) */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Definitions</h3>
          <div className="space-y-2">
            {batchBacks.map((back) => {
              const matched = isMatched(back.id);
              const selected = isSelected(back.id, 'back');

              return (
                <button
                  key={back.id}
                  onClick={() => handleSelect('back', back.id, back.text)}
                  disabled={matched}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all text-gray-900
                    ${matched
                      ? 'border-green-500 bg-green-50 opacity-60'
                      : selected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${matched ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <FormattedText text={back.text} className="font-medium text-gray-900" as="span" />
                    {matched && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

