-- ============================================
-- Migration: Classes System for Teachers
-- Description: Allow teachers to create classes and students to join them
-- Date: 2025-12-08
-- ============================================

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
  -- Note: Role validation will be handled by RLS policies and application logic
);

-- Step 2: Create class_memberships table
CREATE TABLE IF NOT EXISTS public.class_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
  -- Note: Student role validation will be handled by RLS policies and application logic
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_id ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_student_id ON public.class_memberships(student_id);

-- Step 4: Add updated_at trigger for classes
CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for classes table

-- Teachers can view their own classes
CREATE POLICY "Teachers can view their own classes"
  ON public.classes FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can create classes (only if they are teachers)
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can update their own classes
CREATE POLICY "Teachers can update their classes"
  ON public.classes FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete their classes"
  ON public.classes FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can view classes they're members of
CREATE POLICY "Students can view their classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = classes.id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Step 7: RLS Policies for class_memberships table

-- Users can view their own memberships
CREATE POLICY "Students can view their memberships"
  ON public.class_memberships FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view memberships of their classes
CREATE POLICY "Teachers can view their class memberships"
  ON public.class_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_memberships.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can join classes (only if they are students)
CREATE POLICY "Students can join classes"
  ON public.class_memberships FOR INSERT
  WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students can leave classes
CREATE POLICY "Students can leave classes"
  ON public.class_memberships FOR DELETE
  USING (auth.uid() = student_id);

-- Teachers can remove students from their classes
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

-- Function to get class statistics
CREATE OR REPLACE FUNCTION get_class_stats(class_uuid UUID)
RETURNS TABLE (
  student_count INTEGER,
  module_count INTEGER,
  total_sets INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.class_memberships WHERE class_id = class_uuid),
    (SELECT COUNT(*)::INTEGER FROM public.class_modules WHERE class_id = class_uuid),
    (SELECT COUNT(DISTINCT s.id)::INTEGER 
     FROM public.class_modules cm
     JOIN public.folders f ON cm.module_id = f.id
     JOIN public.sets s ON s.folder_id = f.id
     WHERE cm.class_id = class_uuid);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to join a class by code
CREATE OR REPLACE FUNCTION join_class_by_code(
  p_class_code TEXT,
  p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_class_id UUID;
  v_student_role TEXT;
BEGIN
  -- Check if user is a student
  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;
  
  IF v_student_role != 'student' THEN
    RAISE EXCEPTION 'Only students can join classes';
  END IF;
  
  -- Find class by code
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE class_code = p_class_code;
  
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Class not found with code: %', p_class_code;
  END IF;
  
  -- Insert membership (will fail if already exists due to UNIQUE constraint)
  INSERT INTO public.class_memberships (class_id, student_id)
  VALUES (v_class_id, p_student_id)
  ON CONFLICT (class_id, student_id) DO NOTHING;
  
  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's classes
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

-- Function to get teacher's classes
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

-- Step 10: Comments for documentation
COMMENT ON TABLE public.classes IS 'Classes created by teachers to organize students and share modules';
COMMENT ON TABLE public.class_memberships IS 'Student memberships in classes';
COMMENT ON COLUMN public.classes.class_code IS 'Unique code that students use to join the class';
COMMENT ON COLUMN public.classes.teacher_id IS 'Teacher who created and owns the class';
COMMENT ON FUNCTION get_class_stats IS 'Get statistics for a class (student count, module count, set count)';
COMMENT ON FUNCTION join_class_by_code IS 'Allow a student to join a class using its code';
COMMENT ON FUNCTION get_student_classes IS 'Get all classes a student is a member of';
COMMENT ON FUNCTION get_teacher_classes IS 'Get all classes created by a teacher';

-- Verification queries (run separately to verify)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('classes', 'class_memberships');
-- SELECT COUNT(*) FROM public.classes;
-- SELECT COUNT(*) FROM public.class_memberships;

