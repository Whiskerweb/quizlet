-- ============================================
-- FIX: Allow students to access sets from class modules
-- VERSION FINAL: Using RPC function for more control
-- ============================================

-- Step 1: Add RLS policy for students to view sets in their class modules
DROP POLICY IF EXISTS "Students can view sets from class modules" ON public.sets;
CREATE POLICY "Students can view sets from class modules"
  ON public.sets FOR SELECT
  USING (
    -- Set is in a module that is shared with a class the student belongs to
    EXISTS (
      SELECT 1 
      FROM public.class_modules cm
      JOIN public.class_memberships cmem ON cmem.class_id = cm.class_id
      JOIN public.folders f ON f.id = cm.module_id
      WHERE sets.folder_id = f.id
      AND cmem.student_id = auth.uid()
    )
  );

-- Step 2: Add RLS policy for flashcards
DROP POLICY IF EXISTS "Students can view flashcards from class module sets" ON public.flashcards;
CREATE POLICY "Students can view flashcards from class module sets"
  ON public.flashcards FOR SELECT
  USING (
    -- Flashcard is in a set that is in a module shared with a class the student belongs to
    EXISTS (
      SELECT 1 
      FROM public.sets s
      JOIN public.class_modules cm ON cm.module_id = s.folder_id
      JOIN public.class_memberships cmem ON cmem.class_id = cm.class_id
      WHERE flashcards.set_id = s.id
      AND cmem.student_id = auth.uid()
    )
  );

-- Step 3: Create RPC function to get set with flashcards for students
-- This bypasses RLS and ensures students can access sets from their class modules
CREATE OR REPLACE FUNCTION get_student_class_set(
  p_set_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  is_public BOOLEAN,
  tags TEXT[],
  language TEXT,
  user_id UUID,
  folder_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  flashcards JSONB
) AS $$
BEGIN
  -- Verify student is member of a class that has access to this set
  IF NOT EXISTS (
    SELECT 1
    FROM public.sets s
    JOIN public.class_modules cm ON cm.module_id = s.folder_id
    JOIN public.class_memberships cmem ON cmem.class_id = cm.class_id
    WHERE s.id = p_set_id
    AND cmem.student_id = p_student_id
  ) THEN
    -- Fallback: allow if set is public or owned by user
    IF NOT EXISTS (
      SELECT 1 FROM public.sets
      WHERE id = p_set_id
      AND (is_public = true OR user_id = p_student_id)
    ) THEN
      RAISE EXCEPTION 'Set not accessible';
    END IF;
  END IF;

  -- Return set with flashcards
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.is_public,
    s.tags,
    s.language,
    s.user_id,
    s.folder_id,
    s.created_at,
    s.updated_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', fc.id,
          'front', fc.front,
          'back', fc.back,
          'image_url', fc.image_url,
          'audio_url', fc.audio_url,
          'order', fc.order,
          'set_id', fc.set_id,
          'created_at', fc.created_at,
          'updated_at', fc.updated_at
        ) ORDER BY fc.order
      )
      FROM public.flashcards fc
      WHERE fc.set_id = s.id
    ) AS flashcards
  FROM public.sets s
  WHERE s.id = p_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_class_set(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies and RPC function created for students to access class module sets';
END $$;

