'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Shuffle, Play, ArrowLeft, RotateCw } from 'lucide-react';
import { studyService } from '@/lib/supabase/study';

interface StudySettingsProps {
  totalCards: number;
  setId: string;
  mode: 'flashcard' | 'quiz' | 'writing' | 'match';
  onStart: (options: { shuffle: boolean; startFrom: number; forceNew?: boolean }) => void;
  onResume?: (sessionId: string) => void;
  onCancel: () => void;
}

interface ActiveSession {
  id: string;
  mode: string;
  started_at: string;
  shuffle: boolean;
  start_from: number;
  total_cards: number;
  session_state?: any;
}

export function StudySettings({ totalCards, setId, mode, onStart, onResume, onCancel }: StudySettingsProps) {
  const [shuffle, setShuffle] = useState(false);
  const [startFrom, setStartFrom] = useState(1);
  const [useStartFrom, setUseStartFrom] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    loadActiveSessions();
  }, [setId]);

  const loadActiveSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const sessions = await studyService.getActiveSessions(setId);
      setActiveSessions(sessions || []);
    } catch (error) {
      console.warn('[StudySettings] Could not load active sessions (migration may not be applied):', error);
      // Silently fail - this feature requires DB migration
      setActiveSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Check if there's an active session for the current mode
  const sessionForCurrentMode = activeSessions.find(s => s.mode === mode);

  const handleStart = async () => {
    // If there's an active session for this mode, inform the user
    if (sessionForCurrentMode) {
      const currentProgress = sessionForCurrentMode.session_state?.currentIndex || 0;
      const totalCards = sessionForCurrentMode.total_cards || 0;
      const progressPercent = totalCards > 0 ? Math.round((currentProgress / totalCards) * 100) : 0;
      
      const confirmMessage = 
        `⚠️ Une session ${mode} est déjà en cours pour ce set.\n\n` +
        `Progression actuelle : ${currentProgress}/${totalCards} cartes (${progressPercent}%)\n\n` +
        `Que voulez-vous faire ?\n\n` +
        `• OK = REPRENDRE cette session (recommandé)\n` +
        `• Annuler = Je vais choisir autre chose`;
      
      if (confirm(confirmMessage)) {
        // User wants to resume
        console.log('[StudySettings] User chose to resume existing session:', sessionForCurrentMode.id);
        handleResume(sessionForCurrentMode.id);
        return;
      }
      
      // User cancelled - ask what they want to do
      const replaceMessage = 
        `Voulez-vous TERMINER l'ancienne session et en créer une nouvelle ?\n\n` +
        `• OK = Terminer l'ancienne et créer une nouvelle\n` +
        `• Annuler = Garder les deux sessions (doublon)`;
      
      if (confirm(replaceMessage)) {
        // Terminate the old session first
        try {
          console.log('[StudySettings] Terminating old session before creating new one');
          await studyService.completeSession(sessionForCurrentMode.id);
          await loadActiveSessions(); // Refresh the list
        } catch (error) {
          console.error('[StudySettings] Failed to terminate old session:', error);
        }
      }
      
      console.log('[StudySettings] Creating a new session');
    }
    
    onStart({
      shuffle,
      startFrom: useStartFrom ? startFrom : 1,
      forceNew: !!sessionForCurrentMode, // Force new if there was a conflict
    });
  };

  const handleResume = (sessionId: string) => {
    if (onResume) {
      onResume(sessionId);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-default p-4">
      <Card className="w-full max-w-lg space-y-6 rounded-3xl p-6 sm:p-8">
        <div>
          <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Préparation</p>
          <h2 className="text-2xl font-semibold text-content-emphasis">Personnalisez votre session</h2>
          <p className="text-sm text-content-muted">
            {totalCards} cartes disponibles. Choisissez l'ordre et le point de départ de votre session.
          </p>
        </div>

        {/* Active sessions - Resume option */}
        {!isLoadingSessions && activeSessions.length > 0 && (
          <div className="rounded-2xl border border-blue-500 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <RotateCw className="h-5 w-5 text-blue-600" />
              <p className="text-[13px] font-semibold text-blue-900">
                Sessions en cours ({activeSessions.length})
              </p>
            </div>
            <p className="text-[12px] text-blue-800 mb-3">
              Vous avez des sessions non terminées. Reprendre une session ou en créer une nouvelle ?
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {activeSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleResume(session.id)}
                  className="w-full text-left p-3 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-content-emphasis">
                        Mode: {session.mode}
                      </p>
                      <p className="text-xs text-content-muted mt-1">
                        {session.shuffle ? 'Mélangé' : 'Ordre original'} • 
                        {session.start_from > 1 ? ` Carte ${session.start_from}+` : ' Toutes les cartes'} •
                        {' '}{session.total_cards} cartes
                      </p>
                      <p className="text-xs text-content-subtle mt-1">
                        Démarré: {new Date(session.started_at).toLocaleString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Order section */}
          <div className="rounded-2xl border border-border-subtle bg-bg-emphasis/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-content-emphasis">Ordre des cartes</p>
                <p className="text-[12px] text-content-muted">
                  Ordre original ou aléatoire. Le mélange s'applique aux cartes sélectionnées.
                </p>
              </div>
              <Shuffle className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="flex gap-2">
              <Button
                variant={shuffle ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setShuffle(true)}
              >
                Mélanger
              </Button>
              <Button
                variant={!shuffle ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setShuffle(false)}
              >
                Ordre original
              </Button>
            </div>
          </div>

          {/* Start from section */}
          <div className="rounded-2xl border border-border-subtle bg-bg-emphasis/70 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useStartFrom}
                onChange={(e) => setUseStartFrom(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border-subtle bg-bg-emphasis text-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
              <div>
                <p className="text-[13px] font-semibold text-content-emphasis">
                  Commencer à une carte précise
                </p>
                <p className="text-[12px] text-content-muted">
                  Étudiez uniquement les cartes à partir de ce numéro. Les cartes précédentes n'apparaîtront pas.
                </p>
              </div>
            </label>

            {useStartFrom && (
              <div className="space-y-2 border-t border-border-muted pt-3">
                <label className="text-[12px] text-content-subtle">
                  Carte de départ (1 – {totalCards})
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalCards}
                  value={startFrom}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(totalCards, parseInt(e.target.value) || 1));
                    setStartFrom(value);
                  }}
                  className="w-full rounded-xl border border-border-subtle bg-bg-emphasis px-4 py-2 text-content-emphasis focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-[12px] text-content-muted">
                  Vous étudierez {totalCards - startFrom + 1} carte{totalCards - startFrom + 1 > 1 ? 's' : ''} (de la carte {startFrom} à {totalCards}). 
                  {startFrom > 1 && ` Les ${startFrom - 1} premières seront ignorées.`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleStart} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Lancer
          </Button>
        </div>
      </Card>
    </div>
  );
}


