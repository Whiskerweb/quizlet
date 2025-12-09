'use client';

import { useEffect, useState } from 'react';
import { evaluationsService, EvaluationSession, EvaluationAnswer } from '@/lib/supabase/evaluations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  User,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';

interface EvaluationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string;
  evaluation: {
    id: string;
    title: string;
    description?: string;
    mode: 'quiz' | 'writing' | 'flashcard' | 'match';
  };
}

interface StudentSession extends EvaluationSession {
  student: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
}

export function EvaluationResultsModal({ isOpen, onClose, evaluationId, evaluation }: EvaluationResultsModalProps) {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<EvaluationAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, evaluationId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await evaluationsService.getEvaluationSessions(evaluationId);
      setSessions(data as StudentSession[]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAnswers = async (studentId: string) => {
    try {
      setLoadingAnswers(true);
      const answers = await evaluationsService.getStudentAnswers(evaluationId, studentId);
      setStudentAnswers(answers);
    } catch (error) {
      console.error('Failed to load answers:', error);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
      if (selectedStudentId === studentId) {
        setSelectedStudentId(null);
        setStudentAnswers([]);
      }
    } else {
      newExpanded.add(studentId);
      setSelectedStudentId(studentId);
      loadStudentAnswers(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const completedSessions = sessions.filter(s => s.is_completed);
  const avgScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + (s.final_score || 0), 0) / completedSessions.length
    : 0;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-6xl max-h-[95vh] rounded-2xl border border-border-subtle bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-content-emphasis mb-1">
                Résultats - {evaluation.title}
              </h2>
              {evaluation.description && (
                <p className="text-sm text-content-muted">{evaluation.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-subtle rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-content-muted" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-blue-500/30 bg-blue-50/30">
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-content-subtle">Participants</p>
                </div>
                <p className="text-2xl font-bold text-content-emphasis">
                  {completedSessions.length} / {sessions.length}
                </p>
                <p className="text-xs text-content-muted mt-1">
                  {sessions.length - completedSessions.length} en cours
                </p>
              </Card>

              <Card className="p-5 border-green-500/30 bg-green-50/30">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-content-subtle">Score moyen</p>
                </div>
                <p className="text-2xl font-bold text-content-emphasis">
                  {avgScore.toFixed(1)}%
                </p>
                <p className="text-xs text-content-muted mt-1">
                  Sur {completedSessions.length} complétée{completedSessions.length > 1 ? 's' : ''}
                </p>
              </Card>

              <Card className="p-5 border-purple-500/30 bg-purple-50/30">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <p className="text-sm font-medium text-content-subtle">Temps moyen</p>
                </div>
                <p className="text-2xl font-bold text-content-emphasis">
                  {completedSessions.length > 0
                    ? formatDuration(
                        Math.round(
                          completedSessions
                            .filter(s => s.completed_at && s.started_at)
                            .reduce((sum, s) => {
                              const duration = new Date(s.completed_at!).getTime() - new Date(s.started_at).getTime();
                              return sum + duration / 1000;
                            }, 0) / completedSessions.filter(s => s.completed_at).length
                        )
                      )
                    : '-'
                  }
                </p>
                <p className="text-xs text-content-muted mt-1">
                  Temps de complétion
                </p>
              </Card>
            </div>

            {/* Students List */}
            {loading ? (
              <div className="py-12 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
                <p className="text-[15px] font-medium text-content-emphasis mb-1">
                  Aucun résultat
                </p>
                <p className="text-[13px] text-content-muted">
                  Aucun étudiant n'a encore complété cette évaluation
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-content-emphasis mb-4">
                  Détails par étudiant
                </h3>
                
                {sessions.map((session) => {
                  const isExpanded = expandedStudents.has(session.student_id);
                  const isSelected = selectedStudentId === session.student_id;
                  
                  return (
                    <Card key={session.id} className="border-border-subtle overflow-hidden">
                      <button
                        onClick={() => handleToggleStudent(session.student_id)}
                        className="w-full p-5 flex items-center justify-between hover:bg-bg-subtle transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-content-muted" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-content-muted" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {session.student.avatar ? (
                              <img 
                                src={session.student.avatar} 
                                alt={session.student.username}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                <span className="text-brand-primary font-semibold">
                                  {session.student.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold text-content-emphasis truncate">
                                {session.student.username}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-content-muted">
                                <span>{formatDate(session.started_at)}</span>
                                {session.is_completed && session.completed_at && (
                                  <>
                                    <span>•</span>
                                    <span>Terminé</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 flex-shrink-0">
                            {session.is_completed ? (
                              <>
                                <div className="text-right">
                                  <p className="text-xs text-content-muted">Score</p>
                                  <p className="text-lg font-bold text-content-emphasis">
                                    {session.final_score?.toFixed(1)}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-content-muted">Réponses</p>
                                  <p className="text-lg font-semibold text-content-emphasis">
                                    {session.correct_answers} / {session.total_questions}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                En cours
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-border-subtle bg-bg-subtle/50">
                          {loadingAnswers && selectedStudentId === session.student_id ? (
                            <div className="p-8 text-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
                            </div>
                          ) : selectedStudentId === session.student_id && studentAnswers.length > 0 ? (
                            <div className="p-5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-white border border-border-subtle">
                                  <p className="text-xs text-content-muted mb-1">Questions répondues</p>
                                  <p className="text-xl font-bold text-content-emphasis">
                                    {studentAnswers.length} / {session.total_questions}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-border-subtle">
                                  <p className="text-xs text-content-muted mb-1">Bonnes réponses</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {studentAnswers.filter(a => a.is_correct).length}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-border-subtle">
                                  <p className="text-xs text-content-muted mb-1">Temps total</p>
                                  <p className="text-xl font-bold text-content-emphasis">
                                    {formatDuration(
                                      studentAnswers.reduce((sum, a) => sum + (a.time_spent || 0), 0)
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-content-emphasis">
                                  Réponses détaillées
                                </h4>
                                
                                {studentAnswers.map((answer, index) => {
                                  const flashcard = (answer as any).flashcard;
                                  return (
                                    <Card key={answer.id} className="p-4 border-border-subtle">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded">
                                              Question {index + 1}
                                            </span>
                                            {answer.is_correct !== undefined && (
                                              answer.is_correct ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                                  <CheckCircle2 className="h-3 w-3" />
                                                  Correct
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
                                                  <XCircle className="h-3 w-3" />
                                                  Incorrect
                                                </span>
                                              )
                                            )}
                                            {answer.time_spent && (
                                              <span className="text-xs text-content-muted">
                                                {formatDuration(answer.time_spent)}
                                              </span>
                                            )}
                                          </div>

                                          {flashcard && (
                                            <div className="space-y-2">
                                              <div>
                                                <p className="text-xs font-medium text-content-muted mb-1">Question</p>
                                                <p className="text-sm font-medium text-content-emphasis">
                                                  <FormattedText text={flashcard.front || ''} />
                                                </p>
                                              </div>
                                              
                                              {(evaluation.mode === 'writing' || evaluation.mode === 'flashcard') && answer.answer_text ? (
                                                <div>
                                                  <p className="text-xs font-medium text-content-muted mb-1">Réponse de l'étudiant</p>
                                                  <p className="text-sm text-content-emphasis bg-bg-subtle p-3 rounded-lg">
                                                    {answer.answer_text}
                                                  </p>
                                                </div>
                                              ) : null}

                                              {flashcard.back && (
                                                <div>
                                                  <p className="text-xs font-medium text-content-muted mb-1">Réponse attendue</p>
                                                  <p className="text-sm text-content-emphasis">
                                                    <FormattedText text={flashcard.back} />
                                                  </p>
                                                </div>
                                              )}

                                              {answer.points !== undefined && answer.points !== null && (
                                                <div className="flex items-center gap-2 text-xs">
                                                  <span className="text-content-muted">Points:</span>
                                                  <span className="font-semibold text-content-emphasis">{answer.points}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          ) : selectedStudentId === session.student_id ? (
                            <div className="p-8 text-center">
                              <p className="text-sm text-content-muted">Aucune réponse trouvée</p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-bg-subtle/50 flex-shrink-0 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

