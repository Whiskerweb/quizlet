-- ============================================
-- SECURITY FIX: Clean up abandoned sessions
-- Runs daily to mark old incomplete sessions as abandoned
-- ============================================

-- Add abandoned column if not exists
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS abandoned BOOLEAN DEFAULT false;

-- Function to mark abandoned sessions
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mark sessions as abandoned if they haven't been updated in 7 days
  UPDATE public.study_sessions
  SET abandoned = true
  WHERE completed = false
  AND abandoned = false
  AND started_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE 'Marked % sessions as abandoned', v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (though this should be run via cron)
GRANT EXECUTE ON FUNCTION cleanup_abandoned_sessions() TO authenticated;

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_cleanup 
ON public.study_sessions(abandoned, completed, started_at) 
WHERE completed = false;

DO $$
BEGIN
  RAISE NOTICE '✅ SECURITY FIX: Session cleanup function and index created';
  RAISE NOTICE 'ℹ️  Run cleanup_abandoned_sessions() daily via cron or edge function';
END $$;
