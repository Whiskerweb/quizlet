'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { classesService } from '@/lib/supabase/classes';
import { classModulesService } from '@/lib/supabase/class-modules';
import { evaluationsService } from '@/lib/supabase/evaluations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShareModuleModal } from '@/components/teacher/ShareModuleModal';
import { CreateEvaluationModal } from '@/components/teacher/CreateEvaluationModal';
import { EvaluationResultsModal } from '@/components/teacher/EvaluationResultsModal';
import { TeacherClassSessions } from '@/components/teacher/TeacherClassSessions';
import {
  ArrowLeft,
  Users,
  Folder,
  Target,
  Award,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Settings,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_code: string;
  color: string;
  created_at: string;
  teacher_id: string;
}

interface ClassStudent {
  member_id: string;
  username: string;
  email: string;
  avatar: string | null;
  joined_at: string;
  last_activity?: string;
  progress?: number;
  total_sessions?: number;
  mastered_cards?: number;
  completion_rate?: number;
  avg_score?: number;
}

interface ClassModule {
  module_id: string;
  module_name: string;
  module_color: string;
  shared_at: string;
  sets_count: number;
  total_cards?: number;
  completion_rate?: number;
}

interface ClassStats {
  total_students: number;
  active_students: number;
  total_modules: number;
  total_cards: number;
  avg_completion: number;
  total_study_sessions: number;
  avg_score: number;
}

