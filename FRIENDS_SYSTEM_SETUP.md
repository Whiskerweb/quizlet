# 🤝 Système d'Amis & Invitations - Guide Complet

## 📋 Vue d'ensemble

Système complet permettant aux utilisateurs d':
- **Inviter des amis** via des liens d'invitation
- **Devenir amis automatiquement** lors de l'inscription
- **Partager des cardz** entre amis
- **Voir le nombre d'amis** dans le profil

---

## 🗄️ Étape 1 : Migration de la Base de Données

### Exécuter la Migration

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `supabase/add_friends_system.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **Run**

### Ce qui est créé :

#### Tables

1. **`invitation_codes`** : Codes d'invitation
   - `id` (UUID)
   - `code` (TEXT, unique) - Code à 8 caractères
   - `inviter_id` (UUID) - Qui a créé le code
   - `expires_at` (TIMESTAMP) - Expire dans 30 jours
   - `uses_count` / `max_uses` - Limite d'utilisation (10 max)

2. **`friendships`** : Relations d'amitié
   - `id` (UUID)
   - `user_id` (UUID) - Premier ami
   - `friend_id` (UUID) - Second ami
   - `invited_via_code` (TEXT) - Code utilisé (optionnel)
   - Bidirectionnel : A→B et B→A

#### Fonctions SQL

- `get_friend_count(user_uuid)` : Compte les amis
- `are_friends(user1, user2)` : Vérifie si deux users sont amis

#### RLS (Row Level Security)

- Users peuvent voir leurs propres codes
- Users peuvent voir leurs amitiés
- Codes valides lisibles publiquement (pour signup)

---

## 🎨 Étape 2 : Composants Créés

### 1. **InviteFriendsCTA** (`components/InviteFriendsCTA.tsx`)

Composant CTA magnifique pour inviter des amis :

**Features** :
- ✅ Génération de code d'invitation
- ✅ Copie du lien en 1 clic
- ✅ Partage natif (mobile)
- ✅ Affichage du nombre d'amis
- ✅ État collapsible (ouvert/fermé)
- ✅ Design avec gradient et icônes

**Où** : Affiché entre le niveau et les stats du jour sur la page d'accueil

### 2. **Service Friends** (`lib/supabase/friends.ts`)

Service complet pour gérer les invitations et amis :

```typescript
friendsService.generateInviteCode()      // Génère un code
friendsService.getMyInviteCodes()        // Liste ses codes
friendsService.useInviteCode(code, uid)  // Utilise un code
friendsService.getMyFriends()            // Liste ses amis
friendsService.getFriendCount(uid?)      // Compte les amis
friendsService.removeFriend(friendId)    // Supprime un ami
friendsService.getInviteLink(code)       // Lien complet
```

---

## 🔗 Étape 3 : Logique d'Invitation

### Fonctionnement

1. **User A génère un code** :
   ```
   Code: ABC123XY
   Lien: https://app.com/signup?invite=ABC123XY
   ```

2. **User A partage le lien** :
   - Copier/coller
   - Partage natif mobile
   - Email, SMS, WhatsApp, etc.

3. **User B crée un compte via le lien** :
   - URL contient `?invite=ABC123XY`
   - Signup stocke le code
   - Après validation du compte → Amitié créée automatiquement

4. **Amitié bidirectionnelle créée** :
   ```
   friendships:
   - user_id: B, friend_id: A, invited_via_code: ABC123XY
   - user_id: A, friend_id: B, invited_via_code: ABC123XY
   ```

---

## 📝 Étape 4 : Intégration Signup (À FAIRE)

Vous devez modifier la page de signup pour accepter le code d'invitation :

```typescript
// Dans apps/web/app/signup/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { friendsService } from '@/lib/supabase/friends';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  
  const handleSignup = async (email: string, password: string) => {
    // 1. Créer le compte
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error || !user) {
      // Handle error
      return;
    }
    
    // 2. Si code d'invitation, créer l'amitié
    if (inviteCode) {
      try {
        await friendsService.useInviteCode(inviteCode, user.id);
        console.log('✅ Ami ajouté automatiquement !');
      } catch (error) {
        console.error('Code d\'invitation invalide:', error);
        // Continuer quand même (le compte est créé)
      }
    }
    
    // 3. Rediriger
    router.push('/dashboard');
  };
  
  return (
    // ... votre formulaire
    <>
      {inviteCode && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900">
            🎉 Vous avez été invité ! Créez votre compte pour devenir amis.
          </p>
        </div>
      )}
      {/* Formulaire signup */}
    </>
  );
}
```

---

## 👥 Étape 5 : Affichage des Amis dans le Profil (À FAIRE)

Créez un composant pour afficher les amis :

```typescript
// components/FriendsSection.tsx

