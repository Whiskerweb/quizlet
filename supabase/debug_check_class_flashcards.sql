-- ============================================
-- Debug: Check flashcards in class modules
-- Cette requête liste tous les modules d'une classe avec leurs sets et le nombre de flashcards
-- ============================================

-- Option 1: Lister toutes les classes et leurs modules
SELECT 
  c.id as class_id,
  c.name as class_name,
  f.id as module_id,
  f.name as module_name,
  COUNT(DISTINCT s.id) as sets_count,
  COUNT(fc.id) as total_flashcards
FROM public.classes c
JOIN public.class_modules cm ON cm.class_id = c.id
JOIN public.folders f ON f.id = cm.module_id
LEFT JOIN public.sets s ON s.folder_id = f.id
LEFT JOIN public.flashcards fc ON fc.set_id = s.id
GROUP BY c.id, c.name, f.id, f.name
ORDER BY c.name, f.name;

-- Option 2: Pour une classe spécifique (remplacer 'VOTRE_CLASS_ID' par l'ID réel)
-- SELECT 
--   c.id as class_id,
--   c.name as class_name,
--   f.id as module_id,
--   f.name as module_name,
--   s.id as set_id,
--   s.title as set_title,
--   COUNT(fc.id) as flashcard_count
-- FROM public.classes c
-- JOIN public.class_modules cm ON cm.class_id = c.id
-- JOIN public.folders f ON f.id = cm.module_id
-- LEFT JOIN public.sets s ON s.folder_id = f.id
-- LEFT JOIN public.flashcards fc ON fc.set_id = s.id
-- WHERE c.id = 'VOTRE_CLASS_ID'::uuid
-- GROUP BY c.id, c.name, f.id, f.name, s.id, s.title
-- ORDER BY f.name, s.title;

-- Option 3: Trouver l'ID de votre classe d'abord
-- SELECT id, name, class_code FROM public.classes ORDER BY created_at DESC;