type TabType = 'overview' | 'students' | 'modules' | 'evaluations' | 'analytics';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [modules, setModules] = useState<ClassModule[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateEvaluationModalOpen, setIsCreateEvaluationModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/home');
      return;
    }
    
    if (profile && profile.role !== 'teacher') {
      router.push('/home');
      return;
    }
    
    if (profile && profile.role === 'teacher') {
      loadClassData();
    }
  }, [classId, user, profile]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      const [classInfo, studentsData, modulesData, statsData] = await Promise.all([
        classesService.getClass(classId),
        classesService.getAllStudentsStats(classId),
        classModulesService.getClassModules(classId),
        classesService.getClassStats(classId),
      ]);

      setClassData(classInfo as ClassData);
      
      const transformedStudents: ClassStudent[] = (studentsData || []).map((s: any) => ({
        member_id: s.student_id,
        username: s.username || 'Anonyme',
        email: s.email || '',
        avatar: s.avatar || null,
        joined_at: s.joined_at,
        last_activity: s.last_activity,
        progress: s.completion_rate || 0,
        total_sessions: s.total_sessions || 0,
        mastered_cards: s.mastered_cards || 0,
        completion_rate: s.completion_rate || 0,
        avg_score: s.avg_score || 0,
      }));
      
      setStudents(transformedStudents);
      setModules((modulesData || []) as ClassModule[]);

      if (statsData && typeof statsData === 'object') {
        const stats = statsData as any;
        setStats({
          total_students: stats.total_students || 0,
          active_students: stats.active_students || 0,
          total_modules: stats.total_modules || 0,
          total_cards: stats.total_cards || 0,
          avg_completion: Math.round(stats.avg_completion || 0),
          total_study_sessions: stats.total_study_sessions || 0,
          avg_score: Math.round(stats.avg_score || 0),
        });
      }
    } catch (error) {
      console.error('[ClassDetail] Failed to load class data:', error);
      alert(`Erreur: ${(error as any).message || 'Impossible de charger la classe'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyClassCode = async () => {
    if (classData) {
      await navigator.clipboard.writeText(classData.class_code);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-content-muted">Classe introuvable</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'students', label: 'Élèves', icon: Users },
    { id: 'modules', label: 'Modules', icon: Folder },
    { id: 'evaluations', label: 'Évaluations', icon: Target },
    { id: 'analytics', label: 'Statistiques', icon: Activity },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      {/* Compact Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/home')}
          className="mb-3 flex items-center gap-2 text-[13px] font-medium text-content-muted hover:text-content-emphasis transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: classData.color }}
              />
              <h1 className="text-[24px] sm:text-[28px] font-bold text-content-emphasis truncate">
                {classData.name}
              </h1>
            </div>
            {classData.description && (
              <p className="text-[14px] text-content-muted line-clamp-2">
                {classData.description}
              </p>
            )}
          </div>

          {/* Class Code - Compact */}
          <div className="flex-shrink-0">
            {isCodeVisible ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-subtle border border-border-subtle">
                <code className="text-[13px] font-mono font-semibold text-content-emphasis tracking-wider">
                  {classData.class_code}
                </code>
                <button
                  onClick={copyClassCode}
                  className="p-1 hover:bg-bg-emphasis rounded-lg transition-colors"
                  title="Copier"
                >
                  <Copy className="h-3.5 w-3.5 text-content-muted" />
                </button>
                <button
                  onClick={() => setIsCodeVisible(false)}
                  className="p-1 hover:bg-bg-emphasis rounded-lg transition-colors"
                  title="Masquer"
                >
                  <EyeOff className="h-3.5 w-3.5 text-content-muted" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="relative flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-content-emphasis bg-bg-subtle hover:bg-bg-emphasis rounded-xl border border-border-subtle hover:border-brand-primary/50 transition-all duration-200 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 border-2 border-brand-primary/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-[2px]" />
                <Eye className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">Code</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid - More Visual */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Users}
            label="Élèves"
            value={stats.total_students}
            subtitle={`${stats.active_students} actifs`}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={Folder}
            label="Modules"
            value={stats.total_modules}
            subtitle={`${stats.total_cards} cardz`}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      )}

      {/* Tabs Navigation - More Elegant */}
      <div className="mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium rounded-xl',
                  'transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-bg-emphasis text-content-emphasis shadow-sm'
                    : 'text-content-muted hover:text-content-emphasis hover:bg-bg-subtle'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-brand-primary' : '')} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab classId={classId} stats={stats} students={students} modules={modules} onShareClick={() => setIsShareModalOpen(true)} onAnalyticsClick={() => setActiveTab('analytics')} />}
        {activeTab === 'students' && <StudentsTab classId={classId} students={students} onRefresh={loadClassData} />}
        {activeTab === 'modules' && <ModulesTab classId={classId} modules={modules} onRefresh={loadClassData} onShare={() => setIsShareModalOpen(true)} />}
        {activeTab === 'evaluations' && <EvaluationsTab classId={classId} onRefresh={loadClassData} onCreateClick={() => setIsCreateEvaluationModalOpen(true)} />}
        {activeTab === 'analytics' && <AnalyticsTab classId={classId} stats={stats} students={students} modules={modules} />}
      </div>

      {/* Modals */}
      <ShareModuleModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        classId={classId}
        onSuccess={loadClassData}
      />

      <CreateEvaluationModal
        isOpen={isCreateEvaluationModalOpen}
        onClose={() => setIsCreateEvaluationModalOpen(false)}
        classId={classId}
        onSuccess={loadClassData}
      />

      {/* Class Code Modal - Full Screen for Projector */}
      {isCodeModalOpen && classData && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCodeModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-6xl">
            <div className="bg-white rounded-2xl p-12 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-content-emphasis mb-2">
                  Code de la classe
                </h2>
                <p className="text-lg text-content-muted">
                  {classData.name}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-transparent rounded-2xl p-12 border-4 border-brand-primary/30 mb-8">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-content-muted mb-6 font-semibold">
                    Code à partager
                  </p>
                  <code className="text-7xl sm:text-8xl md:text-9xl font-mono font-bold text-brand-primary tracking-[0.2em] block mb-6 break-all">
                    {classData.class_code}
                  </code>
                  <p className="text-base text-content-muted mt-4">
                    Les élèves peuvent rejoindre la classe avec ce code
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="primary"
                  onClick={async () => {
                    await copyClassCode();
                    setIsCodeModalOpen(false);
                  }}
                  className="px-8 py-3"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copier le code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="px-8 py-3"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// EvaluationResultsModal will be added to EvaluationsTab component

// ===== STAT CARD COMPONENT =====

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color, 
  bgColor,
  showProgress = false,
  progress = 0 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subtitle: string; 
  color: string; 
  bgColor: string;
  showProgress?: boolean;
  progress?: number;
}) {
  return (
    <Card className="p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-xl', bgColor)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        {showProgress && (
          <div className="text-[11px] font-medium text-content-muted">
            {progress}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-content-subtle">
          {label}
        </p>
        <p className="text-[22px] font-bold text-content-emphasis">
          {value}
        </p>
        <p className="text-[12px] text-content-muted">
          {subtitle}
        </p>
      </div>
      {showProgress && (
        <div className="mt-3 w-full bg-bg-subtle rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </Card>
  );
}

// ===== TAB COMPONENTS =====

function OverviewTab({ classId, stats, students, modules, onShareClick, onAnalyticsClick }: { classId: string; stats: ClassStats | null; students: ClassStudent[]; modules: ClassModule[]; onShareClick: () => void; onAnalyticsClick: () => void }) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, [classId]);

  const loadRecentActivity = async () => {
    try {
      setLoadingActivity(true);
      const activity = await classesService.getClassRecentActivity(classId, 8);
      setRecentActivity(activity as any);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const topStudents = [...students]
    .sort((a, b) => (b.completion_rate || 0) - (a.completion_rate || 0))
    .slice(0, 3);

  const studentsNeedingHelp = students.filter((s) => {
    const noActivity = !s.last_activity || 
      new Date(s.last_activity).getTime() < Date.now() - 3 * 24 * 60 * 60 * 1000;
    const lowProgress = (s.completion_rate || 0) < 30;
    return noActivity || lowProgress;
  }).slice(0, 5);

  const formatActivityTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Il y a moins d\'1h';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Il y a 1j';
    return `Il y a ${diffDays}j`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'joined':
        return Users;
      case 'completed':
        return CheckCircle2;
      case 'mastered':
        return Award;
      default:
        return BookOpen;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'joined':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'mastered':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick Actions */}
      <Card className="p-5 border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-content-emphasis">Actions rapides</h2>
          <Sparkles className="h-4 w-4 text-content-subtle" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton
            icon={Target}
            label="Créer un quiz"
            onClick={() => {}}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <ActionButton
            icon={Share2}
            label="Partager module"
            onClick={onShareClick}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <ActionButton
            icon={BarChart3}
            label="Voir stats"
            onClick={onAnalyticsClick}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <ActionButton
            icon={Settings}
            label="Paramètres"
            onClick={() => {}}
            color="text-content-emphasis"
            bgColor="bg-bg-subtle"
          />
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Activity - Larger */}
        <Card className="lg:col-span-2 p-5 border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-content-emphasis">Activité récente</h2>
            <Activity className="h-4 w-4 text-content-subtle" />
          </div>
          {loadingActivity ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="h-10 w-10 text-content-subtle mx-auto mb-3 opacity-50" />
              <p className="text-[14px] text-content-muted">Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((activity: any, idx: number) => {
                const Icon = getActivityIcon(activity.activity_type);
                const iconStyles = getActivityColor(activity.activity_type);
                
                let actionText = activity.activity_description;
                if (activity.module_name) {
                  actionText += ` "${activity.module_name}"`;
                }
                if (activity.set_title) {
                  actionText += ` - ${activity.set_title}`;
                }
                
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-bg-emphasis hover:bg-bg-subtle hover:border-border-default transition-all">
                    <div className={cn('p-1.5 rounded-lg flex-shrink-0', iconStyles.split(' ')[1])}>
                      <Icon className={cn('h-3.5 w-3.5', iconStyles.split(' ')[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-content-emphasis truncate">
                        <span className="font-semibold">{activity.student_username}</span> {actionText}
                      </p>
                    </div>
                    <span className="text-[11px] text-content-muted font-medium whitespace-nowrap">
                      {formatActivityTime(activity.activity_time)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Students & Help Needed - Sidebar */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 text-yellow-600" />
              <h3 className="text-[15px] font-semibold text-content-emphasis">Top élèves</h3>
            </div>
            {topStudents.length === 0 ? (
              <p className="text-[13px] text-content-muted italic">Aucune progression</p>
            ) : (
              <div className="space-y-2.5">
                {topStudents.map((student, idx) => (
                  <div key={student.member_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-subtle transition-colors">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-[11px] font-bold text-yellow-700 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-content-emphasis truncate">{student.username}</p>
                    </div>
                    <span className="text-[12px] text-green-600 font-bold">
                      {Math.round(student.completion_rate || 0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <h3 className="text-[15px] font-semibold text-content-emphasis">Besoin d'aide</h3>
            </div>
            {studentsNeedingHelp.length === 0 ? (
              <p className="text-[13px] text-content-muted italic">Tous progressent bien !</p>
            ) : (
              <div className="space-y-2.5">
                {studentsNeedingHelp.map((student) => {
                  const daysSinceActivity = student.last_activity
                    ? Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                    <div key={student.member_id} className="p-2.5 rounded-xl hover:bg-bg-subtle transition-colors">
                      <p className="text-[13px] font-semibold text-content-emphasis mb-1">{student.username}</p>
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        {daysSinceActivity !== null 
                          ? `Pas d'activité depuis ${daysSinceActivity}j`
                          : 'Aucune activité'
                        }
                        {(student.completion_rate || 0) < 30 && (
                          <span className="block mt-0.5">Progression: {Math.round(student.completion_rate || 0)}%</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, color, bgColor }: { icon: any; label: string; onClick: () => void; color: string; bgColor: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2.5 p-4 rounded-lg border border-border-subtle bg-bg-emphasis',
        'hover:shadow-card-hover hover:border-border-default hover:bg-bg-subtle transition-all duration-200',
        'group'
      )}
    >
      <div className={cn('p-2.5 rounded-xl', bgColor, 'group-hover:scale-110 transition-transform')}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <span className="text-[12px] font-medium text-content-emphasis">{label}</span>
    </button>
  );
}

