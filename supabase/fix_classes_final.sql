-- ============================================
-- Fix: Classes - Deletion, Short Codes, RLS
-- ============================================

-- 1. Function to generate short 6-character codes
CREATE OR REPLACE FUNCTION generate_short_class_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sans I, O, 0, 1 pour éviter confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Vérifier unicité
  WHILE EXISTS (SELECT 1 FROM public.classes WHERE class_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Modifier la table classes pour utiliser la nouvelle fonction
ALTER TABLE public.classes 
  ALTER COLUMN class_code SET DEFAULT generate_short_class_code();

-- 3. Fix RLS policies - Remove infinite recursion
-- Drop old policies
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update their classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete their classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their classes" ON public.classes;

-- Recreate policies without recursion
CREATE POLICY "Teachers can view their own classes"
  ON public.classes FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their classes"
  ON public.classes FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their classes"
  ON public.classes FOR DELETE
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their classes"
  ON public.classes FOR SELECT
  USING (
    id IN (
      SELECT cm.class_id 
      FROM public.class_memberships cm 
      WHERE cm.student_id = auth.uid()
    )
  );

-- 4. Update existing classes to have short codes
UPDATE public.classes 
SET class_code = generate_short_class_code()
WHERE LENGTH(class_code) > 6;

-- Success messages
DO $$
BEGIN
  RAISE NOTICE '✅ Short class codes function created (6 characters)';
  RAISE NOTICE '✅ RLS policies fixed (no more infinite recursion)';
  RAISE NOTICE '✅ Existing classes updated with short codes';
END $$;

