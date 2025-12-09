# 🎨 Maquette - Page Détaillée d'une Classe

## 📍 Accès
**Route** : `/classes/[id]`  
**Déclencheur** : Clic sur une Card de classe depuis `/home`

---

## 🎯 Vue d'ensemble

La page de classe est un **hub central** pour gérer tout ce qui concerne une classe spécifique. Design moderne, épuré, fidèle au `design-system.json`.

---

## 📐 Structure de la page

### 1. **Header (En-tête)**
```
┌─────────────────────────────────────────────────────────┐
│ ← Retour aux classes                                     │
│                                                          │
│ 🔵 Nom de la classe                    ┌──────────────┐ │
│ Description de la classe               │ CODE CLASSE   │ │
│                                        │  A3KP9Z       │ │
│                                        │ 👁 📋 🔒      │ │
│                                        └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Éléments** :
- Bouton retour avec icône `ArrowLeft`
- Pastille de couleur de la classe
- Titre (28-32px, font-semibold)
- Description (text-content-muted)
- **Card du code classe** :
  - Afficher/Masquer avec bouton Eye/EyeOff
  - Copier avec icône Copy
  - Code en font-mono, font-semibold

---

### 2. **Stats Cards (4 cartes)**
```
┌────────────┬────────────┬────────────┬────────────┐
│ 👥 ÉLÈVES  │ 📁 MODULES │ 📈 PROGR.  │ ⚡ SESSION │
│    24      │     8      │    67%     │    288     │
│ 18 actifs  │ 156 cardz  │  Moyenne   │   Total    │
└────────────┴────────────┴────────────┴────────────┘
```

**Métriques affichées** :
- **Élèves** : Total + actifs (vert)
- **Modules** : Total + nombre de cardz
- **Progression** : % moyen de complétion
- **Sessions** : Nombre total de sessions d'étude

**Design** :
- Grid responsive (2 cols mobile, 4 cols desktop)
- Icônes colorées (blue, purple, green, orange)
- Typographie : 11px uppercase pour labels, 24px pour chiffres
- bg-bg-emphasis avec border-border-subtle

---

### 3. **Tabs (Onglets de navigation)**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Vue d'ensemble | 👥 Élèves | 📁 Modules | 🎯 Évaluat. | 📈 Stats │
│ ══════════════════                                       │
└─────────────────────────────────────────────────────────┘
```

**5 onglets** :
1. **Vue d'ensemble** (BarChart3) - Dashboard principal
2. **Élèves** (Users) - Liste et gestion des élèves
3. **Modules** (Folder) - Modules partagés
4. **Évaluations** (Target) - Créer des quiz (à implémenter)
5. **Statistiques** (Activity) - Analyses avancées (à implémenter)

**Design** :
- Border-bottom sur l'onglet actif (brand-primary)
- text-brand-primary pour actif, text-content-muted pour inactif
- Transition smooth
- Scrollable horizontalement sur mobile

---

## 📑 Contenu des onglets

### 🏠 **Onglet 1 : Vue d'ensemble**

#### A. Actions rapides (4 boutons)
```
┌──────────────────────────────────────────────────────────┐
│ ACTIONS RAPIDES                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐   │
│ │ 🎯 Créer  │ 🔗 Partager│ 📊 Voir    │ ⚙️ Paramè- │   │
│ │ un quiz    │ module     │ stats      │ tres       │   │
│ └────────────┴────────────┴────────────┴────────────┘   │
└──────────────────────────────────────────────────────────┘
```

#### B. Activité récente
```
┌──────────────────────────────────────────────────────────┐
│ ACTIVITÉ RÉCENTE                                         │
│ ✅ Marie D. a terminé le module Introduction (2h)        │
│ 👥 Paul M. a rejoint la classe (5h)                      │
│ 📖 Sophie L. a révisé Chapitre 2 (1j)                    │
└──────────────────────────────────────────────────────────┘
```
- Timeline avec icônes colorées
- Username en font-medium
- Timestamp relatif (Il y a Xh/j)
- bg-bg-subtle pour chaque item

#### C. Deux colonnes :

**Colonne 1 : Top élèves** (Award icon)
```
┌─────────────────────────┐
│ 🏆 TOP ÉLÈVES          │
│ 1️⃣ Marie D.      95%   │
│ 2️⃣ Paul M.       92%   │
│ 3️⃣ Sophie L.     88%   │
└─────────────────────────┘
```
- Badge numéroté (1, 2, 3)
- Score en vert (font-medium)

**Colonne 2 : Besoin d'aide** (AlertCircle icon)
```
┌─────────────────────────┐
│ ⚠️ BESOIN D'AIDE        │
│ Jean P.                 │
│ Pas d'activité 3j       │
└─────────────────────────┘
```
- Alerte pour élèves inactifs
- Text orange/red

---

### 👥 **Onglet 2 : Élèves**

```
┌──────────────────────────────────────────────────────────┐
│ Élèves (24)                        [Inviter des élèves]  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Avatar] Marie Dupont                    Progr: 67% │  │
│ │          marie@email.com                [Voir profil]│  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Avatar] Paul Martin                     Progr: 92% │  │
│ │          paul@email.com                 [Voir profil]│  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Éléments** :
- Avatar ou initiale dans cercle coloré
- Username (15px, font-medium)
- Email (13px, text-content-muted)
- Progression (% vert)
- Bouton "Voir profil" (outline)

**Empty State** :
```
       👥
  Aucun élève
  Partagez le code classe
