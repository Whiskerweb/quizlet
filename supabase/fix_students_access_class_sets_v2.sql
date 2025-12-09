-- ============================================
-- FIX: Allow students to access sets from class modules
-- VERSION 2: More robust policy check
-- ============================================

-- First, check if policies exist and drop them
DROP POLICY IF EXISTS "Students can view sets from class modules" ON public.sets;

-- Add RLS policy for students to view sets in their class modules
-- This policy must work alongside existing policies (OR condition)
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

-- Check if flashcards policy exists and drop it
DROP POLICY IF EXISTS "Students can view flashcards from class module sets" ON public.flashcards;

-- Add RLS policy for students to view flashcards from sets in their class modules
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
    OR
    -- Also allow if the set is public or owned by user (existing policies still apply)
    EXISTS (
      SELECT 1 
      FROM public.sets s
      WHERE flashcards.set_id = s.id
      AND (s.user_id = auth.uid() OR s.is_public = true)
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies added for students to access class module sets';
  RAISE NOTICE '   - Policy: Students can view sets from class modules';
  RAISE NOTICE '   - Policy: Students can view flashcards from class module sets';
END $$;