function StudentsTab({ students, onRefresh, classId }: { students: ClassStudent[]; onRefresh: () => void; classId: string }) {
  const handleRemoveStudent = async (studentId: string, username: string) => {
    if (!confirm(`Retirer ${username} de cette classe ?`)) return;
    
    try {
      await classesService.removeStudent(classId, studentId);
      await onRefresh();
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('Erreur lors du retrait de l\'élève');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-content-emphasis mb-1">
            Élèves
          </h2>
          <p className="text-[13px] text-content-muted">{students.length} élève{students.length > 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Inviter
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
          <p className="text-[15px] font-medium text-content-emphasis mb-1">Aucun élève</p>
          <p className="text-[13px] text-content-muted">Partagez le code classe avec vos élèves</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.member_id}
              className="flex items-center justify-between p-4 rounded-xl border border-border-subtle hover:shadow-card-hover hover:border-border-default transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.username} className="h-11 w-11 rounded-full flex-shrink-0" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white text-[15px] font-bold flex-shrink-0">
                    {student.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-content-emphasis truncate">{student.username}</p>
                  <p className="text-[12px] text-content-muted truncate">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[12px] text-content-muted mb-0.5">Progression</p>
                  <p className="text-[16px] font-bold text-green-600">
                    {Math.round(student.completion_rate || 0)}%
                  </p>
                  {student.total_sessions !== undefined && (
                    <p className="text-[11px] text-content-subtle mt-0.5">
                      {student.total_sessions} session{student.total_sessions > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.member_id, student.username)}
                  className="px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  title="Retirer de la classe"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ModulesTab({ classId, modules, onRefresh, onShare }: { classId: string; modules: ClassModule[]; onRefresh: () => void; onShare: () => void }) {
  const handleRemoveModule = async (moduleId: string, moduleName: string) => {
    if (!confirm(`Retirer le module "${moduleName}" de cette classe ?`)) return;
    
    try {
      await classModulesService.removeModuleFromClass(classId, moduleId);
      await onRefresh();
    } catch (error) {
      console.error('Failed to remove module:', error);
      alert('Erreur lors du retrait du module');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-content-emphasis mb-1">
            Modules partagés
          </h2>
          <p className="text-[13px] text-content-muted">{modules.length} module{modules.length > 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="sm" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Partager un module
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="py-16 text-center">
          <Folder className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
          <p className="text-[15px] font-medium text-content-emphasis mb-1">Aucun module partagé</p>
          <p className="text-[13px] text-content-muted mb-4">Créez d'abord un module dans "Votre espace"</p>
          <Button variant="primary" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager votre premier module
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {modules.map((module) => (
            <Link
              key={module.module_id}
              href={`/classes/${classId}/module/${module.module_id}`}
              className="group p-5 rounded-xl border border-border-subtle hover:shadow-card-hover hover:border-border-default transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div 
                    className="p-2 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: `${module.module_color}15` }}
                  >
                    <Folder className="h-5 w-5" style={{ color: module.module_color }} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-content-emphasis truncate">{module.module_name}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveModule(module.module_id, module.module_name);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-content-subtle hover:text-red-600 opacity-0 group-hover:opacity-100"
                  title="Retirer de la classe"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-content-muted">{module.sets_count} cardz</span>
                <span className="text-content-subtle">
                  {new Date(module.shared_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="mt-3 flex items-center text-[12px] text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Voir les détails
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function EvaluationsTab({ classId, onRefresh, onCreateClick }: { classId: string; onRefresh: () => void; onCreateClick: () => void }) {
  const { profile } = useAuthStore();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, [classId]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const data = await evaluationsService.getClassEvaluations(classId);
      setEvaluations(data);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (evaluationId: string) => {
    if (!profile?.id) return;
    try {
      await evaluationsService.launchEvaluation(evaluationId, profile.id);
      await loadEvaluations();
    } catch (error) {
      console.error('Failed to launch evaluation:', error);
      alert('Erreur lors du lancement de l\'évaluation');
    }
  };

  const handleStop = async (evaluationId: string) => {
    if (!profile?.id) return;
    if (!confirm('Arrêter cette évaluation ? Les étudiants ne pourront plus y participer.')) return;
    try {
      await evaluationsService.stopEvaluation(evaluationId, profile.id);
      await loadEvaluations();
    } catch (error) {
      console.error('Failed to stop evaluation:', error);
      alert('Erreur lors de l\'arrêt de l\'évaluation');
    }
  };

  const handleDelete = async (evaluationId: string, evaluationTitle: string) => {
    if (!profile?.id) return;
    if (!confirm(`Supprimer l'évaluation "${evaluationTitle}" ? Cette action est irréversible et supprimera également tous les résultats.`)) return;
    try {
      await evaluationsService.deleteEvaluation(evaluationId, profile.id);
      await loadEvaluations();
    } catch (error) {
      console.error('Failed to delete evaluation:', error);
      alert('Erreur lors de la suppression de l\'évaluation');
    }
  };

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      quiz: 'Quiz',
      writing: 'Writing',
      flashcard: 'Cardz',
      match: 'Match',
    };
    return modes[mode] || mode;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-content-emphasis mb-1">
            Évaluations
          </h2>
          <p className="text-[13px] text-content-muted">{evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="sm" onClick={onCreateClick}>
          <Target className="h-4 w-4 mr-2" />
          Créer une évaluation
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="py-16 text-center">
          <Target className="h-14 w-14 text-content-subtle mx-auto mb-4 opacity-40" />
          <p className="text-[15px] font-medium text-content-emphasis mb-1">
            Aucune évaluation
          </p>
          <p className="text-[13px] text-content-muted mb-4">Créez votre première évaluation pour votre classe</p>
          <Button variant="primary" onClick={onCreateClick}>
            <Target className="h-4 w-4 mr-2" />
            Créer une évaluation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="p-4 rounded-xl border border-border-subtle hover:shadow-card-hover hover:border-border-default transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[16px] font-semibold text-content-emphasis truncate">
                      {evaluation.title}
                    </h3>
                    {evaluation.is_active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-semibold rounded-full whitespace-nowrap">
                        Active
                      </span>
                    )}
                    {evaluation.is_closed && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-semibold rounded-full whitespace-nowrap">
                        Fermée
                      </span>
                    )}
                  </div>
                  {evaluation.description && (
                    <p className="text-[13px] text-content-muted mb-2 line-clamp-2">
                      {evaluation.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-content-subtle">
                    <span className="font-medium">{getModeLabel(evaluation.mode)}</span>
                    {evaluation.question_time_limit && (
                      <span>• {evaluation.question_time_limit}s/question</span>
                    )}
                    {evaluation.randomize_order && (
                      <span>• Ordre aléatoire</span>
                    )}
                    <span>• {formatDate(evaluation.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {evaluation.is_active && !evaluation.is_closed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStop(evaluation.id)}
                    >
                      Arrêter
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLaunch(evaluation.id)}
                    >
                      Lancer
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedEvaluation(evaluation);
                      setIsResultsModalOpen(true);
                    }}
                  >
                    Résultats
                  </Button>
                  <button
                    onClick={() => handleDelete(evaluation.id, evaluation.title)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-content-subtle hover:text-red-600"
                    title="Supprimer l'évaluation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Modal */}
      {selectedEvaluation && (
        <EvaluationResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => {
            setIsResultsModalOpen(false);
            setSelectedEvaluation(null);
          }}
          evaluationId={selectedEvaluation.id}
          evaluation={selectedEvaluation}
        />
      )}
    </Card>
  );
}

function AnalyticsTab({ classId, stats, students, modules }: { classId: string; stats: ClassStats | null; students: ClassStudent[]; modules: ClassModule[] }) {
  return (
    <div className="space-y-6">
      {/* Sessions en cours avec stats détaillées */}
      <TeacherClassSessions classId={classId} />
      
      {/* Summary Stats - Already shown at top, but can add more detail here */}
      <Card className="p-5">
        <h3 className="text-[18px] font-semibold text-content-emphasis mb-5">
          Répartition de la progression
        </h3>
        {students.length === 0 ? (
          <p className="text-[14px] text-content-muted italic text-center py-8">
            Aucun élève dans cette classe
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const progress = student.completion_rate || 0;
              const progressColor = 
                progress >= 70 ? 'from-green-500 to-green-600' :
                progress >= 40 ? 'from-yellow-500 to-yellow-600' :
                'from-red-500 to-red-600';

              return (
                <div key={student.member_id} className="space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-content-emphasis">{student.username}</span>
                    <span className="text-content-muted font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-bg-subtle rounded-full h-2 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', progressColor)}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Module Performance */}
      {modules.length > 0 && (
        <Card className="p-5">
          <h3 className="text-[18px] font-semibold text-content-emphasis mb-5">
            Modules partagés
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {modules.map((module) => (
              <div
                key={module.module_id}
                className="p-4 rounded-xl border border-border-subtle hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${module.module_color}15` }}
                  >
                    <Folder className="h-5 w-5" style={{ color: module.module_color }} />
                  </div>
                  <h4 className="text-[15px] font-semibold text-content-emphasis">{module.module_name}</h4>
                </div>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Cardz</span>
                    <span className="font-semibold text-content-emphasis">{module.sets_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Partagé le</span>
                    <span className="text-content-subtle">
                      {new Date(module.shared_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
