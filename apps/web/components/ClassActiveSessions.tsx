'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studyService } from '@/lib/supabase/study';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Play, X, Clock, Shuffle, Hash } from 'lucide-react';

interface ClassActiveSession {
  id: string;
  mode: string;
  started_at: string;
  shuffle?: boolean;
  start_from?: number;
  total_cards: number;
  session_state?: {
    masteredCards: Set<string> | string[];
  };
  set_id: string;
  sets?: {
    id: string;
    title: string;
  };
}

interface ClassActiveSessionsProps {
  classId: string;
  moduleIds: string[]; // IDs des modules de la classe
}

export function ClassActiveSessions({ classId, moduleIds }: ClassActiveSessionsProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ClassActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (moduleIds.length === 0) {
      setSessions([]);
      setIsLoading(false);
      return;
    }
    loadActiveSessions();
  }, [classId, moduleIds]);

  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les sets des modules de cette classe
      const { data: setsData, error: setsError } = await supabaseBrowser
        .from('sets')
        .select('id')
        .in('folder_id', moduleIds);

      if (setsError) throw setsError;

      const setIds = (setsData || []).map((s: any) => s.id);
      if (setIds.length === 0) {
        setSessions([]);
        return;
      }

      // Récupérer toutes les sessions actives de l'utilisateur
      const allSessions = await studyService.getActiveSessions();
      
      // Filtrer pour ne garder que les sessions des sets de cette classe
      const classSessions = allSessions.filter((s: any) => 
        setIds.includes(s.set_id)
      );

      setSessions(classSessions);
    } catch (error) {
      console.error('[ClassActiveSessions] Failed to load:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = (session: ClassActiveSession) => {
    router.push(`/study/${session.set_id}?resume=${session.id}`);
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!confirm('Voulez-vous vraiment terminer cette session ?')) return;

    try {
      await studyService.completeSession(sessionId);
      await loadActiveSessions();
    } catch (error) {
      console.error('[ClassActiveSessions] Failed to complete:', error);
      alert('Impossible de terminer la session.');
    }
  };

  const getMasteredCount = (masteredCards: any) => {
    if (!masteredCards) return 0;
    if (Array.isArray(masteredCards)) return masteredCards.length;
    if (typeof masteredCards === 'object' && masteredCards.size !== undefined) 
      return masteredCards.size;
    return 0;
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

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse border-blue-500/30 bg-blue-50/30">
        <div className="h-6 bg-bg-subtle rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-bg-subtle rounded"></div>
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-blue-500/30 bg-blue-50/30">
      <h3 className="text-[18px] font-semibold text-content-emphasis mb-2">
        Sessions en cours
      </h3>
      <p className="text-[13px] text-content-muted mb-4">
        {sessions.length} session{sessions.length > 1 ? 's' : ''} non terminée{sessions.length > 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-xl border border-border-subtle bg-bg-emphasis p-4 transition-all hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getModeColor(session.mode)}`}>
                    {getModeLabel(session.mode)}
                  </span>
                  <h4 className="text-[15px] font-semibold text-content-emphasis">
                    {session.sets?.title || 'Set inconnu'}
                  </h4>
                </div>

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

                {/* Progression X/Y */}
                {session.session_state?.masteredCards && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${(getMasteredCount(session.session_state.masteredCards) / session.total_cards) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-content-muted">
                      {getMasteredCount(session.session_state.masteredCards)}/{session.total_cards}
                    </span>
                  </div>
                )}
              </div>

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
                  className="flex items-center gap-1.5 hover:text-state-danger hover:border-state-danger"
                >
                  <X className="h-3.5 w-3.5" />
                  Terminer
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}



