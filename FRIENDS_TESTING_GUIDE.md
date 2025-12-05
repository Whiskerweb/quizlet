# 🧪 Guide de Test Complet - Système d'Amis

## 🎯 Objectif

Ce guide te permet de tester et déboguer complètement le système d'invitation et d'amis.

---

## 📍 Pages de test disponibles

### 1. `/debug-friends` - Page de diagnostic
- Affiche l'état des tables (existent-elles ?)
- Montre tes codes d'invitation
- Liste tes relations d'amitié
- Teste les fonctions du service

### 2. `/test-invite` - Page de test du flux d'invitation
- Teste chaque étape du processus d'invitation
- Logs détaillés de toutes les opérations
- Simule l'utilisation d'un code d'invitation

---

## 🚀 Test complet du flux d'invitation (Étape par étape)

### ÉTAPE 1 : Vérifier que les tables existent

1. **Va sur** `/debug-friends`
2. **Regarde** la section "🗄️ État des tables"
3. **Tu devrais voir** :
   - `invitation_codes: EXISTS` ✅
   - `friendships: EXISTS` ✅

**❌ Si tu vois "DOES NOT EXIST"** :
- Les tables n'ont pas été créées
- Va sur Supabase Dashboard → SQL Editor
- Exécute `supabase/add_friends_system_fixed.sql`

---

### ÉTAPE 2 : Générer un code d'invitation

#### Option A : Depuis `/debug-friends`

1. Clique sur **"🧪 Test complet du flux"**
2. Un popup s'affiche avec :
   - Le code généré (ex: `AB12CD34`)
   - Le lien d'invitation (copié dans le presse-papier)
3. **Ouvre la console** (F12) pour voir les logs détaillés

#### Option B : Depuis la home page

1. Va sur `/home` ou `/dashboard`
2. Clique sur le CTA **"Invite tes amis"**
3. Clique sur **"Générer mon lien d'invitation"**
4. Ton code et lien apparaissent

---

### ÉTAPE 3 : Tester la recherche du code

1. **Va sur** `/test-invite`
2. **Colle ton code** dans le champ
3. **Clique sur** "🔍 Rechercher le code"
4. **Tu devrais voir** :
   ```
   ✅ Code trouvé !
   ℹ️ Inviter ID: xxx-xxx-xxx
   ℹ️ Créé le: ...
   ℹ️ Expire le: ...
   ℹ️ Utilisations: 0/10
   ✅ Code valide et non expiré
   ✅ Utilisations restantes: 10
   ```

**❌ Si le code n'est pas trouvé** :
- Vérifie que tu as bien copié le code complet
- Va sur `/debug-friends` → vérifie que le code existe dans "🎟️ Codes d'invitation"

---

### ÉTAPE 4 : Simuler l'utilisation du code (Méthode 1 - Sur même compte)

**⚠️ Attention** : Cette méthode teste juste la fonction, mais ne crée pas vraiment une amitié valide (car tu ne peux pas être ami avec toi-même).

1. **Sur** `/test-invite`
2. **Entre ton code**
3. **Clique sur** "🎯 Utiliser le code"
4. **Regarde les logs** dans la console (F12)

**Logs attendus** :
```
[FriendsService] useInviteCode START
[FriendsService] Invite code lookup result: { found: true, ... }
[FriendsService] Code valid, checking existing friendship...
[FriendsService] Creating bidirectional friendship...
[FriendsService] Friendship 1 result: { success: true, ... }
[FriendsService] Friendship 2 result: { success: true, ... }
[FriendsService] useInviteCode SUCCESS ✅
```

---

### ÉTAPE 5 : Test réel avec un nouveau compte (Méthode 2 - Vraie invitation)

C'est le **vrai test** qui simule une invitation réelle.

#### 5.1 Génère ton code

1. Sur ton compte principal, va sur `/debug-friends`
2. Clique sur "🧪 Test complet du flux"
3. **Le lien est copié** dans ton presse-papier
4. **Note le code** quelque part

#### 5.2 Crée un nouveau compte

1. **Ouvre une fenêtre de navigation privée** (Ctrl+Shift+N sur Chrome)
2. **Colle le lien** d'invitation (ex: `https://cardz.dev/register?invite=AB12CD34`)
3. Tu devrais voir le message : 🎉 Vous avez été invité !
4. **Crée un nouveau compte** avec :
   - Email différent
   - Username différent
   - Mot de passe

#### 5.3 Vérifie la création de l'amitié

**Sur le nouveau compte :**

1. Va sur `/test-invite`
2. Entre le code d'invitation
3. Clique sur "👥 Mes amitiés (raw)"
4. Tu devrais voir 1 amitié

**Sur ton compte principal :**

