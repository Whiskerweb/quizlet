'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studyService } from '@/lib/supabase/study';
import { Play, X, Clock, RotateCw, Shuffle, Hash, Trash2, RefreshCw } from 'lucide-react';

interface ActiveSession {
  id: string;
  mode: string;
  started_at: string;
  shuffle?: boolean;
  start_from?: number;
  total_cards: number;
  session_state?: any;
  sets?: {
    id: string;
    title: string;
  };
}

export function ActiveSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const data = await studyService.getActiveSessions();
      setSessions(data || []);
    } catch (error: any) {
      console.warn('[ActiveSessions] Could not load sessions:', error);
      setHasError(true);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = (session: ActiveSession) => {
    // Navigate to study page with session ID in URL
    router.push(`/study/${session.sets?.id}?resume=${session.id}`);
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!confirm('Voulez-vous vraiment terminer cette session ? Cette action est irréversible.')) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      await studyService.completeSession(sessionId);
      // Reload sessions after deletion
      await loadActiveSessions();
    } catch (error) {
      console.error('[ActiveSessions] Failed to complete session:', error);
      alert('Impossible de terminer la session. Veuillez réessayer.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleCompleteAllSessions = async () => {
    if (!confirm(`Voulez-vous vraiment terminer TOUTES les ${sessions.length} sessions en cours ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setIsDeletingAll(true);
      // Complete all sessions in parallel
      await Promise.all(
        sessions.map(session => studyService.completeSession(session.id))
      );
      // Reload sessions after deletion
      await loadActiveSessions();
      alert(`${sessions.length} session(s) terminée(s) avec succès !`);
    } catch (error) {
      console.error('[ActiveSessions] Failed to complete all sessions:', error);
      alert('Impossible de terminer toutes les sessions. Certaines peuvent avoir été supprimées.');
      // Reload anyway to refresh the list
      await loadActiveSessions();
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActiveSessions();
    setIsRefreshing(false);
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      flashcard: 'Flashcards',
      quiz: 'Quiz',
      writing: 'Écriture',
      match: 'Association',
    };
    return labels[mode] || mode;
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      flashcard: 'bg-blue-500',
      quiz: 'bg-purple-500',
      writing: 'bg-green-500',
      match: 'bg-orange-500',
    };
    return colors[mode] || 'bg-gray-500';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const getMasteredCount = (sessionState: any) => {
    if (!sessionState) return 0;

    // ✅ FIX: The field is 'completedCards', not 'masteredCards'
    const completedCards = sessionState.completedCards;

    if (!completedCards) return 0;
    if (Array.isArray(completedCards)) return completedCards.length;
    if (typeof completedCards === 'object' && completedCards.size !== undefined) return completedCards.size;
    return 0;
  };

  const getAnsweredCount = (sessionState: any) => {
    if (!sessionState) return 0;

    // Count cards with at least one answer (correct or incorrect)
    if (sessionState.cardData) {
      const cards = Array.isArray(sessionState.cardData)
        ? sessionState.cardData
        : Array.from(Object.values(sessionState.cardData));

      return cards.filter((c: any) => (c.correctCount > 0 || c.incorrectCount > 0)).length;
    }

    // Fallback: if completedCards exists
    if (sessionState.completedCards) {
      return sessionState.completedCards.length || sessionState.completedCards.size || 0;
    }

    return 0;
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-bg-subtle rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-bg-subtle rounded"></div>
          <div className="h-20 bg-bg-subtle rounded"></div>
        </div>
      </Card>
    );
  }

  // If there's an error (likely migration not run), show a helpful message
  if (hasError) {
    return (
      <Card className="p-6 border-orange-500/30 bg-orange-50/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10">
            <RotateCw className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-content-emphasis">
              Sessions en cours
            </h2>
          </div>
        </div>
        <p className="text-[13px] text-content-muted mb-3">
          La fonctionnalité de reprise de session nécessite une migration de la base de données.
        </p>
        <details className="text-[12px] text-content-muted">
          <summary className="cursor-pointer font-medium hover:text-content-emphasis">
            Comment activer cette fonctionnalité ?
          </summary>
          <div className="mt-2 pl-4 border-l-2 border-orange-300 space-y-1">
            <p>1. Exécutez le fichier <code className="bg-bg-subtle px-1 py-0.5 rounded">supabase/add_session_parameters.sql</code></p>
            <p>2. Rechargez la page</p>
            <p>3. Vos sessions seront automatiquement sauvegardées !</p>
          </div>
        </details>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null; // Don't show anything if no active sessions
  }

  return (
    <Card className="p-6 border-blue-500/30 bg-blue-50/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
            <RotateCw className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-content-emphasis">
              Sessions en cours
            </h2>
            <p className="text-[13px] text-content-muted">
              {sessions.length} session{sessions.length > 1 ? 's' : ''} non terminée{sessions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-content-emphasis hover:bg-bg-emphasis disabled:opacity-50"
            aria-label="Rafraîchir la liste"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCompleteAllSessions}
            disabled={isDeletingAll || sessions.length === 0}
            className="rounded-full border border-border-subtle p-2 text-content-muted transition hover:text-state-danger hover:border-state-danger disabled:opacity-50"
            aria-label="Terminer toutes les sessions"
            title="Terminer toutes les sessions"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-xl border border-border-subtle bg-bg-emphasis p-4 transition-all hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Session info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mode badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getModeColor(session.mode)}`}
                  >
                    {getModeLabel(session.mode)}
                  </span>

                  {/* Set title */}
                  <h3 className="text-[15px] font-semibold text-content-emphasis">
                    {session.sets?.title || 'Set inconnu'}
                  </h3>
                </div>

                {/* Session details */}
                <div className="flex items-center gap-4 text-[12px] text-content-muted flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getTimeAgo(session.started_at)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span>{session.total_cards} cartes</span>
                  </div>

                  {session.shuffle && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Mélangé</span>
                    </div>
                  )}

                  {session.start_from && session.start_from > 1 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Play className="h-3.5 w-3.5" />
                      <span>Carte {session.start_from}+</span>
                    </div>
                  )}
                </div>

                {/* Progress indicator (if session_state available) */}
                {session.session_state && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: `${(getMasteredCount(session.session_state) / session.total_cards) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-content-muted whitespace-nowrap">
                        {getMasteredCount(session.session_state)}/{session.total_cards}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-content-muted">
                      <span className="text-green-600 font-medium">
                        {getMasteredCount(session.session_state)} maîtrisées
                      </span>
                      <span>
                        {getAnsweredCount(session.session_state)} répondues
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResumeSession(session)}
                  className="flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  Reprendre
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCompleteSession(session.id)}
                  disabled={deletingSessionId === session.id}
                  className="flex items-center gap-1.5 hover:text-state-danger hover:border-state-danger"
                >
                  <X className="h-3.5 w-3.5" />
                  {deletingSessionId === session.id ? 'Fin...' : 'Terminer'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
