-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cuid-like IDs (we'll use UUID instead)
-- Note: Supabase uses UUID for auth.users, so we'll use UUID for consistency

-- Custom function to generate cuid-like strings (for shareId, etc.)
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..25 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- User Profile Table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets Table
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_id TEXT UNIQUE DEFAULT generate_cuid(),
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  language TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards Table
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  "order" INTEGER DEFAULT 0,
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Sessions Table
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode TEXT NOT NULL, -- 'flashcard' | 'quiz' | 'writing' | 'match'
  score INTEGER,
  total_cards INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE
);

-- Answers Table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER, -- milliseconds
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE
);

-- Card Progress Table (for spaced repetition)
CREATE TABLE public.card_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ease_factor DECIMAL(10,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0, -- Days until next review
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_review TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- User Stats Table
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_sets INTEGER DEFAULT 0,
  total_flashcards INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- minutes
  total_sessions INTEGER DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set Stats Table
CREATE TABLE public.set_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  views INTEGER DEFAULT 0,
  studies INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  set_id UUID UNIQUE NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_sets_user_id ON public.sets(user_id);
CREATE INDEX idx_sets_is_public ON public.sets(is_public);
CREATE INDEX idx_sets_share_id ON public.sets(share_id);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_set_id ON public.study_sessions(set_id);
CREATE INDEX idx_answers_session_id ON public.answers(session_id);
CREATE INDEX idx_answers_flashcard_id ON public.answers(flashcard_id);
CREATE INDEX idx_card_progress_user_id ON public.card_progress(user_id);
CREATE INDEX idx_card_progress_flashcard_id ON public.card_progress(flashcard_id);
CREATE INDEX idx_card_progress_next_review ON public.card_progress(next_review);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON public.sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_progress_updated_at BEFORE UPDATE ON public.card_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_stats ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public profiles can be viewed by anyone (for usernames)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Sets Policies
CREATE POLICY "Users can view their own sets"
  ON public.sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public sets are viewable by everyone"
  ON public.sets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own sets"
  ON public.sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON public.sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON public.sets FOR DELETE
  USING (auth.uid() = user_id);

-- Flashcards Policies
CREATE POLICY "Users can view flashcards from their sets"
  ON public.flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = flashcards.set_id
      AND (sets.user_id = auth.uid() OR sets.is_public = true)
    )
  );

CREATE POLICY "Users can create flashcards in their sets"
  ON public.flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = flashcards.set_id
      AND sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards in their sets"
  ON public.flashcards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = flashcards.set_id
      AND sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards from their sets"
  ON public.flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = flashcards.set_id
      AND sets.user_id = auth.uid()
    )
  );

-- Study Sessions Policies
CREATE POLICY "Users can view their own sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Answers Policies
CREATE POLICY "Users can view answers from their sessions"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions
      WHERE study_sessions.id = answers.session_id
      AND study_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create answers in their sessions"
  ON public.answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_sessions
      WHERE study_sessions.id = answers.session_id
      AND study_sessions.user_id = auth.uid()
    )
  );

-- Card Progress Policies
CREATE POLICY "Users can view their own card progress"
  ON public.card_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card progress"
  ON public.card_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card progress"
  ON public.card_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User Stats Policies
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Set Stats Policies (readable by set owner and public)
CREATE POLICY "Set stats are viewable by set owner and public"
  ON public.set_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_stats.set_id
      AND (sets.user_id = auth.uid() OR sets.is_public = true)
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC Functions for stats
CREATE OR REPLACE FUNCTION increment_set_studies(set_id_param UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.set_stats (set_id, studies)
  VALUES (set_id_param, 1)
  ON CONFLICT (set_id) DO UPDATE
  SET studies = set_stats.studies + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_flashcard_count(set_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.set_stats
  SET total_flashcards = (
    SELECT COUNT(*) FROM public.flashcards WHERE set_id = set_id_param
  )
  WHERE set_id = set_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_flashcard_count(set_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.set_stats
  SET total_flashcards = GREATEST(0, (
    SELECT COUNT(*) FROM public.flashcards WHERE set_id = set_id_param
  ))
  WHERE set_id = set_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

