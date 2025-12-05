import { supabaseBrowser } from '../supabaseBrowserClient';

export interface InvitationCode {
  id: string;
  code: string;
  inviter_id: string;
  created_at: string;
  expires_at: string;
  uses_count: number;
  max_uses: number;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  invited_via_code?: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export const friendsService = {
  /**
   * Generate a new invitation code
   */
  async generateInviteCode(): Promise<InvitationCode> {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await (supabaseBrowser
      .from('invitation_codes') as any)
      .insert({
        code,
        inviter_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as InvitationCode;
  },

  /**
   * Get user's invitation codes
   */
  async getMyInviteCodes(): Promise<InvitationCode[]> {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await (supabaseBrowser
      .from('invitation_codes') as any)
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as InvitationCode[];
  },

  /**
   * Validate and use an invitation code
   */
  async useInviteCode(code: string, newUserId: string): Promise<void> {
    console.log('[FriendsService] useInviteCode START', { code, newUserId });
    
    // Get invitation code
    const { data: inviteCode, error: codeError } = await (supabaseBrowser
      .from('invitation_codes') as any)
      .select('*')
      .eq('code', code)
      .single();

    console.log('[FriendsService] Invite code lookup result:', { 
      found: !!inviteCode, 
      error: codeError?.message,
      inviteCode 
    });

    if (codeError || !inviteCode) {
      console.error('[FriendsService] Code lookup failed:', codeError);
      throw new Error('Code d\'invitation invalide');
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(inviteCode.expires_at);
    if (expiresAt < now) {
      console.error('[FriendsService] Code expired:', { expiresAt, now });
      throw new Error('Code d\'invitation expiré');
    }

    // Check if max uses reached
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      console.error('[FriendsService] Code exhausted:', { 
        uses_count: inviteCode.uses_count, 
        max_uses: inviteCode.max_uses 
      });
      throw new Error('Code d\'invitation épuisé');
    }

    console.log('[FriendsService] Code valid, checking existing friendship...');

    // Check if already friends
    const { data: existingFriendship, error: checkError } = await (supabaseBrowser
      .from('friendships') as any)
      .select('*')
      .or(`and(user_id.eq.${newUserId},friend_id.eq.${inviteCode.inviter_id}),and(user_id.eq.${inviteCode.inviter_id},friend_id.eq.${newUserId})`)
      .maybeSingle();

    console.log('[FriendsService] Existing friendship check:', { 
      exists: !!existingFriendship,
      error: checkError?.message,
      existingFriendship
    });

    if (existingFriendship) {
      // Already friends, just increment counter
      console.log('[FriendsService] Already friends, incrementing counter');
      const { error: updateError } = await (supabaseBrowser
        .from('invitation_codes') as any)
        .update({ uses_count: inviteCode.uses_count + 1 })
        .eq('id', inviteCode.id);
      
      if (updateError) {
        console.error('[FriendsService] Failed to increment counter:', updateError);
      }
      return;
    }

    console.log('[FriendsService] Creating bidirectional friendship...', {
      friendship1: { user_id: newUserId, friend_id: inviteCode.inviter_id },
      friendship2: { user_id: inviteCode.inviter_id, friend_id: newUserId }
    });

    // Create bidirectional friendship
    const { data: friendship1Data, error: friendship1Error } = await (supabaseBrowser
      .from('friendships') as any)
      .insert({
        user_id: newUserId,
        friend_id: inviteCode.inviter_id,
        invited_via_code: code,
      })
      .select()
      .single();

    console.log('[FriendsService] Friendship 1 result:', { 
      success: !friendship1Error,
      error: friendship1Error?.message,
      data: friendship1Data
    });

    if (friendship1Error) {
      console.error('[FriendsService] Friendship 1 failed:', friendship1Error);
      throw friendship1Error;
    }

    const { data: friendship2Data, error: friendship2Error } = await (supabaseBrowser
      .from('friendships') as any)
      .insert({
        user_id: inviteCode.inviter_id,
        friend_id: newUserId,
        invited_via_code: code,
      })
      .select()
      .single();

    console.log('[FriendsService] Friendship 2 result:', { 
      success: !friendship2Error,
      error: friendship2Error?.message,
      data: friendship2Data
    });

    if (friendship2Error) {
      console.error('[FriendsService] Friendship 2 failed:', friendship2Error);
      throw friendship2Error;
    }

    // Increment uses count
    console.log('[FriendsService] Incrementing uses count...');
    const { error: incrementError } = await (supabaseBrowser
      .from('invitation_codes') as any)
      .update({ uses_count: inviteCode.uses_count + 1 })
      .eq('id', inviteCode.id);

    if (incrementError) {
      console.error('[FriendsService] Failed to increment uses count:', incrementError);
    } else {
      console.log('[FriendsService] useInviteCode SUCCESS ✅');
    }
  },

  /**
   * Get user's friends
   */
  async getMyFriends(): Promise<Friend[]> {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get friendships
    const { data: friendships, error: friendshipsError } = await (supabaseBrowser
      .from('friendships') as any)
      .select('friend_id, created_at')
      .eq('user_id', user.id);

    if (friendshipsError) throw friendshipsError;
    if (!friendships || friendships.length === 0) return [];

    // Get friend IDs
    const friendIds = (friendships as any[]).map((f: any) => f.friend_id);

    // Get profiles for these friends
    const { data: profiles, error: profilesError } = await (supabaseBrowser
      .from('profiles') as any)
      .select('id, username, avatar_url')
      .in('id', friendIds);

    if (profilesError) throw profilesError;

    // Merge friendships with profiles
    return (friendships as any[]).map((friendship: any) => {
      const profile = (profiles as any[] || []).find((p: any) => p.id === friendship.friend_id);
      return {
        id: (profile?.id || friendship.friend_id) as string,
        username: (profile?.username || 'Unknown') as string,
        avatar_url: profile?.avatar_url as string | undefined,
        created_at: friendship.created_at as string,
      };
    });
  },

  /**
   * Get friend count
   */
  async getFriendCount(userId?: string): Promise<number> {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return 0;

    const { count, error } = await (supabaseBrowser
      .from('friendships') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<void> {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Remove both directions
    await (supabaseBrowser
      .from('friendships') as any)
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
  },

  /**
   * Get invitation link
   */
  getInviteLink(code: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return `${baseUrl}/register?invite=${code}`;
  },
};
