'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Calendar } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Set = Database['public']['Tables']['sets']['Row'];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const usernameParam = params.username as string;
  const { user: currentUser, profile: currentProfile } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [usernameParam, currentUser, currentProfile]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      // If username is "me", use current user's profile
      if (usernameParam === 'me') {
        if (!currentUser) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        // Try to get current user's profile by user ID
        const { data: profileData, error: profileError } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Failed to load profile:', profileError);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (!profileData) {
          // Profile doesn't exist, try to create it
          await createProfileForUser(currentUser.id, currentUser.email || '');
          // Reload after creation
          const { data: newProfileData } = await supabaseBrowser
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
          
          if (newProfileData) {
            setProfile(newProfileData as Profile);
            setIsOwnProfile(true);
            await loadUserSets(currentUser.id);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(profileData as Profile);
          setIsOwnProfile(true);
          await loadUserSets(currentUser.id);
        }
        
        setIsLoading(false);
        return;
      }

      // Otherwise, fetch profile by username
      const { data: profileData, error: profileError } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('username', usernameParam)
        .maybeSingle();

      if (profileError) {
        console.error('Profile not found:', profileError);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if (!profileData) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setProfile(profileData as Profile);
      setIsOwnProfile(currentUser?.id === profileData.id);

      // Load sets for this profile
      await loadUserSets(profileData.id);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfileForUser = async (userId: string, userEmail: string): Promise<void> => {
    try {
      setIsCreatingProfile(true);
      
      // Generate username from email
      const emailUsername = userEmail.split('@')[0];
      const baseUsername = emailUsername || `user_${userId.substring(0, 8)}`;

      // Try to create profile using RPC function if it exists
      try {
        await (supabaseBrowser.rpc as any)('create_or_update_profile', {
          user_id: userId,
          user_email: userEmail,
          user_username: baseUsername,
          user_first_name: null,
          user_last_name: null,
        });
      } catch (rpcError) {
        // If RPC function doesn't exist or fails, try direct insert
        console.warn('RPC function failed, trying direct insert:', rpcError);

        // Check for username conflicts and generate a unique one
        let finalUsername = baseUsername;
        let counter = 0;
        let usernameExists = true;

        while (usernameExists && counter < 100) {
          const { data: conflictCheck } = await supabaseBrowser
            .from('profiles')
            .select('id')
            .eq('username', finalUsername)
            .limit(1);

          if (!conflictCheck || conflictCheck.length === 0) {
            usernameExists = false;
          } else {
            counter++;
            finalUsername = `${baseUsername}_${counter}`;
          }
        }

        // Insert the profile
        const { error: insertError } = await supabaseBrowser
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            username: finalUsername,
          });

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const loadUserSets = async (userId: string) => {
    try {
      const { data: setsData, error: setsError } = await supabaseBrowser
        .from('sets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true) // Only show public sets on profile
        .order('created_at', { ascending: false });

      if (setsError) {
        console.error('Failed to load sets:', setsError);
        return;
      }

      setSets((setsData || []) as Set[]);
    } catch (error) {
      console.error('Failed to load sets:', error);
    }
  };

  if (isLoading || isCreatingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Profil introuvable</h2>
          <p className="text-dark-text-secondary mb-4">
            {usernameParam === 'me'
              ? 'Votre profil n\'a pas pu être créé. Veuillez réessayer.'
              : `Aucun profil trouvé avec le nom d'utilisateur "${usernameParam}".`}
          </p>
          {usernameParam === 'me' && (
            <Button onClick={() => loadProfileData()}>
              Réessayer
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark flex items-center justify-center border-4 border-dark-background-cardMuted">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {profile.username}
            </h1>
            {profile.first_name || profile.last_name ? (
              <p className="text-dark-text-secondary mb-4">
                {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 text-sm text-dark-text-secondary">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Public Sets */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          {isOwnProfile ? 'Mes sets publics' : 'Sets publics'}
        </h2>
        {sets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-dark-text-secondary">
              {isOwnProfile
                ? "Vous n'avez pas encore de sets publics."
                : "Cet utilisateur n'a pas encore de sets publics."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => (
              <Card key={set.id} className="p-4 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-white mb-2">{set.title}</h3>
                <p className="text-sm text-dark-text-secondary line-clamp-2 mb-4">
                  {set.description || 'Aucune description'}
                </p>
                <div className="flex items-center justify-between text-xs text-dark-text-muted">
                  <span>{new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                  {set.tags && set.tags.length > 0 && (
                    <span className="px-2 py-1 bg-dark-background-cardMuted rounded">
                      {set.tags[0]}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
