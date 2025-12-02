# 📱 Guide de Responsive Mobile - Quizlet

## ✅ Pages Complétées

### Pages Publiques
- ✅ `page.tsx` (Homepage)
- ✅ `(auth)/login/page.tsx`
- ✅ `(auth)/register/page.tsx`
- ✅ `search/page.tsx`
- ✅ `s/[shareId]/page.tsx`

### Pages Dashboard (À compléter)
- ⏳ `(dashboard)/home/page.tsx` (partiellement fait)
- ⏳ `(dashboard)/dashboard/page.tsx` (partiellement fait)
- ⏳ `(dashboard)/folders/[id]/page.tsx`
- ⏳ `(dashboard)/folders/shared/page.tsx`
- ⏳ `(dashboard)/profile/[username]/page.tsx`
- ⏳ `(dashboard)/sets/create/page.tsx`
- ⏳ `(dashboard)/sets/[id]/page.tsx`
- ⏳ `(dashboard)/sets/[id]/edit/page.tsx`
- ⏳ `(dashboard)/sets/[id]/flashcards/new/page.tsx`
- ⏳ `(dashboard)/sets/[id]/flashcards/[cardId]/edit/page.tsx`
- ⏳ `(dashboard)/study/[id]/page.tsx` + composants

## 📐 Standards Responsive Appliqués

### Tailles de Texte
```css
/* Titres principaux */
text-[22px] sm:text-[24px] lg:text-[28px]

/* Sous-titres */
text-[18px] sm:text-[20px] lg:text-[24px]

/* Corps de texte */
text-[14px] sm:text-[15px] lg:text-[16px]

/* Labels et petits textes */
text-[12px] sm:text-[13px] lg:text-[14px]

/* Très petits textes */
text-[11px] sm:text-[12px]
```

### Espacements
```css
/* Padding horizontal */
px-4 sm:px-6 lg:px-8

/* Padding vertical */
py-6 sm:py-8 lg:py-10

/* Gaps */
gap-2 sm:gap-3 lg:gap-4

/* Marges */
mb-4 sm:mb-6 lg:mb-8
```

### Hauteurs et Tailles
```css
/* Boutons */
h-10 sm:h-11 lg:h-12
text-[13px] sm:text-[14px] lg:text-[15px]

/* Inputs */
h-10 sm:h-11
text-[14px] sm:text-[15px]

/* Cards */
p-4 sm:p-5 lg:p-6

/* Icônes */
h-3.5 w-3.5 sm:h-4 sm:w-4 (petites)
h-4 w-4 sm:h-5 sm:w-5 (moyennes)
h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 (grandes)
```

### Layouts
```css
/* Grids */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* Flex direction */
flex-col sm:flex-row

/* Width */
w-full sm:w-auto
```

### Bordures
```css
/* Cards et containers */
border border-[rgba(255,255,255,0.06)]
border border-gray-200 (pour pages publiques)
```

## 🎯 Principes à Suivre

1. **Mobile First** : Toujours commencer par le style mobile, puis ajouter les breakpoints
2. **Texte lisible** : Minimum 14px sur mobile, idéalement 16px
3. **Espacement suffisant** : Minimum 16px entre éléments interactifs
4. **Boutons tactiles** : Minimum 44x44px (h-11 = 44px)
5. **Pas de zoom nécessaire** : Tout doit être lisible sans zoom
6. **Stacking vertical** : Sur mobile, empiler les éléments verticalement
7. **Texte tronqué** : Utiliser `hidden sm:inline` pour masquer du texte sur mobile

## 📝 Checklist par Page

Pour chaque page, vérifier :
- [ ] Titres responsive (text-[22px] sm:text-[28px])
- [ ] Corps de texte responsive (text-[14px] sm:text-[16px])
- [ ] Boutons responsive (h-10 sm:h-11, text-[13px] sm:text-[14px])
- [ ] Inputs responsive (h-10 sm:h-11)
- [ ] Cards responsive (p-4 sm:p-6)
- [ ] Grids responsive (grid-cols-1 sm:grid-cols-2)
- [ ] Flex responsive (flex-col sm:flex-row)
- [ ] Espacements responsive (px-4 sm:px-6, gap-2 sm:gap-4)
- [ ] Icônes responsive (h-4 sm:h-5)
- [ ] Bordures adaptées (border-[rgba(255,255,255,0.06)])
- [ ] Texte tronqué sur mobile si nécessaire
- [ ] Pas de débordement horizontal
- [ ] Tous les éléments cliquables ont une taille minimale de 44px





