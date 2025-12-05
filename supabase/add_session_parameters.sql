-- ============================================
-- Migration: Add Session Parameters
-- ============================================
-- Cette migration ajoute des colonnes à la table study_sessions
-- pour permettre la persistance des paramètres de session
-- (shuffle, start_from, card_order, session_state)
--
-- ⚠️ IMPORTANT: Cette migration N'AFFECTE PAS les données existantes
-- - Aucune carte (flashcards) n'est modifiée
-- - Aucun set n'est modifié
-- - Les sessions existantes continuent de fonctionner
-- - Les nouvelles colonnes ont des valeurs par défaut

-- Add session parameters to study_sessions table
-- This allows sessions to persist their configuration (shuffle, start_from, card order, etc.)

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS shuffle BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS start_from INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS card_order JSONB, -- Array of flashcard IDs in order
  ADD COLUMN IF NOT EXISTS session_state JSONB; -- Full session state for resuming

-- Add comments for documentation
COMMENT ON COLUMN public.study_sessions.shuffle IS 'Whether cards are shuffled in this session';
COMMENT ON COLUMN public.study_sessions.start_from IS 'Starting card index (1-based) - allows starting from a specific card';
COMMENT ON COLUMN public.study_sessions.card_order IS 'Array of flashcard IDs in the order they appear in this session (preserves shuffle or subset)';
COMMENT ON COLUMN public.study_sessions.session_state IS 'Full session state including progress, mastered cards, incorrect cards queue, etc. for resuming';

-- Create index for querying active sessions by user
-- This speeds up the "resume session" feature
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON public.study_sessions(user_id, completed, started_at DESC);

-- ============================================
-- Verification Query (Optional - run after migration)
-- ============================================
-- Uncomment and run this to verify the migration:
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'study_sessions'
  AND column_name IN ('shuffle', 'start_from', 'card_order', 'session_state')
ORDER BY column_name;
*/

-- ============================================
-- IMPACT ANALYSIS
-- ============================================
-- ✅ Tables NON affectées:
--    - flashcards (aucune modification)
--    - sets (aucune modification)
--    - profiles (aucune modification)
--    - folders (aucune modification)
--    - answers (aucune modification)
--
-- ✅ Table modifiée:
--    - study_sessions (ajout de 4 colonnes optionnelles)
--
-- ✅ Sessions existantes:
--    - Continuent de fonctionner normalement
--    - Nouvelles colonnes = NULL ou valeurs par défaut
--    - Aucune donnée perdue
--
-- ✅ Rollback possible:
--    ALTER TABLE public.study_sessions
--      DROP COLUMN IF EXISTS shuffle,
--      DROP COLUMN IF EXISTS start_from,
--      DROP COLUMN IF EXISTS card_order,
--      DROP COLUMN IF EXISTS session_state;
