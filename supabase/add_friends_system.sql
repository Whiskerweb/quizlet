-- ============================================
-- Migration: Friends & Invitation System
-- ============================================

-- Table pour les codes d'invitation
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 10,
  CONSTRAINT valid_uses CHECK (uses_count <= max_uses)
);

-- Table pour les amitiés
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_via_code TEXT REFERENCES public.invitation_codes(code),
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_invitation_codes_inviter ON public.invitation_codes(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);

-- RLS Policies
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Invitation codes: users can read their own codes
DROP POLICY IF EXISTS "Users can view their own invitation codes" ON public.invitation_codes;
CREATE POLICY "Users can view their own invitation codes"
  ON public.invitation_codes FOR SELECT
  USING (auth.uid() = inviter_id);

-- Invitation codes: users can create their own codes
DROP POLICY IF EXISTS "Users can create invitation codes" ON public.invitation_codes;
CREATE POLICY "Users can create invitation codes"
  ON public.invitation_codes FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Invitation codes: anyone can read valid codes (for signup)
DROP POLICY IF EXISTS "Anyone can read valid invitation codes" ON public.invitation_codes;
CREATE POLICY "Anyone can read valid invitation codes"
  ON public.invitation_codes FOR SELECT
  USING (expires_at > NOW() AND uses_count < max_uses);

-- Friendships: users can view their own friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friendships: users can create friendships (via invitation)
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friendships: users can delete their own friendships
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get friend count
CREATE OR REPLACE FUNCTION get_friend_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT friend_id)::INTEGER
  FROM public.friendships
  WHERE user_id = user_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.friendships
    WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
       OR (user_id = user2_uuid AND friend_id = user1_uuid)
  );
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE public.invitation_codes IS 'Invitation codes for friend system';
COMMENT ON TABLE public.friendships IS 'Friendships between users';