```

---

### 📁 **Onglet 3 : Modules**

```
┌──────────────────────────────────────────────────────────┐
│ Modules partagés (8)                [Partager un module] │
│                                                          │
│ ┌──────────────┐  ┌──────────────┐                      │
│ │ 📁 Module 1  │  │ 📁 Module 2  │                      │
│ │ Cardz: 24    │  │ Cardz: 18    │                      │
│ │ Complété: 72%│  │ Complété: 85%│                      │
│ │ ████░░░░░░   │  │ ████████░░   │                      │
│ └──────────────┘  └──────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

**Éléments** :
- Grid 2 colonnes (responsive)
- Icône Folder avec couleur du module
- Nom du module (16px, font-semibold)
- Nombre de cardz
- % de complétion (vert)
- Barre de progression visuelle
- Hover: shadow-card-hover

---

### 🎯 **Onglet 4 : Évaluations** (à implémenter)

```
┌──────────────────────────────────────────────────────────┐
│                    🎯                                     │
│              Évaluations                                 │
│    Créez des quiz et des évaluations                    │
│    pour tester vos élèves                               │
│                                                          │
│         [Créer une évaluation]                           │
└──────────────────────────────────────────────────────────┘
```
Empty state avec CTA principal.

---

### 📊 **Onglet 5 : Statistiques** (à implémenter)

```
┌──────────────────────────────────────────────────────────┐
│                    📊                                     │
│         Statistiques avancées                            │
│    Graphiques et analyses détaillées                    │
│              à venir                                     │
└──────────────────────────────────────────────────────────┘
```
Empty state pour futures fonctionnalités.

---

## 🎨 Design System - Respect complet

### Couleurs utilisées
- **Backgrounds** : `bg-default`, `bg-subtle`, `bg-emphasis`
- **Borders** : `border-subtle`, `border-default`
- **Content** : `content-emphasis`, `content-muted`, `content-subtle`
- **Brand** : `brand-primary` pour éléments actifs
- **States** : `text-green-600` (succès), `text-orange-600` (warning)

### Typographie
- **Headlines** : 28-32px (h1), 18px (h2), 16px (h3)
- **Body** : 14-15px
- **Small** : 13px
- **Labels** : 11px uppercase tracking-[0.2em]
- **Font** : Inter (default), Satoshi (display)

### Espacements
- Cards : `p-5` (20px)
- Gaps : `gap-3` (12px), `gap-4` (16px)
- Margins : `mb-4`, `mb-6`

### Animations
- `transition-all duration-200` sur hover
- `shadow-card-hover` sur cards
- Smooth tabs transition

### Layout
- Max-width : `max-w-[1180px]`
- Padding : `px-4 py-6 sm:px-6 lg:px-8 lg:py-8`
- Grid responsive : `grid-cols-2 sm:grid-cols-4`

### Components
- `Card` avec variants
- `Button` avec variants (primary, outline)
- Icons de `lucide-react`

---

## 🚀 Fonctionnalités à implémenter (1 par 1)

### Phase 1 : Statistiques en temps réel ✅ (Maquette)
- [x] Affichage des métriques clés
- [ ] Données réelles (actuellement mock)

### Phase 2 : Suivi des élèves
- [ ] Liste complète des élèves
- [ ] Profil individuel élève
- [ ] Historique d'activité
- [ ] Alertes inactivité

### Phase 3 : Analyse des modules
- [ ] Qui a révisé quel module
- [ ] Nombre de révisions
- [ ] Temps passé
- [ ] Taux de réussite par module

### Phase 4 : Évaluations
- [ ] Créer des quiz personnalisés
- [ ] Pré-évaluations
- [ ] Résultats en temps réel
- [ ] Correction automatique

### Phase 5 : Jeux et gamification
- [ ] Jeux interactifs
- [ ] Classements
- [ ] Badges et récompenses

### Phase 6 : Analytics avancés
- [ ] Graphiques de progression
- [ ] Tableaux de bord personnalisés
- [ ] Export de données
- [ ] Rapports PDF

---

## ✅ État actuel

### ✅ Implémenté
- Structure complète de la page
- Header avec code classe
- 4 stats cards
- 5 onglets de navigation
- Onglet "Vue d'ensemble" complet (avec données mock)
- Onglet "Élèves" avec liste
- Onglet "Modules" avec grille
- Empty states pour "Évaluations" et "Analytics"
- Responsive design
- Navigation depuis `/home`
- Click handlers avec stopPropagation

### 🔄 Prochaines étapes
1. Exécuter `fix_delete_class.sql` sur Supabase
2. Tester la navigation et l'affichage
3. Implémenter les données réelles (remplacer les mocks)
4. Ajouter les fonctionnalités une par une

---

## 🧪 Test de la maquette

1. Rechargez `http://localhost:3001/home`
2. Cliquez sur une **Card de classe** → Redirige vers `/classes/[id]`
3. Vérifiez l'affichage des 4 stats cards
4. Naviguez entre les onglets
5. Testez "Aperçu rapide" (expand/collapse) vs "Page complète"

---

## 💡 UX Highlights

- **Navigation intuitive** : Card cliquable pour page détaillée, "Aperçu rapide" pour preview
- **Hiérarchie visuelle claire** : Stats en haut, onglets pour organisation
- **Actions contextuelles** : Boutons d'action en haut de chaque section
- **Feedback visuel** : Hover states, transitions, couleurs de statut
- **Responsive** : Fonctionne sur mobile, tablette, desktop
- **Empty states** : Messages clairs pour fonctionnalités futures

---

🎨 **Maquette prête !** Passons maintenant à l'implémentation des fonctionnalités réelles.

