-- ============================================
-- Migration 03: Class Modules (CLEAN VERSION)
-- Description: Drop old table and recreate with correct schema
-- Date: 2025-12-08
-- ============================================

-- Step 0: Drop old table if exists
DROP TABLE IF EXISTS public.class_modules CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS share_module_with_class(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_class_modules(UUID);
DROP FUNCTION IF EXISTS get_class_module_sets(UUID, UUID);
DROP FUNCTION IF EXISTS remove_module_from_class(UUID, UUID, UUID);

-- Check prerequisites
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'folders') THEN
    RAISE EXCEPTION 'Table folders does not exist. Please run add_folders.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'classes') THEN
    RAISE EXCEPTION 'Table classes does not exist. Please run 02_add_classes_system_CLEAN.sql first.';
  END IF;
END $$;

-- Step 1: Create class_modules table
CREATE TABLE public.class_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, module_id)
);

-- Step 2: Create indexes
CREATE INDEX idx_class_modules_class_id ON public.class_modules(class_id);
CREATE INDEX idx_class_modules_module_id ON public.class_modules(module_id);

-- Step 3: Enable RLS
ALTER TABLE public.class_modules ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies
CREATE POLICY "Teachers can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

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

CREATE POLICY "Teachers can remove modules from their classes"
  ON public.class_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = class_modules.class_id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Step 5: Update get_class_stats function to include modules
CREATE OR REPLACE FUNCTION get_class_stats(class_uuid UUID)
RETURNS TABLE (
  student_count INTEGER,
  module_count INTEGER,
  total_sets INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.class_memberships WHERE class_id = class_uuid), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.class_modules WHERE class_id = class_uuid), 0),
    COALESCE((SELECT COUNT(DISTINCT s.id)::INTEGER 
     FROM public.class_modules cm
     JOIN public.folders f ON f.id = cm.module_id
     JOIN public.sets s ON s.folder_id = f.id
     WHERE cm.class_id = class_uuid), 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 6: Helper functions
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
  SELECT user_id INTO v_module_owner
  FROM public.folders
  WHERE id = p_module_id;
  
  IF v_module_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this module';
  END IF;
  
  SELECT teacher_id INTO v_class_owner
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_class_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this class';
  END IF;
  
  INSERT INTO public.class_modules (class_id, module_id)
  VALUES (p_class_id, p_module_id)
  ON CONFLICT (class_id, module_id) DO UPDATE
  SET shared_at = NOW()
  RETURNING id INTO v_class_module_id;
  
  RETURN v_class_module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION remove_module_from_class(
  p_module_id UUID,
  p_class_id UUID,
  p_teacher_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_class_owner UUID;
BEGIN
  SELECT teacher_id INTO v_class_owner
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_class_owner != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this class';
  END IF;
  
  DELETE FROM public.class_modules
  WHERE class_id = p_class_id AND module_id = p_module_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant permissions
GRANT ALL ON public.class_modules TO authenticated;

-- Step 8: Comments
COMMENT ON TABLE public.class_modules IS 'Modules shared by teachers with their classes';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 03_add_class_modules completed successfully';
  RAISE NOTICE '   - Table: class_modules';
  RAISE NOTICE '   - Functions: share_module_with_class, get_class_modules, get_class_module_sets, remove_module_from_class';
END $$;

