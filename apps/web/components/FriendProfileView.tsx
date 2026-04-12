'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { friendsService } from '@/lib/supabase/friends';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import {
  Heart,
  TrendingUp,
  Calendar,
  Share2,
  Eye,
  UserMinus,
  Sparkles,
  Target,
  Zap,
  Award,
  BookOpen,
  Clock,
  BarChart3,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface FriendProfileViewProps {
  friendProfile: any;
  currentUserId: string;
  onUnfriend?: () => void;
}

export function FriendProfileView({ friendProfile, currentUserId, onUnfriend }: FriendProfileViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [mySets, setMySets] = useState<any[]>([]);
  const [friendSets, setFriendSets] = useState<any[]>([]);
  const [sharedToFriend, setSharedToFriend] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriendData();
  }, [friendProfile.id]);

  const loadFriendData = async () => {
    try {
      setIsLoading(true);

      // Load friend stats
      const { data: userStats } = await (supabaseBrowser
        .from('user_stats') as any)
        .select('*')
        .eq('user_id', friendProfile.id)
        .single();

      // Load friend's public sets
      const { data: sets } = await (supabaseBrowser
        .from('sets') as any)
        .select('*')
        .eq('user_id', friendProfile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Load my sets that I can share
      const { data: mySetsData } = await (supabaseBrowser
        .from('sets') as any)
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      // Load sets I've already shared with this friend
      const { data: sharedData } = await (supabaseBrowser
        .from('shared_sets') as any)
        .select('set_id')
        .eq('shared_by_user_id', currentUserId)
        .eq('user_id', friendProfile.id);

      setStats(userStats || {});
      setFriendSets(sets || []);
      setMySets(mySetsData || []);
      setSharedToFriend((sharedData || []).map((s: any) => s.set_id));
    } catch (error) {
      console.error('Failed to load friend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareSet = async (setId: string) => {
    try {
      await sharedSetsService.shareSetWithUser(friendProfile.id, setId);
      setSharedToFriend([...sharedToFriend, setId]);
      alert(`✅ Set partagé avec ${friendProfile.username} !`);
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleAddFriendSet = async (setId: string) => {
    try {
      await sharedSetsService.shareSet(setId);
      alert('✅ Set ajouté à ta liste !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleUnfriend = async () => {
    if (!confirm(`Supprimer ${friendProfile.username} de tes amis ?`)) return;

    try {
      await friendsService.removeFriend(friendProfile.id);
      alert('Ami supprimé');
      if (onUnfriend) onUnfriend();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-content-muted">Chargement des données de ton ami...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Friend Badge & Actions */}
      <Card className="relative overflow-hidden border-2 border-brand-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-primarySoft/5" />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white shadow-lg">
                <Heart className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-content-emphasis">Ton ami</span>
                  <Sparkles className="h-5 w-5 text-brand-primary" />
                </div>
                <p className="text-sm text-content-muted">
                  Vous révisez ensemble depuis le{' '}
                  {new Date(friendProfile.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnfriend}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <UserMinus className="h-4 w-4" />
              <span className="hidden sm:inline">Retirer</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowShareModal(!showShareModal)} className="flex-1 sm:flex-none">
              <Share2 className="h-4 w-4" />
              Partager un cardz
            </Button>
            <Link href={`/profile/${friendProfile.username}#sets`} className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4" />
                Voir ses cardz
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Friend Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-emphasis">
                {stats?.total_flashcards || 0}
              </p>
              <p className="text-xs text-content-muted">Cartes créées</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-emphasis">
                {stats?.average_score ? `${Math.round(stats.average_score)}%` : '0%'}
              </p>
              <p className="text-xs text-content-muted">Réussite moy.</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-emphasis">
                {stats?.current_streak || 0}
              </p>
              <p className="text-xs text-content-muted">Jours de suite</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <Award className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-emphasis">
                {friendSets.length}
              </p>
              <p className="text-xs text-content-muted">Cardz publics</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Share My Sets Modal */}
      {showShareModal && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-brand-primary" />
                <h3 className="font-semibold text-content-emphasis">
                  Partager mes cardz avec {friendProfile.username}
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-content-muted hover:text-content-emphasis"
              >
                ×
              </button>
            </div>

            {mySets.length === 0 ? (
              <p className="text-center py-8 text-content-muted">
                Tu n'as pas encore de cardz à partager
              </p>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {mySets.map((set) => {
                  const alreadyShared = sharedToFriend.includes(set.id);
                  return (
                    <div
                      key={set.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:border-brand-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-content-emphasis truncate">
                          {set.title}
                        </p>
                        <p className="text-xs text-content-muted truncate">
                          {set.description || 'Aucune description'}
                        </p>
                      </div>
                      {alreadyShared ? (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          <Heart className="h-3 w-3" />
                          Partagé
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleShareSet(set.id)}
                          className="ml-3 shrink-0"
                        >
                          <Share2 className="h-3 w-3" />
                          Partager
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Friend's Public Sets */}
      {friendSets.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-brand-primary" />
              <h3 className="font-semibold text-content-emphasis">
                Cardz publics de {friendProfile.username} ({friendSets.length})
              </h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {friendSets.map((set) => (
                <div
                  key={set.id}
                  className="rounded-lg border border-border-subtle p-4 hover:border-brand-primary/30 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-content-emphasis truncate">
                        {set.title}
                      </h4>
                      <p className="text-xs text-content-muted truncate mt-1">
                        {set.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Link href={`/sets/${set.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-3 w-3" />
                        Voir
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleAddFriendSet(set.id)}
                      className="flex-1"
                    >
                      <Share2 className="h-3 w-3" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
