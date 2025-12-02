# Unification du client Supabase côté navigateur

## ✅ Modifications effectuées

### 1. Client Supabase unique (`apps/web/lib/supabaseBrowserClient.ts`)

**Fichier créé** qui exporte une seule instance de client Supabase pour tout le front :

```typescript
'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';

export const supabaseBrowser = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
```

**Configuration** :
- `persistSession: true` → La session est sauvegardée dans localStorage
- `detectSessionInUrl: true` → Détecte automatiquement le hash fragment OAuth (#access_token=...)
- `autoRefreshToken: true` → Rafraîchit automatiquement le token
- Types Database inclus pour le typage complet

### 2. Services mis à jour

Tous les services utilisent maintenant `supabaseBrowser` au lieu de créer leur propre instance :

- ✅ `apps/web/lib/supabase/folders.ts`
- ✅ `apps/web/lib/supabase/sets.ts`
- ✅ `apps/web/lib/supabase/flashcards.ts`
- ✅ `apps/web/lib/supabase/shared-sets.ts`

**Logs ajoutés** dans les fonctions critiques :
- `[Folders service] getAll - current session` → Vérifie la session avant getAll
- `[Folders service] getWithSets - current session` → Vérifie la session avant getWithSets
- `[Folders service] create - current session` → Vérifie la session avant create
- `[Sets service] getMySets - current session` → Vérifie la session avant getMySets
- `[Sets service] create - current session` → Vérifie la session avant create

### 3. Pages et composants mis à jour

Tous les composants client utilisent maintenant `supabaseBrowser` :

- ✅ `apps/web/app/(auth)/login/page.tsx`
- ✅ `apps/web/app/(auth)/register/page.tsx`
- ✅ `apps/web/app/(dashboard)/home/page.tsx`
- ✅ `apps/web/app/(dashboard)/profile/[username]/page.tsx`
- ✅ `apps/web/app/(dashboard)/folders/[id]/page.tsx`
- ✅ `apps/web/store/authStore.ts`
- ✅ `apps/web/components/auth/GoogleLoginButton.tsx`

### 4. Vérification de session

Tous les services utilisent maintenant `getSession()` au lieu de `getUser()` :

```typescript
// AVANT
const { data: { user } } = await supabase.auth.getUser();

// APRÈS
const { data: { session } } = await supabaseBrowser.auth.getSession();
const user = session?.user;
```

## 📋 Fichiers modifiés

### Services
1. `apps/web/lib/supabase/folders.ts` - Toutes les fonctions utilisent `supabaseBrowser`
2. `apps/web/lib/supabase/sets.ts` - Toutes les fonctions utilisent `supabaseBrowser`
3. `apps/web/lib/supabase/flashcards.ts` - Toutes les fonctions utilisent `supabaseBrowser`
4. `apps/web/lib/supabase/shared-sets.ts` - Toutes les fonctions utilisent `supabaseBrowser`

### Pages
5. `apps/web/app/(auth)/login/page.tsx`
6. `apps/web/app/(auth)/register/page.tsx`
7. `apps/web/app/(dashboard)/home/page.tsx`
8. `apps/web/app/(dashboard)/profile/[username]/page.tsx`
9. `apps/web/app/(dashboard)/folders/[id]/page.tsx`

### Store et composants
10. `apps/web/store/authStore.ts`
11. `apps/web/components/auth/GoogleLoginButton.tsx`

## 🔍 Logs de debug

Les logs suivants sont maintenant disponibles dans la console :

### Folders Service
- `[Folders service] getAll - current session` → Affiche l'ID utilisateur avant getAll
- `[Folders service] getWithSets - current session` → Affiche l'ID utilisateur avant getWithSets
- `[Folders service] create - current session` → Affiche l'ID utilisateur avant create

### Sets Service
- `[Sets service] getMySets - current session` → Affiche l'ID utilisateur avant getMySets
- `[Sets service] create - current session` → Affiche l'ID utilisateur avant create

## ✅ Résultat attendu

Après ces modifications :

- ✅ Un seul `createClient()` utilisé côté navigateur (`supabaseBrowser`)
- ✅ Plus d'erreur "Multiple GoTrueClient instances detected"
- ✅ Toutes les requêtes utilisent la même session utilisateur
- ✅ Les requêtes "app" (folders, sets, etc.) fonctionnent correctement
- ✅ Les logs permettent de vérifier que la session est bien présente dans les services

## 🐛 Si une erreur persiste

Vérifiez les logs dans la console :
1. `[Folders service] getAll - current session` doit afficher un `userId`
2. `[Sets service] getMySets - current session` doit afficher un `userId`
3. `[Sets service] create - current session` doit afficher un `userId`

Si ces logs affichent `undefined`, cela signifie que la session n'est pas disponible dans les services. Dans ce cas, vérifiez que :
- Le layout du dashboard a bien autorisé l'accès (session présente)
- La session est bien persistée dans localStorage
- Aucun autre client Supabase n'est créé ailleurs



