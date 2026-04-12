-- ============================================
-- ⚠️ URGENT FIX: Allow students to access flashcards from class modules
-- Execute this in Supabase SQL Editor NOW
-- ============================================

-- Step 1: Ensure students can view sets from class modules
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

-- Step 2: Ensure students can view flashcards from class module sets
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

-- Step 3: Keep the existing policy for owner/public sets (don't remove it)
-- This ensures users can still see their own sets and public sets

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated - Students can now access flashcards from class modules';
END $$;



