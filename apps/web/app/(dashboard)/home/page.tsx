'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Target, 
  Zap, 
  Award,
  Flame,
  Star,
  BarChart3,
  Play
} from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type UserStats = Database['public']['Tables']['user_stats']['Row'];
type Set = Database['public']['Tables']['sets']['Row'];

interface HomeStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  totalSets: number;
  totalFlashcards: number;
  totalStudyTime: number; // minutes
  totalSessions: number;
  averageScore: number;
  streak: number; // days
  recentSets: Set[];
  setsToReview: number;
}

export default function HomePage() {
  const { profile, user } = useAuthStore();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'recent' | 'review' | 'achievements'>('overview');

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const calculateXP = (userStats: UserStats | null): number => {
    if (!userStats) return 0;
    // XP calculation:
    // - 10 XP per flashcard created
    // - 5 XP per study session
    // - 1 XP per minute of study time
    // - 2 XP per correct answer (estimated from average score)
    const flashcardsXP = userStats.total_flashcards * 10;
    const sessionsXP = userStats.total_sessions * 5;
    const timeXP = userStats.total_study_time;
    const scoreXP = Math.floor((userStats.average_score / 100) * userStats.total_sessions * 2);
    return flashcardsXP + sessionsXP + timeXP + scoreXP;
  };

  const calculateLevel = (xp: number): { level: number; xpToNextLevel: number; currentLevelXP: number } => {
    // Level formula: level = floor(sqrt(xp / 100))
    // XP needed for level N: 100 * N^2
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)));
    const currentLevelXP = 100 * (level - 1) * (level - 1);
    const nextLevelXP = 100 * level * level;
    const xpToNextLevel = nextLevelXP - xp;
    return { level, xpToNextLevel: Math.max(0, xpToNextLevel), currentLevelXP };
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      if (!user) return;

      // Get user stats
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get recent sets
      const { data: recentSets } = await supabase
        .from('sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent study sessions for streak calculation
      const { data: recentSessions } = await supabase
        .from('study_sessions')
        .select('started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(30);

      // Calculate streak (consecutive days with study)
      const streak = calculateStreak((recentSessions || []).map(s => ({ started_at: s.started_at })));

      // Get sets to review (cards with next_review <= now)
      const { data: cardsToReview } = await supabase
        .from('card_progress')
        .select('flashcard_id, next_review')
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());

      const xp = calculateXP(userStats);
      const { level, xpToNextLevel, currentLevelXP } = calculateLevel(xp);

      setStats({
        totalXP: xp,
        level,
        xpToNextLevel,
        currentLevelXP,
        totalSets: userStats?.total_sets || 0,
        totalFlashcards: userStats?.total_flashcards || 0,
        totalStudyTime: userStats?.total_study_time || 0,
        totalSessions: userStats?.total_sessions || 0,
        averageScore: userStats?.average_score || 0,
        streak,
        recentSets: recentSets || [],
        setsToReview: new Set(cardsToReview?.map(c => c.flashcard_id) || []).size,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreak = (sessions: { started_at: string }[]): number => {
    if (sessions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if there's activity today
    const hasToday = sessions.some(s => {
      const sessionDate = new Date(s.started_at);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === currentDate.getTime();
    });
    
    if (!hasToday) {
      // If no activity today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days
    while (true) {
      const hasActivity = sessions.some(s => {
        const sessionDate = new Date(s.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });
      
      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">No stats available</p>
      </div>
    );
  }

  const nextLevelXP = stats.currentLevelXP + stats.xpToNextLevel;
  const progressPercentage = stats.xpToNextLevel > 0 
    ? ((stats.totalXP - stats.currentLevelXP) / (nextLevelXP - stats.currentLevelXP)) * 100
    : 100;

  return (
    <>
      {/* Welcome Header with XP */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[28px] font-bold text-white">
              Welcome back, {profile?.username}!
            </h1>
            <p className="text-[16px] text-dark-text-secondary mt-1">
              Continue your learning journey
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[12px] text-dark-text-muted uppercase tracking-wide">Level</div>
              <div className="text-[32px] font-bold text-brand-primary">{stats.level}</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark flex items-center justify-center border-4 border-dark-background-cardMuted">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-primary" />
              <span className="text-[16px] text-white">
                {stats.totalXP.toLocaleString()} XP
              </span>
            </div>
            <span className="text-[16px] text-white">
              {stats.xpToNextLevel > 0 ? `${stats.xpToNextLevel} XP to Level ${stats.level + 1}` : 'Max Level!'}
            </span>
          </div>
          <div className="w-full bg-dark-background-cardMuted rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-primary to-brand-primarySoft h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'recent', label: 'Récent', icon: Clock },
          { id: 'review', label: 'À réviser', icon: Target },
          { id: 'achievements', label: 'Succès', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-3 text-[14px] font-medium transition-all border-b-2
                ${activeTab === tab.id
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-dark-text-secondary hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-5 w-5 text-brand-primary" />
                <span className="text-[16px] text-white">Sets</span>
              </div>
              <div className="text-[16px] text-white">{stats.totalSets}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-brand-secondaryTeal" />
                <span className="text-[16px] text-white">Flashcards</span>
              </div>
              <div className="text-[16px] text-white">{stats.totalFlashcards}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-brand-accentYellow" />
                <span className="text-[16px] text-white">Temps d'étude</span>
              </div>
              <div className="text-[16px] text-white">
                {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-5 w-5 text-brand-accentPink" />
                <span className="text-[16px] text-white">Série</span>
              </div>
              <div className="text-[16px] text-white">{stats.streak} jours</div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-[16px] text-white mb-4">Actions rapides</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/sets/create">
                <Button className="w-full justify-start" variant="secondary">
                  <BookOpen className="h-4 w-4" />
                  Créer un set
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full justify-start" variant="secondary">
                  <Target className="h-4 w-4" />
                  Voir mes sets
                </Button>
              </Link>
              {stats.recentSets.length > 0 && (
                <Link href={`/study/${stats.recentSets[0].id}`}>
                  <Button className="w-full justify-start">
                    <Play className="h-4 w-4" />
                    Continuer à étudier
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Performance */}
          <Card className="p-6">
            <h2 className="text-[16px] text-white mb-4">Performance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[16px] text-white">Score moyen</span>
                  <span className="text-[16px] text-white">
                    {stats.averageScore.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-dark-background-cardMuted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand-primary to-brand-primarySoft h-2 rounded-full"
                    style={{ width: `${stats.averageScore}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-[16px] text-white">Sessions totales</div>
                  <div className="text-[16px] text-white">{stats.totalSessions}</div>
                </div>
                <div>
                  <div className="text-[16px] text-white">Cartes à réviser</div>
                  <div className="text-[16px] text-white">{stats.setsToReview}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          {stats.recentSets.length === 0 ? (
            <Card variant="emptyState" className="text-center py-12">
              <BookOpen className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
              <h3 className="text-[16px] text-white mb-2">Aucun set récent</h3>
              <p className="text-[16px] text-white mb-4">
                Créez votre premier set pour commencer
              </p>
              <Link href="/sets/create">
                <Button>Créer un set</Button>
              </Link>
            </Card>
          ) : (
            stats.recentSets.map((set) => (
              <Card key={set.id} className="p-6 hover:shadow-elevation-1 transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link href={`/sets/${set.id}`}>
                      <h3 className="text-[16px] text-white mb-1 hover:text-brand-primary transition-colors">
                        {set.title}
                      </h3>
                    </Link>
                    <p className="text-[16px] text-white line-clamp-2">
                      {set.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-[16px] text-white">
                      <span>{set.is_public ? 'Public' : 'Private'}</span>
                      <span>{new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Link href={`/study/${set.id}`}>
                    <Button>
                      <Play className="h-4 w-4" />
                      Étudier
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-4">
          {stats.setsToReview === 0 ? (
            <Card variant="emptyState" className="text-center py-12">
              <Target className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
              <h3 className="text-[16px] text-white mb-2">Rien à réviser</h3>
              <p className="text-[16px] text-white mb-4">
                Toutes vos cartes sont à jour ! Continuez à étudier pour en ajouter plus.
              </p>
              <Link href="/dashboard">
                <Button>Voir mes sets</Button>
              </Link>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-[16px] text-white">
                    {stats.setsToReview} cartes à réviser
                  </h3>
                  <p className="text-[16px] text-white">
                    Il est temps de réviser vos cartes pour maintenir votre progression
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button className="w-full">
                  <Play className="h-4 w-4" />
                  Commencer la révision
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Achievement Cards */}
            {[
              {
                id: 'first-set',
                title: 'Premier pas',
                description: 'Créez votre premier set',
                icon: BookOpen,
                unlocked: stats.totalSets > 0,
                color: 'from-brand-primary to-brand-primarySoft',
              },
              {
                id: 'flashcard-master',
                title: 'Maître des flashcards',
                description: 'Créez 100 flashcards',
                icon: Target,
                unlocked: stats.totalFlashcards >= 100,
                color: 'from-brand-secondaryTeal to-brand-primary',
              },
              {
                id: 'study-streak',
                title: 'Série de feu',
                description: 'Étudiez 7 jours consécutifs',
                icon: Flame,
                unlocked: stats.streak >= 7,
                color: 'from-brand-accentPink to-brand-accentYellow',
              },
              {
                id: 'time-master',
                title: 'Maître du temps',
                description: 'Étudiez pendant 10 heures',
                icon: Clock,
                unlocked: stats.totalStudyTime >= 600,
                color: 'from-brand-primary to-brand-secondaryTeal',
              },
              {
                id: 'perfectionist',
                title: 'Perfectionniste',
                description: 'Score moyen de 90% ou plus',
                icon: Star,
                unlocked: stats.averageScore >= 90,
                color: 'from-brand-accentYellow to-brand-primary',
              },
              {
                id: 'level-up',
                title: 'Niveau supérieur',
                description: 'Atteignez le niveau 10',
                icon: Trophy,
                unlocked: stats.level >= 10,
                color: 'from-brand-primary to-brand-accentPink',
              },
            ].map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card
                  key={achievement.id}
                  className={`p-6 ${achievement.unlocked ? '' : 'opacity-50'}`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-[16px] text-white mb-1">
                    {achievement.title}
                  </h3>
                  <p className="text-[16px] text-white">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <div className="mt-3 flex items-center gap-1 text-[16px] text-brand-primary">
                      <Award className="h-4 w-4" />
                      <span>Débloqué</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