'use client';

import { useEffect, useState } from 'react';
import { friendsService, type Friend } from '@/lib/supabase/friends';
import { Card } from './ui/Card';
import { Users } from 'lucide-react';
import Link from 'next/link';

export function FriendsSection({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    loadFriends();
  }, [userId]);
  
  const loadFriends = async () => {
    const [friendsList, friendCount] = await Promise.all([
      friendsService.getMyFriends(),
      friendsService.getFriendCount(userId)
    ]);
    
    setFriends(friendsList);
    setCount(friendCount);
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Amis
        </h2>
        <span className="text-sm text-content-muted">{count}</span>
      </div>
      
      {friends.length === 0 ? (
        <p className="text-sm text-content-muted text-center py-4">
          Aucun ami pour le moment
        </p>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <Link key={friend.id} href={`/profile/${friend.username}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-subtle transition-colors">
                <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                  {friend.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-content-emphasis">
                    {friend.username}
                  </div>
                  <div className="text-xs text-content-muted">
                    Amis depuis {new Date(friend.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
```

Puis intégrez dans `profile/[username]/page.tsx` :

```typescript
import { FriendsSection } from '@/components/FriendsSection';

// Dans le JSX, sous les stats ou les sets :
{profile && <FriendsSection userId={profile.id} />}
```

---

## ✅ Checklist d'Installation

- [ ] Migration SQL exécutée (`add_friends_system.sql`)
- [ ] Tables créées et vérifiées (invitation_codes, friendships)
- [ ] CTA d'invitation visible sur la page d'accueil
- [ ] Modification de la page signup pour accepter le code d'invitation
- [ ] Composant FriendsSection créé et intégré au profil
- [ ] Tests :
  - [ ] Générer un code d'invitation
  - [ ] Copier le lien
  - [ ] S'inscrire via le lien
  - [ ] Vérifier que l'amitié est créée
  - [ ] Voir les amis dans le profil

---

## 🧪 Test Complet

1. **User A** : Génère un code depuis la page d'accueil
2. **User A** : Copie le lien
3. **User B** : Visite le lien (en navigation privée)
4. **User B** : Crée un compte
5. **User B** : Vérif

ie dans son profil → 1 ami (User A)
6. **User A** : Vérifie dans son profil → 1 ami (User B)
7. **Les deux** : Peuvent se voir mutuellement dans leurs listes d'amis

---

## 🎨 Design du CTA

Le CTA sur la page d'accueil a 2 états :

### État Fermé (par défaut)
```
┌────────────────────────────────────┐
│ 👥 Invite tes amis ✨              │
│ 2 amis • Révisez ensemble          │
└────────────────────────────────────┘
```

### État Ouvert (après clic)
```
┌────────────────────────────────────┐
│ 👥 Invite tes amis ✨           [X]│
│ Partagez vos cardz et révisez...   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ TON CODE: ABC123XY          │   │
│ │ 3/10 utilisations           │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Copier le lien] [Partager]       │
│                                     │
│ ✅ Comment ça marche ?             │
│ 1. Partage ton lien...             │
│ 2. Ils créent un compte...         │
│ 3. Vous devenez amis !             │
└────────────────────────────────────┘
```

---

## 🎉 Fonctionnalités

✅ **Génération de code** unique et sécurisé  
✅ **Expiration** après 30 jours  
✅ **Limite d'utilisation** (10 max par code)  
✅ **Amitié bidirectionnelle** automatique  
✅ **Partage natif** sur mobile  
✅ **Copie en 1 clic**  
✅ **Design magnifique** avec gradients  
✅ **RLS** complet pour la sécurité  
✅ **Compatible mobile** et desktop  

---

Tout est prêt ! Il ne reste plus qu'à :
1. **Exécuter la migration SQL**
2. **Modifier la page signup** pour accepter le code
3. **(Optionnel) Ajouter le composant FriendsSection** au profil

🚀 Votre système d'amis est opérationnel !
