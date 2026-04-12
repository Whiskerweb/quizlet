-- ============================================
-- Script de vérification du système d'amis
-- ============================================

-- 1. Vérifier que les tables existent
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('invitation_codes', 'friendships');

-- 2. Vérifier les colonnes de invitation_codes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invitation_codes'
ORDER BY ordinal_position;

-- 3. Vérifier les colonnes de friendships
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'friendships'
ORDER BY ordinal_position;

-- 4. Vérifier RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('invitation_codes', 'friendships');

-- 5. Vérifier les policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('invitation_codes', 'friendships')
ORDER BY tablename, policyname;

-- 6. Compter les entrées
SELECT 
  'invitation_codes' as table_name,
  COUNT(*) as row_count
FROM public.invitation_codes
UNION ALL
SELECT 
  'friendships' as table_name,
  COUNT(*) as row_count
FROM public.friendships;
