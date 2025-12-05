'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import { studyService } from '@/lib/supabase/study';
import { InviteFriendsCTA } from '@/components/InviteFriendsCTA';
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
  const router = useRouter();
  const { profile, user } = useAuthStore();
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
        .select('*, answers(is_correct)')
        .eq('user_id', user!.id)
        .gte('started_at', today.toISOString());

      const cardsToday = todaySessions?.reduce((sum: number, s: any) => {
        return sum + (s.answers?.length || 0);
      }, 0) || 0;

      // Minutes: only count completed sessions OR cap at 3h for active ones
      console.log('[Home] Today sessions:', todaySessions?.length);
      
      const minutesToday = todaySessions?.reduce((sum: number, s: any, idx: number) => {
        const start = new Date(s.started_at);
        
        // Only count completed sessions OR active sessions from today
        if (s.completed_at) {
          const end = new Date(s.completed_at);
          const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
          const cappedMinutes = Math.max(0, Math.min(minutes, 180)); // Cap at 3h per session
          console.log(`[Home] Session ${idx} (completed): ${minutes}min → ${cappedMinutes}min`);
          return sum + cappedMinutes;
        } else {
          // For active sessions, only count if started today
          const now = new Date();
          const sessionDate = new Date(s.started_at);
          sessionDate.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          if (sessionDate.getTime() === todayDate.getTime()) {
            const minutes = Math.floor((now.getTime() - start.getTime()) / 60000);
            const cappedMinutes = Math.max(0, Math.min(minutes, 180)); // Cap at 3h
            console.log(`[Home] Session ${idx} (active, today): ${minutes}min → ${cappedMinutes}min`);
            return sum + cappedMinutes;
          } else {
            console.log(`[Home] Session ${idx} (active, not today): IGNORED`);
          }
        }
        
        return sum;
      }, 0) || 0;
      
      console.log('[Home] Total minutes today:', minutesToday);

      const activeSessions = await studyService.getActiveSessions().catch(() => []);

      const { data: recentSets } = await (supabaseBrowser
        .from('sets') as any)
        .select('id, title')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      const setsWithCounts = await Promise.all(
        (recentSets || []).map(async (set) => {
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
        
        const daySessions = weekSessions?.filter(s => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= date && sessionDate < nextDate;
        }) || [];
        
        const dayCards = daySessions.reduce((sum: number, s: any) => sum + (s.answers?.length || 0), 0);
        
        const dayMinutes = daySessions.reduce((sum: number, s: any) => {
          if (s.completed_at) {
            const start = new Date(s.started_at);
            const end = new Date(s.completed_at);
            return sum + Math.floor((end.getTime() - start.getTime()) / 60000);
          }
          return sum;
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
        
        const hasActivity = allSessions?.some(s => {
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
        const sessionProgresses = todaySessions.map(s => {
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
          {stats.cardsToday > 0 ? '🎯' : '👋'} {profile?.username || 'Étudiant'}
        </h1>
        <p className="text-sm text-content-muted">
          {stats.cardsToday > 0 
            ? `Belle session ! ${stats.cardsToday} cartes révisées` 
            : stats.activeSessions.length > 0
            ? 'Reprenez là où vous en étiez'
            : 'Prêt à apprendre quelque chose de nouveau ?'}
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
                <div className="text-xs text-content-muted uppercase tracking-wider">Niveau</div>
                <div className="text-2xl font-bold text-content-emphasis">{stats.level}</div>
                <div className="text-xs text-content-muted mt-0.5">{xpToNext} XP jusqu'au niveau {stats.level + 1}</div>
              </div>
            </div>
            
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <Flame className="h-4 w-4 text-orange-500" />
                <div className="text-right">
                  <div className="text-xs text-orange-600 font-medium">{stats.currentStreak} jours</div>
                  <div className="text-[10px] text-orange-500 uppercase tracking-wider">Série</div>
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
          <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider">Aujourd'hui</h2>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-border-subtle">
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.cardsToday}</div>
            <div className="text-xs text-content-muted mt-1">Cartes</div>
          </div>
          
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.minutesToday}</div>
            <div className="text-xs text-content-muted mt-1">Minutes</div>
          </div>
          
          <div className="flex flex-col items-center py-2">
            <div className="text-3xl font-bold text-content-emphasis">{stats.masteryRate}%</div>
            <div className="text-xs text-content-muted mt-1">Maîtrise</div>
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
                Activité (7 jours)
              </h2>
              <span className="text-xs text-content-muted">
                {stats.weeklyActivity.reduce((sum: number, d: any) => sum + d.cards, 0)} cartes
              </span>
            </div>
            
            <div className="relative">
              <div className="flex items-end justify-between gap-2 h-24">
                {stats.weeklyActivity.map((day, idx) => {
                  const maxCards = Math.max(...stats.weeklyActivity.map(d => d.cards), 1);
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
                          <span className="text-xs text-white/70">Cartes révisées</span>
                          <span className="text-sm font-bold text-white">
                            {stats.weeklyActivity[hoveredDay].cards}
                          </span>
                        </div>
                        {stats.weeklyActivity[hoveredDay].minutes > 0 && (
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-white/70">Temps d'étude</span>
                            <span className="text-sm font-bold text-white">
                              {stats.weeklyActivity[hoveredDay].minutes}min
                            </span>
                          </div>
                        )}
                        {stats.weeklyActivity[hoveredDay].sessionsCount > 0 && (
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-white/70">Sessions</span>
                            <span className="text-sm font-bold text-white">
                              {stats.weeklyActivity[hoveredDay].sessionsCount}
                            </span>
                          </div>
                        )}
                        {stats.weeklyActivity[hoveredDay].cards === 0 && (
                          <div className="text-xs text-white/50 italic">
                            Aucune activité
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
                  Sessions en cours
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
                          <span>{progress}/{total} cartes</span>
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
                <p className="text-sm text-content-muted mb-4">Aucune session en cours</p>
                <Button onClick={handleCreateSet} disabled={isCreating}>
                  <Plus className="h-4 w-4" />
                  Créer un set
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right - Quick Actions & Recent */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider mb-4">
              Actions
            </h2>
            <div className="space-y-2">
              <Button
                className="w-full justify-between group"
                onClick={handleCreateSet}
                disabled={isCreating}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Créer un set</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
              
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full justify-between group">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Mes sets</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Button>
              </Link>

              <Link href="/public-sets">
                <Button variant="secondary" className="w-full justify-between group">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Explorer</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Sets */}
          {stats.recentSets.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-content-emphasis uppercase tracking-wider mb-4">
                Sets récents
              </h2>
              <div className="space-y-2">
                {stats.recentSets.map((set) => (
                  <Link key={set.id} href={`/study/${set.id}`}>
                    <div className="group p-3 rounded-lg border border-border-subtle bg-bg-subtle hover:bg-bg-emphasis hover:border-brand-primary/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-content-emphasis group-hover:text-brand-primary transition-colors truncate">
                            {set.title}
                          </div>
                          <div className="text-xs text-content-muted mt-0.5">
                            {set.cards} cartes
                          </div>
                        </div>
                        <Play className="h-4 w-4 text-content-muted group-hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all" />
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
                <h3 className="text-sm font-semibold text-content-emphasis">Défi du jour</h3>
              </div>
              <p className="text-xs text-content-muted mb-4">
                Révisez 20 cartes pour gagner <span className="font-semibold text-brand-primary">+50 XP</span>
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-muted">Progression</span>
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
