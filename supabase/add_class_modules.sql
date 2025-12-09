-- ============================================
-- Migration: Class Modules System
-- Description: Allow teachers to share modules (folders) with their classes
-- Date: 2025-12-08
-- ============================================

-- Step 1: Create class_modules table
CREATE TABLE IF NOT EXISTS public.class_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, module_id)
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_modules_class_id ON public.class_modules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_modules_module_id ON public.class_modules(module_id);

-- Step 3: Enable Row Level Security
ALTER TABLE public.class_modules ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Teachers can view modules in their classes
CREATE POLICY "Teachers can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can add modules to their classes (must own the module)
CREATE POLICY "Teachers can add modules to their classes"
  ON public.class_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = class_modules.module_id
      AND folders.user_id = auth.uid()
    )
  );

-- Teachers can remove modules from their classes
CREATE POLICY "Teachers can remove modules from their classes"
  ON public.class_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view modules in their classes
CREATE POLICY "Students can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = class_modules.class_id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Step 5: Helper functions

-- Function to share a module with a class
CREATE OR REPLACE FUNCTION share_module_with_class(
  p_module_id UUID,
  p_class_id UUID,
  p_teacher_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_module_owner UUID;
  v_class_owner UUID;
  v_class_module_id UUID;
BEGIN
  -- Verify teacher owns the module
  SELECT user_id INTO v_module_owner
  FROM public.folders
  WHERE id = p_module_id;
  
  IF v_module_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this module';
  END IF;
  
  -- Verify teacher owns the class
  SELECT teacher_id INTO v_class_owner
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_class_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this class';
  END IF;
  
  -- Insert module into class (or do nothing if already exists)
  INSERT INTO public.class_modules (class_id, module_id)
  VALUES (p_class_id, p_module_id)
  ON CONFLICT (class_id, module_id) DO UPDATE
  SET shared_at = NOW()
  RETURNING id INTO v_class_module_id;
  
  RETURN v_class_module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get modules in a class
CREATE OR REPLACE FUNCTION get_class_modules(p_class_id UUID)
RETURNS TABLE (
  module_id UUID,
  module_name TEXT,
  module_color TEXT,
  shared_at TIMESTAMPTZ,
  sets_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.color,
    cm.shared_at,
    (SELECT COUNT(*)::INTEGER FROM public.sets WHERE folder_id = f.id)
  FROM public.class_modules cm
  JOIN public.folders f ON f.id = cm.module_id
  WHERE cm.class_id = p_class_id
  ORDER BY cm.shared_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get sets from a class module
CREATE OR REPLACE FUNCTION get_class_module_sets(
  p_class_id UUID,
  p_module_id UUID
)
RETURNS TABLE (
  set_id UUID,
  set_title TEXT,
  set_description TEXT,
  set_language TEXT,
  flashcard_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.language,
    (SELECT COUNT(*)::INTEGER FROM public.flashcards WHERE set_id = s.id),
    s.created_at
  FROM public.sets s
  WHERE s.folder_id = p_module_id
  AND EXISTS (
    SELECT 1 FROM public.class_modules
    WHERE class_id = p_class_id AND module_id = p_module_id
  )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to remove module from class
CREATE OR REPLACE FUNCTION remove_module_from_class(
  p_module_id UUID,
  p_class_id UUID,
  p_teacher_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_class_owner UUID;
BEGIN
  -- Verify teacher owns the class
  SELECT teacher_id INTO v_class_owner
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_class_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this class';
  END IF;
  
  -- Remove module from class
  DELETE FROM public.class_modules
  WHERE class_id = p_class_id AND module_id = p_module_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT ALL ON public.class_modules TO authenticated;

-- Step 7: Comments for documentation
COMMENT ON TABLE public.class_modules IS 'Modules (folders) shared by teachers with their classes';
COMMENT ON COLUMN public.class_modules.class_id IS 'The class receiving the shared module';
COMMENT ON COLUMN public.class_modules.module_id IS 'The module (folder) being shared';
COMMENT ON FUNCTION share_module_with_class IS 'Share a module with a class (teacher must own both)';
COMMENT ON FUNCTION get_class_modules IS 'Get all modules shared in a class';
COMMENT ON FUNCTION get_class_module_sets IS 'Get all sets from a specific module in a class';
COMMENT ON FUNCTION remove_module_from_class IS 'Remove a module from a class';

-- Verification queries (run separately to verify)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_modules';
-- SELECT COUNT(*) FROM public.class_modules;

