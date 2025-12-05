'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { setsService } from '@/lib/supabase/sets';
import { friendsService, type Friend } from '@/lib/supabase/friends';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PasswordPromptModal } from '@/components/PasswordPromptModal';
import { User, Lock, Share2, BookOpen, Trash2, Play, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Set = Database['public']['Tables']['sets']['Row'];
type SharedSetWithDetails = {
  id: string;
  set_id: string;
  user_id: string;
  shared_by_user_id: string;
  created_at: string;
  updated_at: string;
  set: Set & {
    profiles: {
      username: string;
      avatar: string | null;
    };
  };
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { profile: currentProfile, user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [publicSets, setPublicSets] = useState<Set[]>([]);
  const [sharedSets, setSharedSets] = useState<SharedSetWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'shared'>('public');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedSetTitle, setSelectedSetTitle] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const isOwnProfile = currentProfile?.username === username;

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (profile && isOwnProfile && user) {
      loadFriends();
    } else if (profile && !isOwnProfile) {
      loadFriendCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isOwnProfile, user]);

  useEffect(() => {
    if (activeTab === 'shared' && user) {
      loadSharedSets();
    }
  }, [activeTab, user]);

  const loadFriends = async () => {
    try {
      const friendsList = await friendsService.getMyFriends();
      setFriends(friendsList);
      setFriendCount(friendsList.length);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadFriendCount = async () => {
    if (!profile) return;
    try {
      const count = await friendsService.getFriendCount(profile.id);
      setFriendCount(count);
    } catch (error) {
      console.error('Failed to load friend count:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const supabase = supabaseBrowser;
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error('Profile not found:', profileError);
        return;
      }

      // Type assertion needed because TypeScript may not infer the type correctly from Supabase query
      const typedProfileData = profileData as Profile;
      
      setProfile(typedProfileData);

      // Load public sets for this user
      // Garde : on vérifie que typedProfileData existe avant d'utiliser son id
      if (!typedProfileData) {
        console.error('Profile data is null');
        return;
      }

      const { data: setsData, error: setsError } = await supabase
        .from('sets')
        .select('*')
        .eq('user_id', typedProfileData.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (setsError) {
        console.error('Failed to load sets:', setsError);
      } else {
        setPublicSets(setsData || []);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedSets = async () => {
    try {
      const data = await sharedSetsService.getMySharedSets();
      setSharedSets(data);
    } catch (error) {
      console.error('Failed to load shared sets:', error);
    }
  };

  const handleAddSet = async (setId: string) => {
    const set = publicSets.find(s => s.id === setId);
    if (!set) return;

    // Check if password is required
    const requiresPassword = !!set.password_hash;
    
    if (requiresPassword) {
      setSelectedSetId(setId);
      setSelectedSetTitle(set.title);
      setPasswordModalOpen(true);
    } else {
      // Add directly
      try {
        await sharedSetsService.shareSet(setId);
        await loadSharedSets();
        if (activeTab === 'shared') {
          setActiveTab('shared');
        }
      } catch (error: any) {
        alert(error.message || 'Erreur lors de l\'ajout du set');
      }
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedSetId) return;

    try {
      await sharedSetsService.shareSet(selectedSetId, password);
      await loadSharedSets();
      setPasswordModalOpen(false);
      setSelectedSetId(null);
      setSelectedSetTitle('');
      if (activeTab !== 'shared') {
        setActiveTab('shared');
      }
    } catch (error: any) {
      throw error; // Let the modal handle the error
    }
  };

  const handleRemoveSharedSet = async (sharedSetId: string) => {
    if (!confirm('Voulez-vous retirer ce set de votre liste ?')) return;

    try {
      await sharedSetsService.removeSharedSet(sharedSetId);
      await loadSharedSets();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-content-muted">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-content-muted">Profil non trouvé</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-bg-subtle flex items-center justify-center border-2 border-border-subtle">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="h-full w-full rounded-full" />
            ) : (
              <User className="h-8 w-8 text-content-muted" />
            )}
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-content-emphasis">{profile.username}</h1>
            <div className="flex items-center gap-4 text-[16px] text-content-muted">
              <span>
                {publicSets.length} {publicSets.length === 1 ? 'Cardz public' : 'Cardz publics'}
              </span>
              <span>•</span>
              <button
                onClick={() => isOwnProfile ? setShowFriendsModal(true) : null}
                className={`flex items-center gap-1.5 ${isOwnProfile ? 'hover:text-brand-primary transition-colors cursor-pointer' : 'cursor-default'}`}
              >
                <Users className="h-4 w-4" />
                <span>{friendCount} ami{friendCount !== 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-muted">
          <button
            onClick={() => setActiveTab('public')}
            className={`
              px-4 py-3 text-[14px] font-medium transition-all border-b-2
              ${activeTab === 'public'
                ? 'border-brand-primary text-content-emphasis'
                : 'border-transparent text-content-muted hover:text-content-emphasis'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Cardz publics</span>
            </div>
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('shared')}
              className={`
                px-4 py-3 text-[14px] font-medium transition-all border-b-2
                ${activeTab === 'shared'
                  ? 'border-brand-primary text-content-emphasis'
                  : 'border-transparent text-content-muted hover:text-content-emphasis'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Cardz partagés</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'public' && (
        <div className="space-y-4">
          {publicSets.length === 0 ? (
            <Card variant="emptyState" className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-content-subtle mx-auto mb-4" />
              <h3 className="text-[16px] text-content-emphasis mb-2">Aucun set public</h3>
              <p className="text-[15px] text-content-muted">
                {isOwnProfile ? 'Rendez vos Cardz publics pour qu\'ils apparaissent ici' : 'Cet utilisateur n\'a pas de Cardz publics'}
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicSets.map((set) => (
                <Card key={set.id} className="h-full transition-shadow hover:shadow-card">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                    <p className="text-[14px] text-content-muted line-clamp-2 mt-2">
                      {set.description || 'No description'}
                    </p>
                  </CardHeader>
                  <div className="px-6 pb-6 space-y-3">
                    <div className="flex items-center justify-between text-[14px] text-content-subtle">
                      <span>{set.is_public ? 'Public' : 'Private'}</span>
                      {set.password_hash && (
                        <div className="flex items-center gap-1 text-brand-primary">
                          <Lock className="h-4 w-4" />
                          <span className="text-[12px]">Protégé</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/sets/${set.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          Voir
                        </Button>
                      </Link>
                      {user && !isOwnProfile && (
                        <Button
                          onClick={() => handleAddSet(set.id)}
                          className="flex-1"
                          size="sm"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shared' && user && (
        <div className="space-y-4">
          {sharedSets.length === 0 ? (
            <Card variant="emptyState" className="py-12 text-center">
              <Share2 className="h-12 w-12 text-content-subtle mx-auto mb-4" />
              <h3 className="text-[16px] text-content-emphasis mb-2">Aucun set partagé</h3>
              <p className="text-[15px] text-content-muted">
                Les Cardz que vous ajoutez depuis les profils d'autres utilisateurs apparaîtront ici
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedSets.map((sharedSet) => (
                <Card key={sharedSet.id} className="h-full transition-shadow hover:shadow-card">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-bg-subtle flex items-center justify-center">
                        <User className="h-3 w-3 text-content-muted" />
                      </div>
                      <span className="text-[12px] text-content-muted">
                        Par {sharedSet.set.profiles?.username || 'Utilisateur'}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{sharedSet.set.title}</CardTitle>
                    <p className="text-[14px] text-content-muted line-clamp-2 mt-2">
                      {sharedSet.set.description || 'No description'}
                    </p>
                  </CardHeader>
                  <div className="px-6 pb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/sets/${sharedSet.set.id}`} className="flex-1 mr-2">
                        <Button variant="outline" className="w-full" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Étudier
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveSharedSet(sharedSet.id)}
                        size="sm"
                        className="text-state-danger border-state-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <PasswordPromptModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setSelectedSetId(null);
          setSelectedSetTitle('');
        }}
        onSubmit={handlePasswordSubmit}
        setTitle={selectedSetTitle}
      />

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFriendsModal(false)}>
          <div className="bg-bg-default rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-primary" />
                <h2 className="text-lg font-semibold text-content-emphasis">
                  Mes amis ({friendCount})
                </h2>
              </div>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="p-2 hover:bg-bg-subtle rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-content-muted" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {friends.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-content-subtle mx-auto mb-3 opacity-50" />
                  <p className="text-content-muted">Vous n'avez pas encore d'amis</p>
                  <p className="text-content-subtle text-sm mt-2">
                    Invitez vos amis pour réviser ensemble !
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {friends.map((friend: any) => (
                    <Link
                      key={friend.id}
                      href={`/profile/${friend.username}`}
                      onClick={() => setShowFriendsModal(false)}
                      className="flex items-center gap-3 p-4 hover:bg-bg-subtle transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-bg-emphasis flex items-center justify-center border border-border-subtle">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt={friend.username} className="h-full w-full rounded-full" />
                        ) : (
                          <User className="h-5 w-5 text-content-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content-emphasis truncate">
                          {friend.username}
                        </p>
                        <p className="text-xs text-content-muted">
                          Ami depuis {new Date(friend.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
