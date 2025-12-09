-- ============================================
-- Migration 02: Classes System for Teachers
-- Description: Allow teachers to create classes and students to join them
-- Date: 2025-12-08
-- Prerequisites: 01_add_teacher_role.sql must be executed first
-- ============================================

-- Check prerequisites
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    RAISE EXCEPTION 'Column profiles.role does not exist. Please run 01_add_teacher_role.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'generate_cuid') THEN
    RAISE EXCEPTION 'Function generate_cuid does not exist. Please run schema.sql first.';
  END IF;
END $$;

-- Step 1: Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT UNIQUE NOT NULL DEFAULT generate_cuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_image TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create class_memberships table
CREATE TABLE IF NOT EXISTS public.class_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_id ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_student_id ON public.class_memberships(student_id);

-- Step 4: Add updated_at trigger
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for classes

DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
CREATE POLICY "Teachers can view their own classes"
  ON public.classes FOR SELECT
  USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update their classes" ON public.classes;
CREATE POLICY "Teachers can update their classes"
  ON public.classes FOR UPDATE
  USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete their classes" ON public.classes;
CREATE POLICY "Teachers can delete their classes"
  ON public.classes FOR DELETE
  USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can view their classes" ON public.classes;
CREATE POLICY "Students can view their classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = classes.id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Step 7: RLS Policies for class_memberships

DROP POLICY IF EXISTS "Students can view their memberships" ON public.class_memberships;
CREATE POLICY "Students can view their memberships"
  ON public.class_memberships FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view their class memberships" ON public.class_memberships;
CREATE POLICY "Teachers can view their class memberships"
  ON public.class_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_memberships.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can join classes" ON public.class_memberships;
CREATE POLICY "Students can join classes"
  ON public.class_memberships FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can leave classes" ON public.class_memberships;
CREATE POLICY "Students can leave classes"
  ON public.class_memberships FOR DELETE
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can remove students" ON public.class_memberships;
CREATE POLICY "Teachers can remove students"
  ON public.class_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_memberships.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Step 8: Helper functions

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
    0::INTEGER, -- module_count will be updated when class_modules table is created
    0::INTEGER  -- total_sets will be updated when class_modules table is created
  ;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION join_class_by_code(
  p_class_code TEXT,
  p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_class_id UUID;
BEGIN
  -- Find class by code
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE class_code = p_class_code;
  
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Class not found with code: %', p_class_code;
  END IF;
  
  -- Insert membership
  INSERT INTO public.class_memberships (class_id, student_id)
  VALUES (v_class_id, p_student_id)
  ON CONFLICT (class_id, student_id) DO NOTHING;
  
  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_student_classes(p_student_id UUID)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_color TEXT,
  teacher_username TEXT,
  joined_at TIMESTAMPTZ,
  student_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.color,
    p.username,
    cm.joined_at,
    (SELECT COUNT(*)::INTEGER FROM public.class_memberships WHERE class_id = c.id)
  FROM public.class_memberships cm
  JOIN public.classes c ON c.id = cm.class_id
  JOIN public.profiles p ON p.id = c.teacher_id
  WHERE cm.student_id = p_student_id
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_teacher_classes(p_teacher_id UUID)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_code TEXT,
  class_color TEXT,
  created_at TIMESTAMPTZ,
  student_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.class_code,
    c.color,
    c.created_at,
    (SELECT COUNT(*)::INTEGER FROM public.class_memberships WHERE class_id = c.id)
  FROM public.classes c
  WHERE c.teacher_id = p_teacher_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 9: Grant permissions
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_memberships TO authenticated;

-- Step 10: Comments
COMMENT ON TABLE public.classes IS 'Classes created by teachers to organize students and share modules';
COMMENT ON TABLE public.class_memberships IS 'Student memberships in classes';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 02_add_classes_system completed successfully';
END $$;

