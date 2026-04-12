# ✅ CHECKLIST DE TEST - FONCTIONNALITÉ PROFESSEUR

**Objectif** : Vérifier que toutes les fonctionnalités prof/élève fonctionnent correctement.

---

## 🎯 PRÉPARATION

### 1. Démarrer le projet

```bash
cd /Users/lucasroncey/Desktop/cardz
pnpm dev
```

**URL** : `http://localhost:3000`

### 2. Vérifier les migrations

Allez sur Supabase Studio et vérifiez que ces tables existent :
- [ ] `profiles.role` (colonne)
- [ ] `classes`
- [ ] `class_memberships`
- [ ] `class_modules`

**Supabase Studio** : `https://app.supabase.com/project/vbqvhumwsbezoipaexsw/editor`

---

## 👨‍🏫 TESTS PROFESSEUR

### Compte A : Professeur

#### Inscription
- [ ] Aller sur `/register`
- [ ] Voir les 2 boutons : "Je suis un Prof" et "Je suis un Élève"
- [ ] Cliquer sur "Je suis un Prof"
- [ ] Vérifier que le bouton est en surbrillance (bg-blue-600)
- [ ] Remplir le formulaire
- [ ] S'inscrire
- [ ] Être redirigé vers `/dashboard`

#### Dashboard Professeur
- [ ] Voir "Dashboard Professeur" (pas "Dashboard")
- [ ] Voir "Bonjour, [username] 👨‍🏫"
- [ ] Voir les boutons : "Nouvelle classe", "Nouveau module", "Créer un cardz"
- [ ] Voir les stats : Modules, Classes, Cardz sans module

#### Créer un Module
- [ ] Cliquer sur "Nouveau module"
- [ ] Entrer le nom : "Mathématiques"
- [ ] Cliquer sur "Créer le module"
- [ ] Voir le module apparaître dans "Mes Modules"

#### Créer des Cardz
- [ ] Cliquer sur "Créer un cardz"
- [ ] Remplir le titre : "Théorème de Pythagore"
- [ ] Ajouter au module "Mathématiques"
- [ ] Ajouter 2-3 cartes
- [ ] Sauvegarder
- [ ] Retourner au dashboard
- [ ] Voir le cardz dans le module "Mathématiques"

