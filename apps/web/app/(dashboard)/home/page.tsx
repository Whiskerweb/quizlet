'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import { studyService } from '@/lib/supabase/study';
import { InviteFriendsCTA } from '@/components/InviteFriendsCTA';
import { ClassesManagementPage } from '@/components/teacher/ClassesManagementPage';
import { 
  Zap, 
  Flame, 
  Target,
  Clock,
  TrendingUp,
  Play,
  Plus,
  BookOpen,
  ArrowRight,
  Brain,
  Sparkles,
  Trophy,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface Stats {
  level: number;
  xpProgress: number;
  xpCurrent: number;
  xpNext: number;
  
  cardsToday: number;
  minutesToday: number;
  masteryRate: number;
  
  currentStreak: number;
  activeSessions: any[];
  recentSets: Array<{ id: string; title: string; cards: number }>;
  weeklyActivity: Array<{ 
    day: string; 
    cards: number; 
    active: boolean;
    date: string;
    minutes: number;
    sessionsCount: number;
  }>;
}

export default function HomePage() {
  const { profile } = useAuthStore();

  // Conditional rendering: Classes for teachers, Stats for students
  if (profile?.role === 'teacher') {
    return <ClassesManagementPage />;
  }

  // Student dashboard (existing stats page)
  return <StudentHomePage />;
}

function StudentHomePage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const calculateLevel = (xp: number) => {
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)));
    const xpCurrent = 100 * (level - 1) * (level - 1);
    const xpNext = 100 * level * level;
    const xpProgress = xpNext > xpCurrent ? ((xp - xpCurrent) / (xpNext - xpCurrent)) * 100 : 100;
    return { level, xpProgress, xpCurrent, xpNext };
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: userStats } = await (supabaseBrowser
        .from('user_stats') as any)
        .select('*')
        .eq('user_id', user!.id)
        .single();

      const totalXP = Math.max(0, 
        (userStats?.total_flashcards || 0) * 10 + 
        (userStats?.total_sessions || 0) * 5 + 
        (userStats?.total_study_time || 0)
      );
      
      const { level, xpProgress, xpCurrent, xpNext } = calculateLevel(totalXP);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todaySessions } = await (supabaseBrowser
        .from('study_sessions') as any)
        .select('*, answers(time_spent, is_correct)')
        .eq('user_id', user!.id)
        .gte('started_at', today.toISOString());

      const cardsToday = todaySessions?.reduce((sum: number, s: any) => {
        return sum + (s.answers?.length || 0);
      }, 0) || 0;

      // Minutes: use actual time spent on cards (time_spent) instead of session duration
      // This ensures we only count real study time, not idle time or navigation time
      // For active sessions, only counts time from answers already submitted
      console.log('[Home] Today sessions:', todaySessions?.length);
      
      const minutesToday = todaySessions?.reduce((sum: number, s: any, idx: number) => {
        // Calculate minutes from actual time spent on each answer (in milliseconds)
        // This is the REAL time the user spent thinking/answering, not session duration
        const timeSpentMs = s.answers?.reduce((answerSum: number, a: any) => {
          return answerSum + (a.time_spent || 0);
        }, 0) || 0;
        
        let sessionMinutes = timeSpentMs / 60000; // Convert milliseconds to minutes
        let source = 'time_spent';
        
        // Fallback for old sessions without time_spent: use session duration as estimate
        // But only if we have no time_spent data at all (all answers have null/0)
        if (sessionMinutes === 0 && s.answers && s.answers.length > 0) {
          const hasAnyTimeSpent = s.answers.some((a: any) => a.time_spent && a.time_spent > 0);
          
          if (!hasAnyTimeSpent && s.completed_at) {
            // Old session without time_spent: estimate from session duration
            const start = new Date(s.started_at);
            const end = new Date(s.completed_at);
            const durationMinutes = (end.getTime() - start.getTime()) / 60000;
            // Use a more conservative estimate: assume 20% of session time was actual study
            // This accounts for idle time, navigation, reading, etc.
            // Reduced from 30% to 20% to be more conservative
            sessionMinutes = durationMinutes * 0.2;
            source = 'fallback (20% of duration)';
            console.log(`[Home] Session ${idx} (old, no time_spent): ${durationMinutes.toFixed(2)}min duration → ${sessionMinutes.toFixed(2)}min estimate (20%)`);
          } else if (!hasAnyTimeSpent && !s.completed_at) {
            // Active session without time_spent: don't count (could be very old)
            console.log(`[Home] Session ${idx} (active, no time_spent): IGNORED`);
            return sum;
          }
        }
        
        const roundedMinutes = Math.floor(sessionMinutes);
        
        // Cap at 2h per session to prevent outliers (reduced from 3h)
        const cappedMinutes = Math.max(0, Math.min(roundedMinutes, 120));
        
        if (roundedMinutes !== cappedMinutes) {
          console.log(`[Home] Session ${idx} (${s.completed_at ? 'completed' : 'active'}): ${sessionMinutes.toFixed(2)}min (${source}) → CAPPED at ${cappedMinutes}min`);
        } else {
          console.log(`[Home] Session ${idx} (${s.completed_at ? 'completed' : 'active'}): ${sessionMinutes.toFixed(2)}min (${source})`);
        }
        
        return sum + cappedMinutes;
      }, 0) || 0;
      
      console.log('[Home] Total minutes today (from time_spent):', minutesToday);

      const activeSessions = await studyService.getActiveSessions().catch(() => []);

      const { data: recentSets } = await (supabaseBrowser
        .from('sets') as any)
        .select('id, title')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      const setsWithCounts = await Promise.all(
        (recentSets || []).map(async (set: any) => {
          const { count } = await (supabaseBrowser
            .from('flashcards') as any)
            .select('*', { count: 'exact', head: true })
            .eq('set_id', set.id);
          return { ...set, cards: count || 0 };
        })
      );

      // Weekly activity (last 7 days) - Enhanced with more details
      const weekDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const weekDaysShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      
      // Get last 7 days of sessions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      
      const { data: weekSessions } = await (supabaseBrowser
        .from('study_sessions') as any)
        .select('*, answers(*)')
        .eq('user_id', user!.id)
        .gte('started_at', weekAgo.toISOString());
      
      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const daySessions = weekSessions?.filter((s: any) => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= date && sessionDate < nextDate;
        }) || [];
        
        const dayCards = daySessions.reduce((sum: number, s: any) => sum + (s.answers?.length || 0), 0);
        
        // Calculate minutes from actual time spent on cards (time_spent) instead of session duration
        const dayMinutes = daySessions.reduce((sum: number, s: any) => {
          // Calculate minutes from actual time spent on each answer (in milliseconds)
          const timeSpentMs = s.answers?.reduce((answerSum: number, a: any) => {
            return answerSum + (a.time_spent || 0);
          }, 0) || 0;
          
          let sessionMinutes = timeSpentMs / 60000; // Convert milliseconds to minutes
          
          // Fallback for old sessions without time_spent: use session duration as estimate
          if (sessionMinutes === 0 && s.answers && s.answers.length > 0) {
            const hasAnyTimeSpent = s.answers.some((a: any) => a.time_spent && a.time_spent > 0);
            
            if (!hasAnyTimeSpent && s.completed_at) {
              // Old session without time_spent: estimate from session duration
              const start = new Date(s.started_at);
              const end = new Date(s.completed_at);
              const durationMinutes = (end.getTime() - start.getTime()) / 60000;
              // Use a more conservative estimate: assume 20% of session time was actual study
              sessionMinutes = durationMinutes * 0.2;
            } else if (!hasAnyTimeSpent && !s.completed_at) {
              // Active session without time_spent: don't count
              return sum;
            }
          }
          
          const roundedMinutes = Math.floor(sessionMinutes);
          // Cap at 2h per session to prevent outliers
          const cappedMinutes = Math.max(0, Math.min(roundedMinutes, 120));
          
          return sum + cappedMinutes;
        }, 0);
        
        return {
          day: weekDaysShort[date.getDay()],
          cards: dayCards,
          active: dayCards > 0,
          date: weekDays[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1),
          minutes: dayMinutes,
          sessionsCount: daySessions.length
        };
      });

      // Calculate streak
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      const { data: allSessions } = await (supabaseBrowser
        .from('study_sessions') as any)
        .select('started_at')
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false })
        .limit(100);

      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(checkDate);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const hasActivity = allSessions?.some((s: any) => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        });
        
        if (hasActivity) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate mastery rate: average of all today's sessions progress (completed + active)
      let masteryRate = 0;
      
      if (todaySessions && todaySessions.length > 0) {
        const sessionProgresses = todaySessions.map((s: any) => {
          // For completed sessions, check if 100% done
          if (s.completed) {
            return 100;
          }
          
          // For active sessions or incomplete, calculate current progress
          const currentIndex = s.session_state?.currentIndex || 0;
          const totalCards = s.total_cards || 1;
          const progress = (currentIndex / totalCards) * 100;
          
          return Math.min(100, Math.max(0, progress));
        });
        
        const totalProgress = sessionProgresses.reduce((sum: number, p: number) => sum + p, 0);
        masteryRate = Math.round(totalProgress / sessionProgresses.length);
        
        console.log('[Home] Sessions today:', todaySessions.length);
        console.log('[Home] Session progresses:', sessionProgresses);
        console.log('[Home] Average mastery:', masteryRate + '%');
      } else {
        console.log('[Home] No sessions today, mastery = 0%');
      }

      setStats({
        level,
        xpProgress,
        xpCurrent: totalXP,
        xpNext,
        cardsToday,
        minutesToday,
        masteryRate,
        currentStreak: streak,
        activeSessions: activeSessions || [],
        recentSets: setsWithCounts,
        weeklyActivity
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSet = async () => {
    setIsCreating(true);
    try {
      const setId = await createSetAndRedirect();
      router.push(`/sets/${setId}/edit`);
    } catch (error) {
      console.error('Failed to create set:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const xpToNext = stats.xpNext - stats.xpCurrent;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-content-emphasis">
          {stats.cardsToday > 0 ? '🎯' : '👋'} {profile?.username || t('student')}
        </h1>
        <p className="text-sm text-content-muted">
          {stats.cardsToday > 0 
            ? `${t('greatSession')} ${stats.cardsToday} ${t('cardsReviewed')}` 
            : stats.activeSessions.length > 0
            ? t('resumeWhereYouLeft')
            : t('readyToLearn')}
        </p>
      </div>

      {/* Level & XP */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primaryDark text-content-inverted text-xl font-bold shadow-lg">
                {stats.level}
              </div>
              <div>
                <div className="text-xs text-content-muted uppercase tracking-wider">{t('level')}</div>
                <div className="text-2xl font-bold text-content-emphasis">{stats.level}</div>
                <div className="text-xs text-content-muted mt-0.5">{xpToNext} {t('xpToNextLevel')} {stats.level + 1}</div>
              </div>
            </div>
            
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <Flame className="h-4 w-4 text-orange-500" />
                <div className="text-right">
                  <div className="text-xs text-orange-600 font-medium">{stats.currentStreak} {t('days')}</div>
                  <div className="text-[10px] text-orange-500 uppercase tracking-wider">{t('streak')}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-primary via-brand-primarySoft to-brand-primary transition-all duration-700 ease-out"
                style={{ width: `${stats.xpProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-muted">
              <span>{stats.xpCurrent} XP</span>
              <span className="font-medium">{Math.round(stats.xpProgress)}%</span>
              <span>{stats.xpNext} XP</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Invite Friends CTA */}
      <InviteFriendsCTA />

      {/* Today's Stats - Single Block */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-brand-primary" />
          <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider">{t('today')}</h2>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-border-subtle">
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.cardsToday}</div>
            <div className="text-xs text-content-muted mt-1">{t('cards')}</div>
          </div>
          
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.minutesToday}</div>
            <div className="text-xs text-content-muted mt-1">{t('minutes')}</div>
          </div>
          
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.masteryRate}%</div>
            <div className="text-xs text-content-muted mt-1">{t('mastery')}</div>
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Activity & Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Activity */}
          <Card className="p-5 sm:p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider">
                {t('activity7Days')}
              </h2>
              <span className="text-xs text-content-muted">
                {stats.weeklyActivity.reduce((sum: number, d: any) => sum + d.cards, 0)} {t('cardsTotal')}
              </span>
            </div>
            
            <div className="relative">
              <div className="flex items-end justify-between gap-2 h-24">
                {stats.weeklyActivity.map((day: any, idx: number) => {
                  const maxCards = Math.max(...stats.weeklyActivity.map((d: any) => d.cards), 1);
                  const height = day.cards > 0 ? (day.cards / maxCards) * 100 : 4;
                  const isToday = idx === stats.weeklyActivity.length - 1;
                  const isHovered = hoveredDay === idx;
                  
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center gap-2 relative"
                      onMouseEnter={() => setHoveredDay(idx)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                        <div
                          className={`
                            w-full rounded-t-lg transition-all duration-300 cursor-pointer
                            ${day.active 
                              ? isToday 
                                ? 'bg-brand-primary shadow-lg' 
                                : isHovered
                                  ? 'bg-brand-primary scale-105 shadow-md'
                                  : 'bg-brand-primary/70' 
                              : isHovered
                                ? 'bg-bg-emphasis scale-105'
                                : 'bg-bg-subtle'
                            }
                            ${isHovered ? 'ring-2 ring-brand-primary/30 ring-offset-2' : ''}
                          `}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                      </div>
                      <span className={`text-[10px] transition-all ${isToday || isHovered ? 'font-bold text-brand-primary' : 'text-content-muted'}`}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Tooltip */}
              {hoveredDay !== null && stats.weeklyActivity[hoveredDay] && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 pointer-events-none">
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-content-emphasis text-content-inverted px-4 py-3 rounded-xl shadow-2xl border border-white/10">
                      <div className="text-xs font-semibold mb-2 text-white/80">
                        {stats.weeklyActivity[hoveredDay].date}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-xs text-white/70">{t('cardsReviewedTooltip')}</span>
                          <span className="text-sm font-bold text-white">
                            {stats.weeklyActivity[hoveredDay].cards}
                          </span>
                        </div>
                        {stats.weeklyActivity[hoveredDay].minutes > 0 && (
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-white/70">{t('studyTime')}</span>
                            <span className="text-sm font-bold text-white">
                              {stats.weeklyActivity[hoveredDay].minutes}min
                            </span>
                          </div>
                        )}
                        {stats.weeklyActivity[hoveredDay].sessionsCount > 0 && (
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-white/70">{t('sessions')}</span>
                            <span className="text-sm font-bold text-white">
                              {stats.weeklyActivity[hoveredDay].sessionsCount}
                            </span>
                          </div>
                        )}
                        {stats.weeklyActivity[hoveredDay].cards === 0 && (
                          <div className="text-xs text-white/50 italic">
                            {t('noActivity')}
                          </div>
                        )}
                      </div>
                      {/* Triangle pointer */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-content-emphasis rotate-45 border-r border-b border-white/10" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Active Sessions */}
          {stats.activeSessions.length > 0 ? (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider">
                  {t('activeSessions')}
                </h2>
                <span className="px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                  {stats.activeSessions.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {stats.activeSessions.slice(0, 3).map((session: any) => {
                  const progress = session.session_state?.currentIndex || 0;
                  const total = session.total_cards || 1;
                  const percentage = Math.round((progress / total) * 100);
                  
                  return (
                    <div
                      key={session.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-bg-subtle hover:bg-bg-emphasis hover:border-brand-primary/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-content-emphasis truncate mb-1">
                          {session.sets?.title || 'Set sans titre'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-content-muted">
                          <span className="capitalize">{session.mode}</span>
                          <span>•</span>
                          <span>{progress}/{total} {t('cardsTotal')}</span>
                          <span>•</span>
                          <span className="text-brand-primary font-medium">{percentage}%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-bg-default rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <Link href={`/study/${session.set_id}?resume=${session.id}`}>
                        <Button size="sm" className="shrink-0">
                          <Play className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-5 sm:p-6 text-center">
              <div className="py-8">
                <BookOpen className="h-12 w-12 text-content-subtle mx-auto mb-3 opacity-50" />
                <p className="text-sm text-content-muted mb-4">{t('noActiveSessions')}</p>
                <Button onClick={handleCreateSet} disabled={isCreating}>
                  <Plus className="h-4 w-4" />
                  {t('createSet')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right - Quick Actions & Recent */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-5 sm:p-6 border-border-subtle">
            <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider mb-4">
              {t('actions')}
            </h2>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-between group"
                onClick={handleCreateSet}
                disabled={isCreating}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('createSet')}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
              
              <Link href="/dashboard" className="block">
                <div className="group flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border-subtle bg-bg-emphasis hover:border-border-default hover:bg-bg-subtle hover:shadow-card-hover transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-bg-subtle group-hover:bg-bg-emphasis transition-colors">
                      <BookOpen className="h-4 w-4 text-content-emphasis" />
                    </div>
                    <span className="text-[14px] font-medium text-content-emphasis">{t('mySets')}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-content-subtle opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/public-sets" className="block">
                <div className="group flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border-subtle bg-bg-emphasis hover:border-border-default hover:bg-bg-subtle hover:shadow-card-hover transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-bg-subtle group-hover:bg-bg-emphasis transition-colors">
                      <Sparkles className="h-4 w-4 text-content-emphasis" />
                    </div>
                    <span className="text-[14px] font-medium text-content-emphasis">{t('explore')}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-content-subtle opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Sets */}
          {stats.recentSets.length > 0 && (
            <Card className="p-5 sm:p-6 border-border-subtle">
              <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider mb-4">
                {t('recentSets')}
              </h2>
              <div className="space-y-2">
                {stats.recentSets.map((set: any) => (
                  <Link key={set.id} href={`/study/${set.id}`} className="block">
                    <div className="group flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border-subtle bg-bg-emphasis hover:border-border-default hover:bg-bg-subtle hover:shadow-card-hover transition-all cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-content-emphasis truncate mb-0.5">
                          {set.title || t('untitledSet')}
                        </div>
                        <div className="text-xs text-content-muted">
                          {set.cards} {set.cards > 1 ? t('cardsTotal') : t('card')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Play className="h-4 w-4 text-content-subtle group-hover:text-brand-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Daily Challenge */}
          <Card className="p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-primaryDark/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-brand-primary" />
                <h3 className="text-sm font-semibold text-content-emphasis">{t('dailyChallenge')}</h3>
              </div>
              <p className="text-xs text-content-muted mb-4">
                {t('review20Cards')} <span className="font-semibold text-brand-primary">+50 {t('plusXP')}</span>
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-muted">{t('progress')}</span>
                  <span className="font-medium text-content-emphasis">{stats.cardsToday}/20</span>
                </div>
                <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primaryDark transition-all duration-500"
                    style={{ width: `${Math.min((stats.cardsToday / 20) * 100, 100)}%` }}
                  />
                </div>
                {stats.cardsToday >= 20 && (
                  <div className="flex items-center gap-1.5 pt-2 text-xs text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Défi réussi !</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
