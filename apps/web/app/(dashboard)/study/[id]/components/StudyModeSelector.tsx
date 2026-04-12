'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ChevronDown } from 'lucide-react';

type StudyMode = 'flashcard' | 'quiz' | 'writing' | 'match';

interface StudyModeSelectorProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  incorrectCount?: number;
}

export function StudyModeSelector({ currentMode, onModeChange, incorrectCount }: StudyModeSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modes: { id: StudyMode; labelKey: string; image: string; descriptionKey: string }[] = [
    {
      id: 'flashcard',
      labelKey: 'modeFlashcard',
      image: '/images/study-modes/cardz.png',
      descriptionKey: 'modeFlashcardDescription',
    },
    {
      id: 'quiz',
      labelKey: 'modeQuiz',
      image: '/images/study-modes/quiz.png',
      descriptionKey: 'modeQuizDescription',
    },
    {
      id: 'writing',
      labelKey: 'modeWriting',
      image: '/images/study-modes/writing.png',
      descriptionKey: 'modeWritingDescription',
    },
    {
      id: 'match',
      labelKey: 'modeMatch',
      image: '/images/study-modes/match.png',
      descriptionKey: 'modeMatchDescription',
    },
  ];
  
  const modesWithLabels = modes.map(mode => ({
    ...mode,
    label: t(mode.labelKey as any),
    description: t(mode.descriptionKey as any),
  }));

  const currentModeData = modesWithLabels.find(m => m.id === currentMode) || modesWithLabels[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-border-subtle bg-bg-emphasis px-3 py-2 text-sm font-medium text-content-emphasis transition-colors hover:bg-bg-muted/80"
      >
        <Image
          src={currentModeData.image}
          alt={currentModeData.label}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <span>{currentModeData.label}</span>
        {incorrectCount !== undefined && incorrectCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-semibold">
            {incorrectCount}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border border-border-subtle bg-bg-emphasis shadow-lg z-50">
          <div className="p-2">
            {modesWithLabels.map((mode) => {
              const isActive = currentMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`
                    flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors
                    ${isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-content-muted hover:bg-bg-muted/70 hover:text-content-emphasis'
                    }
                  `}
                >
                  <Image
                    src={mode.image}
                    alt={mode.label}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{mode.label}</div>
                    <div className="text-xs text-content-subtle">{mode.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

