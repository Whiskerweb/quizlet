# ⚡ Installation Rapide - Système d'Amis

## 🚀 3 Étapes pour Activer

### 1️⃣ Migration SQL (2 min)
```bash
Supabase Dashboard → SQL Editor → Run:
supabase/add_friends_system.sql
```

### 2️⃣ Le CTA est déjà sur la page d'accueil ✅
- Visible entre le niveau et les stats du jour
- Génère des codes d'invitation
- Copie et partage automatique

### 3️⃣ Modifier la Page Signup (5 min)
Ajouter dans `apps/web/app/signup/page.tsx` ou votre composant signup :

```typescript
import { useSearchParams } from 'next/navigation';
import { friendsService } from '@/lib/supabase/friends';

// Dans le composant :
const searchParams = useSearchParams();
const inviteCode = searchParams.get('invite');

// Après création du compte (dans handleSignup) :
if (inviteCode && user) {
  try {
    await friendsService.useInviteCode(inviteCode, user.id);
  } catch (error) {
    console.error('Code invalide:', error);
  }
}
```

---

## ✅ C'est Tout !

Après ça :
- Les users peuvent générer des codes
- Partager le lien
- Les nouveaux inscrits deviennent amis automatiquement

## 📊 (Optionnel) Afficher les Amis dans le Profil

Voir `FRIENDS_SYSTEM_SETUP.md` section "Étape 5"

---

**Prêt à tester ?** Lancez la migration SQL et c'est parti ! 🎉