1. Retourne sur ton compte principal
2. Va sur `/debug-friends`
3. Clique sur "Rafraîchir"
4. **Tu devrais voir** :
   - `👥 Relations d'amitié (1)` : 1 entrée
   - `getMyFriends()` : Le nouveau compte
   - `getFriendCount()` : 1

5. Va sur ton profil (`/profile/ton-username`)
6. **Tu devrais voir** : "1 ami"
7. Clique dessus → Modal avec le nouvel ami

---

## 🐛 Dépannage

### Problème : "Code d'invitation invalide"

**Causes possibles :**
1. Le code n'existe pas dans la DB
2. Faute de frappe dans le code
3. Les tables n'existent pas

**Solution :**
- Va sur `/test-invite`
- Entre le code
- Clique sur "🔍 Rechercher le code"
- Regarde les logs détaillés

---

### Problème : "Permission denied for table invitation_codes"

**Cause :** Les permissions GRANT n'ont pas été appliquées

**Solution :**
```sql
GRANT ALL ON public.invitation_codes TO authenticated;
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.invitation_codes TO anon;
GRANT ALL ON public.friendships TO anon;
```

Ou réexécute `supabase/add_friends_system_fixed.sql` qui contient déjà ces permissions.

---

### Problème : L'amitié n'apparaît pas dans le profil

**Causes possibles :**
1. `getMyFriends()` échoue (problème de JOIN)
2. Le composant profile ne charge pas les amis
3. Cache du navigateur

**Solutions :**

1. **Teste getMyFriends()** :
   - Va sur `/test-invite`
   - Clique sur "📋 getMyFriends()"
   - Vérifie les logs

2. **Vérifie les données brutes** :
   - Va sur `/test-invite`
   - Clique sur "👥 Mes amitiés (raw)"
   - Si tu vois des données → Le problème est dans getMyFriends()
   - Si tu ne vois rien → L'amitié n'a pas été créée

3. **Rafraîchis le cache** :
   - Ctrl+Shift+R (Chrome)
   - Vide le cache du navigateur

---

### Problème : "Could not find a relationship between 'friendships' and 'friend_id'"

**Cause :** Problème de syntaxe dans le JOIN Supabase

**Solution :** Déjà corrigé dans le dernier commit. `getMyFriends()` fait maintenant :
1. Récupère les friendships
2. Extrait les friend_ids
3. Récupère les profils séparément
4. Fusionne les données

---

## 📊 Requêtes SQL utiles

### Voir tous les codes d'invitation
```sql
SELECT * FROM public.invitation_codes 
ORDER BY created_at DESC;
```

### Voir toutes les amitiés
```sql
SELECT * FROM public.friendships 
ORDER BY created_at DESC;
```

### Compter les amis d'un utilisateur
```sql
SELECT user_id, COUNT(*) as friend_count
FROM public.friendships
GROUP BY user_id;
```

### Voir les amitiés avec les infos des profils
```sql
SELECT 
  f.id,
  f.created_at,
  f.invited_via_code,
  p1.username as user_username,
  p2.username as friend_username
FROM public.friendships f
LEFT JOIN public.profiles p1 ON p1.id = f.user_id
LEFT JOIN public.profiles p2 ON p2.id = f.friend_id
ORDER BY f.created_at DESC;
```

---

## ✅ Checklist de vérification

Avant de dire "ça ne fonctionne pas", vérifie :

- [ ] Les tables existent (`/debug-friends` → État des tables)
- [ ] RLS est activé sur les 2 tables
- [ ] Les permissions GRANT sont appliquées
- [ ] Tu peux générer un code sans erreur
- [ ] Le code généré est trouvé lors d'une recherche (`/test-invite`)
- [ ] Le lien d'invitation pointe vers `/register?invite=CODE`
- [ ] La page register détecte le paramètre `invite` dans l'URL
- [ ] La page register affiche le message "🎉 Vous avez été invité !"
- [ ] Le code register appelle `friendsService.useInviteCode()`
- [ ] La console affiche les logs `[FriendsService]` lors de l'utilisation du code
- [ ] Les 2 friendships sont créées (bidirectionnelles)
- [ ] `getMyFriends()` retourne les amis (`/test-invite` → "📋 getMyFriends()")
- [ ] Le profil affiche le nombre d'amis

---

## 🆘 Besoin d'aide supplémentaire ?

Si après avoir suivi TOUS ces tests, ça ne fonctionne toujours pas :

1. **Va sur** `/test-invite`
2. **Exécute tous les tests** avec un code valide
3. **Copie tous les logs** de la console (F12)
4. **Fais une capture d'écran** de la page `/debug-friends` après avoir cliqué sur "Rafraîchir"
5. **Envoie-moi** :
   - Les logs complets
   - Les captures d'écran
   - La description exacte de ce que tu as fait

---

**Dernière mise à jour :** Ajout des pages de test `/debug-friends` et `/test-invite` avec logs détaillés
