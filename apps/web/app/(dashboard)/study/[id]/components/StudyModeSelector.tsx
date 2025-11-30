'use client';

import { Button } from '@/components/ui/Button';
import { BookOpen, FileText, Zap, List } from 'lucide-react';

type StudyMode = 'flashcard' | 'quiz' | 'writing' | 'match';

interface StudyModeSelectorProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export function StudyModeSelector({ currentMode, onModeChange }: StudyModeSelectorProps) {
  const modes: { id: StudyMode; label: string; icon: any; description: string }[] = [
    {
      id: 'flashcard',
      label: 'Flashcards',
      icon: BookOpen,
      description: 'Flip through cards',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: FileText,
      description: 'Multiple choice',
    },
    {
      id: 'writing',
      label: 'Writing',
      icon: Zap,
      description: 'Type the answer',
    },
    {
      id: 'match',
      label: 'Match',
      icon: List,
      description: 'Match terms',
    },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-white mb-3">Study Mode</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left text-white
                ${isActive 
                  ? 'border-brand-primary bg-[rgba(96,165,250,0.1)]' 
                  : 'border-[rgba(255,255,255,0.12)] bg-dark-background-cardMuted hover:border-[rgba(255,255,255,0.18)] text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 mb-2 ${isActive ? 'text-brand-primary' : 'text-white'}`} />
              <div className="font-semibold text-sm text-white">{mode.label}</div>
              <div className={`text-xs mt-1 ${isActive ? 'text-brand-primary' : 'text-white'}`}>{mode.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