#### Créer une Classe
- [ ] Cliquer sur "Nouvelle classe"
- [ ] Entrer le nom : "3ème A"
- [ ] Entrer la description : "Classe de mathématiques"
- [ ] Cliquer sur "Créer la classe"
- [ ] Voir la classe apparaître dans "Mes Classes"
- [ ] Voir "0 élèves" (normal, pas encore d'élèves)

#### Voir le Code Classe
- [ ] Cliquer sur "Afficher" (code classe)
- [ ] Voir le code apparaître (ex: "CUID12345...")
- [ ] Cliquer sur l'icône "Copier"
- [ ] Voir l'alerte "Code copié dans le presse-papier"
- [ ] **NOTER LE CODE** (vous en aurez besoin pour le test élève)
- [ ] Cliquer sur l'icône "Masquer"
- [ ] Voir le code disparaître

#### Partager un Module
- [ ] Cliquer sur la carte bleue "Partager des modules avec vos classes"
- [ ] Être redirigé vers `/share-modules`
- [ ] Voir la liste des modules à gauche
- [ ] Voir la liste des classes à droite
- [ ] **Glisser** le module "Mathématiques" sur la classe "3ème A"
- [ ] Voir le message de succès "✅ Module partagé..."
- [ ] Voir une coche verte dans la classe "3ème A"
- [ ] Voir "Mathématiques (X)" dans les modules partagés

#### Voir les Classes
- [ ] Cliquer sur "Gérer les classes"
- [ ] Être redirigé vers `/classes`
- [ ] Voir la liste complète des classes
- [ ] Cliquer sur "Voir les détails" d'une classe
- [ ] Voir les modules partagés
- [ ] Voir le nombre d'élèves

---

## 👨‍🎓 TESTS ÉLÈVE

### Compte B : Élève

#### Inscription
- [ ] **Se déconnecter** du compte prof
- [ ] Aller sur `/register`
- [ ] Cliquer sur "Je suis un Élève"
- [ ] Vérifier que le bouton est en surbrillance
- [ ] Remplir le formulaire
- [ ] S'inscrire
- [ ] Être redirigé vers `/dashboard`

#### Dashboard Élève (Non-régression)
- [ ] Voir "Dashboard" (pas "Dashboard Professeur")
- [ ] Voir l'interface habituelle élève
- [ ] Vérifier que tout fonctionne normalement
- [ ] Créer un dossier (pas "module")
- [ ] Créer un cardz
- [ ] Tout doit fonctionner comme avant

#### Rejoindre une Classe
- [ ] Cliquer sur "My Class" (dans la sidebar ou `/my-class`)
- [ ] Voir la section "Rejoindre une classe"
- [ ] Voir le champ de saisie du code
- [ ] Entrer un code invalide (ex: "WRONG")
- [ ] Voir l'erreur "Code invalide"
- [ ] Entrer le code noté précédemment (du prof)
- [ ] Cliquer sur "Rejoindre"
- [ ] Voir le message de succès "✅ Classe rejointe"
- [ ] Voir la classe apparaître dans "Classes rejointes"

#### Voir les Modules de la Classe
- [ ] Dans la classe rejointe, cliquer sur "Voir les modules disponibles"
- [ ] Voir le module "Mathématiques" apparaître
- [ ] Voir "(X cardz disponibles)"
- [ ] Cliquer sur le module "Mathématiques"
- [ ] Être redirigé vers `/class/[id]/module/[moduleId]`
- [ ] Voir la liste des cardz du module
- [ ] Voir le cardz "Théorème de Pythagore"

#### Étudier un Cardz de la Classe
- [ ] Cliquer sur "Étudier" sur un cardz
- [ ] Être redirigé vers `/study/[id]`
- [ ] Vérifier que le mode étude fonctionne normalement
- [ ] Faire quelques cartes
- [ ] Retourner à "My Class"

#### Quitter une Classe
- [ ] Dans "My Class", trouver la classe rejointe
- [ ] Cliquer sur "Quitter"
- [ ] Confirmer
- [ ] Voir la classe disparaître

---

## 🔄 TESTS CROISÉS (Prof + Élève)

### Vérifier les Statistiques

#### Côté Professeur
- [ ] Se reconnecter avec le compte prof
- [ ] Aller sur `/classes`
- [ ] Ouvrir la classe "3ème A"
- [ ] Voir "1 élève" (l'élève qui a rejoint)
- [ ] Cliquer sur "Voir les détails"
- [ ] Voir le module "Mathématiques" dans "Modules partagés"

#### Côté Élève (après rejoindre)
- [ ] Se reconnecter avec le compte élève
- [ ] Aller sur "My Class"
- [ ] Voir la classe "3ème A"
- [ ] Voir "Prof. [username du prof]"
- [ ] Voir "X élèves" (inclut l'élève actuel)

---

## 🎨 TESTS UI/UX

### Design System
- [ ] Vérifier que les couleurs sont cohérentes
- [ ] Vérifier les bordures arrondies (`rounded-2xl`)
- [ ] Vérifier les espacements
- [ ] Vérifier les typos (Inter/Satoshi)
- [ ] Vérifier les transitions au survol

### Responsive
- [ ] Tester sur mobile (< 640px)
- [ ] Tester sur tablette (640px - 1024px)
- [ ] Tester sur desktop (> 1024px)
- [ ] Vérifier que tout est lisible et utilisable

### États
- [ ] Vérifier les états de chargement
- [ ] Vérifier les messages d'erreur
- [ ] Vérifier les messages de succès
- [ ] Vérifier les états vides (pas de classes, pas de modules)

---

## 🐛 BUGS POTENTIELS

### Si vous rencontrez des erreurs :

#### 1. Erreur TypeScript sur `profile.role`

```bash
npx supabase gen types typescript \
  --project-id vbqvhumwsbezoipaexsw \
  > apps/web/lib/supabase/types.ts
```

#### 2. Erreur "Table does not exist"

Vérifiez que les migrations SQL ont été exécutées dans le bon ordre :
1. `01_add_teacher_role.sql`
2. `02_add_classes_system.sql`
3. `03_add_class_modules.sql`

#### 3. Erreur "Cannot read property 'role' of null"

Ajoutez un état de chargement dans le dashboard :
```tsx
if (!profile) {
  return <div>Chargement...</div>;
}
```

#### 4. Drag & Drop ne fonctionne pas

- Vérifiez que vous utilisez un navigateur moderne (Chrome, Firefox, Safari)
- Sur mobile, le drag & drop HTML5 ne fonctionne pas (normal)

---

## 📊 RÉCAPITULATIF

### À la fin des tests, vous devriez avoir :

**Compte Professeur** :
- [x] 1 module "Mathématiques"
- [x] 1 cardz "Théorème de Pythagore" dans le module
- [x] 1 classe "3ème A"
- [x] Module "Mathématiques" partagé avec "3ème A"
- [x] 1 élève dans la classe

**Compte Élève** :
- [x] 1 classe rejointe "3ème A"
- [x] Accès au module "Mathématiques"
- [x] Accès au cardz "Théorème de Pythagore"
- [x] Peut étudier le cardz

**Dashboard Élève** :
- [x] Aucun changement visible
- [x] Fonctionne normalement
- [x] Peut créer des dossiers et cardz

---

## ✅ VALIDATION FINALE

Si tous les tests passent, l'implémentation est complète et fonctionnelle ! 🎉

### Prochaines étapes suggérées :

1. **Tests en conditions réelles**
   - Créer plusieurs classes
   - Inviter de vrais élèves
   - Partager plusieurs modules

2. **Améliorations optionnelles**
   - Page détails élèves
   - Notifications
   - Tests/examens
   - Statistiques avancées

3. **Déploiement**
   - Tester en staging
   - Déployer en production
   - Monitorer les erreurs

---

**Bon test ! 🚀**

