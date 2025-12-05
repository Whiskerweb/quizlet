# 🔍 Guide de Dépannage - Système d'Amis

## ❌ Problème : "0 amis" même après avoir invité quelqu'un

### 🎯 Étapes de diagnostic

---

## ÉTAPE 1 : Vérifier la page de debug

1. Va sur `/debug-friends` dans ton navigateur
2. Regarde la section "État des tables"
3. **Si tu vois "DOES NOT EXIST"** → Les tables n'ont pas été créées

---

## ÉTAPE 2 : Vérifier dans Supabase Dashboard

### A. Vérifier si les tables existent

1. Va sur **Supabase Dashboard**
2. Clique sur **"Table Editor"** (dans le menu de gauche)
3. Cherche les tables :
   - `invitation_codes`
   - `friendships`

**❌ Si elles n'existent pas :**
- La migration n'a pas été exécutée correctement
- Passe à l'étape 3

**✅ Si elles existent :**
- Passe à l'étape 4

---

## ÉTAPE 3 : Appliquer la migration (VERSION CORRIGÉE)

### Option A : Via SQL Editor (Recommandé)

1. Va sur **Supabase Dashboard**
2. Clique sur **"SQL Editor"**
3. Clique sur **"New Query"**
4. Copie **TOUT** le contenu du fichier :
   ```
   supabase/add_friends_system_fixed.sql
   ```
5. Colle-le dans l'éditeur SQL
6. Clique sur **"RUN"** (ou Ctrl+Enter)
7. **Attends le message de succès** ✅

### Que fait cette migration ?

- ✅ Supprime les anciennes tables (si elles existent)
- ✅ Crée les tables `invitation_codes` et `friendships`
- ✅ Ajoute les **permissions GRANT** (important !)
- ✅ Configure les **RLS policies**
- ✅ Crée les **fonctions** helper

### ⚠️ Messages d'erreur possibles

**Erreur : "permission denied for schema public"**
- Tu n'as pas les droits admin sur Supabase
- Vérifie que tu es sur le bon projet

**Erreur : "relation already exists"**
- Les tables existent déjà
- Utilise `DROP TABLE IF EXISTS` (déjà dans le script)

---

## ÉTAPE 4 : Vérifier que tout est OK

Après avoir appliqué la migration :

1. Va sur **SQL Editor**
2. Copie et exécute le contenu de :
   ```
   supabase/verify_friends_tables.sql
   ```
3. Tu devrais voir :
   - ✅ Les 2 tables existent
   - ✅ RLS est activé
   - ✅ Les policies sont créées

---

## ÉTAPE 5 : Tester la génération de code

1. Va sur `/debug-friends`
2. Clique sur **"Tester génération de code"**
3. Un popup devrait apparaître avec :
   - Le code d'invitation (ex: `AB12CD34`)
   - Le lien complet (ex: `https://cardz.dev/register?invite=AB12CD34`)

**❌ Si tu as une erreur :**
- Regarde la console du navigateur (F12)
- Envoie-moi l'erreur exacte

---

## ÉTAPE 6 : Tester l'invitation complète

### A. Créer un compte invité

1. Génère un code d'invitation
2. Copie le lien d'invitation
3. **Ouvre une fenêtre de navigation privée** (ou un autre navigateur)
4. Colle le lien et crée un nouveau compte

### B. Vérifier la création d'amitié

1. Retourne sur ton compte principal
2. Rafraîchis la page `/debug-friends`
3. **Tu devrais voir :**
   - Dans "Relations d'amitié" : 1 entrée
   - Dans "Service Friends - getMyFriends()" : 1 ami
   - Dans "Service Friends - getFriendCount()" : 1

4. Va sur `/profile/ton-username`
5. **Tu devrais voir :** "1 ami" à côté de tes cardz publics

---

## 🐛 Problèmes courants

### "0 amis" mais la table friendships contient des données

**Cause possible :** Les RLS policies bloquent l'accès

**Solution :**
```sql
-- Vérifie les policies
SELECT * FROM pg_policies 
WHERE tablename = 'friendships';

-- Si elles sont manquantes, réexécute la migration
```

### Erreur "relation 'invitation_codes' does not exist"

**Cause :** La migration n'a pas été exécutée

**Solution :**
- Réexécute `supabase/add_friends_system_fixed.sql`

### Erreur "permission denied" lors de l'insertion

**Cause :** Permissions manquantes

**Solution :**
```sql
GRANT ALL ON public.invitation_codes TO authenticated;
GRANT ALL ON public.friendships TO authenticated;
```

### Le lien d'invitation donne 404

**Cause :** Corrigé dans le dernier commit

**Solution :**
- Vérifie que tu as la dernière version
- Le lien doit être `/register?invite=CODE` (pas `/signup`)

---

## 📊 Requêtes SQL utiles pour déboguer

### Voir tous mes codes d'invitation
```sql
SELECT * FROM public.invitation_codes 
WHERE inviter_id = auth.uid();
```

### Voir toutes mes amitiés
```sql
SELECT * FROM public.friendships 
WHERE user_id = auth.uid() OR friend_id = auth.uid();
```

### Voir tous mes amis avec leurs infos
```sql
SELECT 
  f.id,
  f.created_at,
  p.username,
  p.avatar_url
FROM public.friendships f
JOIN public.profiles p ON p.id = f.friend_id
WHERE f.user_id = auth.uid();
```

### Compter mes amis
```sql
SELECT COUNT(*) as friend_count
FROM public.friendships
WHERE user_id = auth.uid();
```

---

## ✅ Checklist finale

Avant de dire "ça ne fonctionne pas", vérifie :

- [ ] Les tables `invitation_codes` et `friendships` existent
- [ ] RLS est activé sur les 2 tables
- [ ] Les policies sont créées (au moins 4 pour chaque table)
- [ ] Les permissions GRANT sont appliquées
- [ ] Tu peux générer un code d'invitation sans erreur
- [ ] Le lien d'invitation pointe vers `/register` (pas `/signup`)
- [ ] L'utilisateur invité a bien créé son compte via le lien
- [ ] Tu as rafraîchi la page après l'invitation

---

## 🆘 Besoin d'aide ?

Si rien ne fonctionne après avoir suivi toutes ces étapes :

1. Va sur `/debug-friends`
2. Fais une capture d'écran de TOUTE la page
3. Ouvre la console du navigateur (F12)
4. Va dans l'onglet "Console"
5. Fais une capture des erreurs (s'il y en a)
6. Envoie-moi les 2 captures

---

**Dernière mise à jour :** Version avec migration corrigée incluant les GRANT permissions
