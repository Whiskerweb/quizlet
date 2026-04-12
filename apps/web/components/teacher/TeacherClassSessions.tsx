'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { classSessionsService, ClassActiveSession, StudentQuestionStat, ClassQuestionStat } from '@/lib/supabase/class-sessions';
import { classesService } from '@/lib/supabase/classes';
import { 
  Clock, 
  Users, 
  TrendingDown, 
  TrendingUp, 
  Target,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  TrendingUp as ProgressIcon,
  ChevronDown,
  ChevronRight,
  Award,
  Target as TargetIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TeacherClassSessionsProps {
  classId: string;
}

interface StudentProgress {
  student_id: string;
  username: string;
  email: string;
  avatar: string | null;
  joined_at: string;
  total_sessions: number;
  mastered_cards: number;
  completion_rate: number;
  avg_score: number;
  last_activity: string | null;
}

interface QuestionStatsSummary {
  total_questions: number;
  attempted_questions: number;
  mastered_questions: number;
  avg_success_rate: number;
  difficult_questions: number; // < 50%
  easy_questions: number; // >= 80%
  medium_questions: number; // 50-79%
}

export function TeacherClassSessions({ classId }: TeacherClassSessionsProps) {
  const [activeSessions, setActiveSessions] = useState<ClassActiveSession[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentQuestionStats, setStudentQuestionStats] = useState<StudentQuestionStat[]>([]);
  const [classQuestionStats, setClassQuestionStats] = useState<ClassQuestionStat[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [showQuestionStats, setShowQuestionStats] = useState(false);
  const [showDetailedQuestions, setShowDetailedQuestions] = useState(false);
  const [viewMode, setViewMode] = useState<'sessions' | 'questions' | 'progress'>('progress');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionSummary, setQuestionSummary] = useState<QuestionStatsSummary | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  useEffect(() => {
    if (selectedStudent && viewMode === 'questions') {
      loadStudentQuestionStats(selectedStudent);
    }
  }, [selectedStudent, viewMode, classId]);

  useEffect(() => {
    // Calculer le résumé des questions
    if (classQuestionStats.length > 0) {
      const attempted = classQuestionStats.filter(q => q.total_attempts > 0);
      const mastered = attempted.filter(q => q.students_mastered > 0);
      const avgRate = attempted.length > 0
        ? attempted.reduce((sum, q) => sum + q.avg_success_rate, 0) / attempted.length
        : 0;
      
      setQuestionSummary({
        total_questions: classQuestionStats.length,
        attempted_questions: attempted.length,
        mastered_questions: mastered.length,
        avg_success_rate: avgRate,
        difficult_questions: attempted.filter(q => q.avg_success_rate < 50).length,
        easy_questions: attempted.filter(q => q.avg_success_rate >= 80).length,
        medium_questions: attempted.filter(q => q.avg_success_rate >= 50 && q.avg_success_rate < 80).length,
      });
    } else {
      setQuestionSummary(null);
    }
  }, [classQuestionStats]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('[TeacherClassSessions] Loading data for class:', classId);
      
      const [sessions, questionStats, progressData] = await Promise.all([
        classSessionsService.getClassActiveSessions(classId).catch(err => {
          console.error('[TeacherClassSessions] Error loading sessions:', err);
          return [];
        }),
        classSessionsService.getClassQuestionStats(classId).catch(err => {
          console.error('[TeacherClassSessions] Error loading question stats:', err);
          return [];
        }),
        classesService.getAllStudentsStats(classId).catch(err => {
          console.error('[TeacherClassSessions] Error loading student progress:', err);
          return [];
        }),
      ]);
      
      console.log('[TeacherClassSessions] Loaded data:', {
        sessions: sessions.length,
        questionStats: questionStats.length,
        progressData: progressData.length,
      });
      
      setActiveSessions(sessions);
      setClassQuestionStats(questionStats);
      
      // Transform progress data
      const transformedProgress = (progressData || []).map((s: any) => ({
        student_id: s.student_id,
        username: s.username || 'Anonyme',
        email: s.email || '',
        avatar: s.avatar || null,
        joined_at: s.joined_at,
        total_sessions: s.total_sessions || 0,
        mastered_cards: s.mastered_cards || 0,
        completion_rate: Number(s.completion_rate) || 0,
        avg_score: Number(s.avg_score) || 0,
        last_activity: s.last_activity || null,
      }));
      
      console.log('[TeacherClassSessions] Transformed progress:', transformedProgress);
      setStudentProgress(transformedProgress);
      setError(null);
    } catch (error: any) {
      console.error('[TeacherClassSessions] Failed to load:', error);
      setError(error?.message || 'Erreur lors du chargement des données');
      setActiveSessions([]);
      setClassQuestionStats([]);
      setStudentProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentQuestionStats = async (studentId: string) => {
    try {
      console.log('[TeacherClassSessions] Loading question stats for student:', studentId);
      const stats = await classSessionsService.getStudentQuestionStats(classId, studentId);
      console.log('[TeacherClassSessions] Loaded student stats:', stats.length, 'questions');
      setStudentQuestionStats(stats.filter(s => s.total_attempts > 0));
    } catch (error) {
      console.error('[TeacherClassSessions] Failed to load student stats:', error);
      setStudentQuestionStats([]);
    }
  };

  const getMasteredCount = (sessionState: any) => {
    if (!sessionState?.masteredCards) return 0;
    if (Array.isArray(sessionState.masteredCards)) return sessionState.masteredCards.length;
    if (typeof sessionState.masteredCards === 'object' && sessionState.masteredCards.size !== undefined) 
      return sessionState.masteredCards.size;
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

  const groupedSessions = activeSessions.reduce((acc, session) => {
    if (!acc[session.student_id]) {
      acc[session.student_id] = {
        student_id: session.student_id,
        student_username: session.student_username,
        student_email: session.student_email,
        sessions: [],
      };
    }
    acc[session.student_id].sessions.push(session);
    return acc;
  }, {} as Record<string, { student_id: string; student_username: string; student_email: string; sessions: ClassActiveSession[] }>);

  if (isLoading) {
    return (
      <Card className="p-6 border-purple-500/30 bg-purple-50/30">
        <div className="animate-pulse">
          <div className="h-6 bg-bg-subtle rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-bg-subtle rounded-xl"></div>
            <div className="h-20 bg-bg-subtle rounded-xl"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-purple-500/30 bg-purple-50/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[18px] font-semibold text-content-emphasis mb-1">
            Statistiques de la classe
          </h3>
          <p className="text-[13px] text-content-muted">
            {viewMode === 'progress' && `${studentProgress.length} élève${studentProgress.length > 1 ? 's' : ''}`}
            {viewMode === 'sessions' && `${activeSessions.length} session${activeSessions.length > 1 ? 's' : ''} active${activeSessions.length > 1 ? 's' : ''}`}
            {viewMode === 'questions' && questionSummary && `${questionSummary.attempted_questions} question${questionSummary.attempted_questions > 1 ? 's' : ''} tentée${questionSummary.attempted_questions > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'progress' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('progress');
              setSelectedStudent(null);
            }}
          >
            <ProgressIcon className="h-4 w-4 mr-1.5" />
            Progressions
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'sessions' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('sessions');
              setSelectedStudent(null);
            }}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            Sessions
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'questions' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('questions');
              setSelectedStudent(null);
              setShowDetailedQuestions(false);
            }}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Stats Questions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            title="Rafraîchir les données"
          >
            🔄
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-[14px] text-red-700">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      )}

      {viewMode === 'progress' ? (
        // Vue Progressions des élèves
        <div className="space-y-4">
          {studentProgress.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-content-subtle mx-auto mb-3 opacity-50" />
              <p className="text-[14px] text-content-muted">Aucun élève dans cette classe</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {studentProgress.map((student) => {
                  const progress = student.completion_rate || 0;
                  const progressColor = 
                    progress >= 70 ? 'from-green-500 to-green-600' :
                    progress >= 40 ? 'from-yellow-500 to-yellow-600' :
                    'from-red-500 to-red-600';

                  const daysSinceActivity = student.last_activity
                    ? Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={student.student_id}
                      className="rounded-xl border border-border-subtle bg-bg-emphasis p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {student.avatar ? (
                            <img 
                              src={student.avatar} 
                              alt={student.username} 
                              className="h-12 w-12 rounded-full flex-shrink-0" 
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[16px] font-bold flex-shrink-0">
                              {student.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[15px] font-semibold text-content-emphasis truncate">
                              {student.username}
                            </h4>
                            <p className="text-[12px] text-content-muted truncate">{student.email}</p>
                            {daysSinceActivity !== null && (
                              <p className="text-[11px] text-content-subtle mt-0.5">
                                Dernière activité: il y a {daysSinceActivity} jour{daysSinceActivity > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student.student_id);
                            setViewMode('questions');
                            loadStudentQuestionStats(student.student_id);
                            setShowDetailedQuestions(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Détails
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {/* Barre de progression principale */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[14px]">
                            <span className="font-medium text-content-emphasis">Progression globale</span>
                            <span className="font-bold text-content-emphasis">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-bg-subtle rounded-full h-2.5 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', progressColor)}
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats détaillées */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
                          <div>
                            <p className="text-[11px] text-content-subtle mb-0.5">Cartes maîtrisées</p>
                            <p className="text-[14px] font-bold text-green-600">
                              {student.mastered_cards}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-content-subtle mb-0.5">Sessions totales</p>
                            <p className="text-[14px] font-bold text-content-emphasis">
                              {student.total_sessions}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-content-subtle mb-0.5">Score moyen</p>
                            <p className="text-[14px] font-bold text-purple-600">
                              {Math.round(student.avg_score)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-content-subtle mb-0.5">Depuis</p>
                            <p className="text-[12px] font-medium text-content-emphasis">
                              {new Date(student.joined_at).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : viewMode === 'sessions' ? (
        <div className="space-y-4">
          {Object.values(groupedSessions).map((group) => (
            <div
              key={group.student_id}
              className="rounded-xl border border-border-subtle bg-bg-emphasis p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-[15px] font-semibold text-content-emphasis">
                    {group.student_username}
                  </h4>
                  <p className="text-[12px] text-content-muted">{group.student_email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(group.student_id);
                    setViewMode('questions');
                    loadStudentQuestionStats(group.student_id);
                    setShowDetailedQuestions(true);
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Voir détails
                </Button>
              </div>

              <div className="space-y-2">
                {group.sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {getModeLabel(session.mode)}
                        </span>
                        <span className="text-[13px] font-medium text-content-emphasis truncate">
                          {session.set_title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-content-muted">
                        <span>{getTimeAgo(session.started_at)}</span>
                        <span>•</span>
                        <span>{session.total_cards} cartes</span>
                        {session.session_state && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              {getMasteredCount(session.session_state)}/{session.total_cards} maîtrisées
                            </span>
                          </>
                        )}
                      </div>
                      {session.session_state && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-default rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{
                                width: `${(getMasteredCount(session.session_state) / session.total_cards) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedSessions).length === 0 && (
            <div className="py-12 text-center">
              <Clock className="h-10 w-10 text-content-subtle mx-auto mb-3 opacity-50" />
              <p className="text-[14px] text-content-muted">Aucune session en cours</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {selectedStudent ? (
            // Stats détaillées pour un élève spécifique
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[16px] font-semibold text-content-emphasis">
                  Stats détaillées - {studentProgress.find(s => s.student_id === selectedStudent)?.username || 'Élève'}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setShowDetailedQuestions(false);
                  }}
                >
                  Retour
                </Button>
              </div>

              {studentQuestionStats.length === 0 ? (
                <div className="py-12 text-center">
                  <BarChart3 className="h-10 w-10 text-content-subtle mx-auto mb-3 opacity-50" />
                  <p className="text-[14px] text-content-muted">Aucune statistique disponible</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {studentQuestionStats.map((stat) => (
                    <div
                      key={stat.flashcard_id}
                      className={cn(
                        'p-3 rounded-lg border transition-all text-sm',
                        stat.is_mastered
                          ? 'border-green-200 bg-green-50/50'
                          : stat.success_rate < 50
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-border-subtle bg-bg-emphasis'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-content-emphasis truncate">{stat.flashcard_front}</p>
                          <p className="text-xs text-content-muted truncate">{stat.flashcard_back}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className={cn(
                            'text-sm font-bold',
                            stat.success_rate >= 80 ? 'text-green-600' :
                            stat.success_rate >= 50 ? 'text-orange-600' : 'text-red-600'
                          )}>
                            {stat.success_rate.toFixed(0)}%
                          </span>
                          <span className="text-xs text-content-subtle">
                            {stat.correct_count}/{stat.total_attempts}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Vue globale avec résumé et détails optionnels
            <>
              {questionSummary ? (
                <>
                  {/* Résumé global */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TargetIcon className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-700 font-medium">Questions tentées</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {questionSummary.attempted_questions}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        sur {questionSummary.total_questions} total
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-700 font-medium">Taux moyen</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {questionSummary.avg_success_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {questionSummary.mastered_questions} maîtrisée{questionSummary.mastered_questions > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-700 font-medium">Faciles</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {questionSummary.easy_questions}
                      </p>
                      <p className="text-xs text-green-600 mt-1">≥ 80% réussite</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <p className="text-xs text-red-700 font-medium">Difficiles</p>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {questionSummary.difficult_questions}
                      </p>
                      <p className="text-xs text-red-600 mt-1">&lt; 50% réussite</p>
                    </div>
                  </div>

                  {/* Bouton pour voir les détails */}
                  {!showDetailedQuestions && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailedQuestions(true)}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir le détail des questions ({classQuestionStats.length})
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  )}

                  {/* Détails des questions (affichage compact) */}
                  {showDetailedQuestions && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[16px] font-semibold text-content-emphasis">
                          Détail des questions ({classQuestionStats.length} questions tentées)
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDetailedQuestions(false)}
                        >
                          Masquer
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {classQuestionStats
                          .sort((a, b) => a.avg_success_rate - b.avg_success_rate)
                          .map((stat) => (
                            <div
                              key={stat.flashcard_id}
                              className={cn(
                                'p-3 rounded-lg border transition-all text-sm',
                                stat.avg_success_rate >= 80
                                  ? 'border-green-200 bg-green-50/50'
                                  : stat.avg_success_rate < 50
                                  ? 'border-red-200 bg-red-50/50'
                                  : 'border-orange-200 bg-orange-50/50'
                              )}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-content-emphasis truncate mb-1">
                                    {stat.flashcard_front}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-content-muted">
                                    <span>{stat.module_name}</span>
                                    <span>•</span>
                                    <span>{stat.total_students_attempted} élève{stat.total_students_attempted > 1 ? 's' : ''}</span>
                                    <span>•</span>
                                    <span>{stat.total_attempts} tentatives</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                  <div>
                                    <p className={cn(
                                      'text-lg font-bold',
                                      stat.avg_success_rate >= 80 ? 'text-green-600' :
                                      stat.avg_success_rate >= 50 ? 'text-orange-600' : 'text-red-600'
                                    )}>
                                      {stat.avg_success_rate.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-content-subtle">
                                      {stat.total_correct}✓/{stat.total_attempts}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <BarChart3 className="h-10 w-10 text-content-subtle mx-auto mb-3 opacity-50" />
                  <p className="text-[14px] text-content-muted">Aucune statistique disponible</p>
                  <p className="text-[12px] text-content-subtle mt-2">
                    Les statistiques apparaîtront une fois que les élèves auront commencé à étudier.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
