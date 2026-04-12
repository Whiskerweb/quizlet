# Guide des Sessions Actives - Dashboard

## ✅ Fonctionnalité Déjà Implémentée !

Bonne nouvelle : **La section "Sessions en cours" existe déjà dans votre dashboard !**

## 📍 Où la Trouver ?

Ouvrez votre dashboard principal (`/dashboard`) et vous verrez une carte **"Sessions en cours"** qui affiche :

```
┌─────────────────────────────────────────────────────┐
│  🔄 Sessions en cours                                │
│  2 sessions non terminées                            │
├─────────────────────────────────────────────────────┤
│                                                       │
│  🟦 Flashcards - Vocabulaire Espagnol               │
│  ⏱️ Il y a 2h • #️⃣ 43 cartes • 🔀 Mélangé           │
│  Progress: ████████░░░░ 15/43                       │
│  [Reprendre] [Terminer]                              │
│                                                       │
│  🟪 Quiz - Mathématiques                            │
│  ⏱️ Il y a 1j • #️⃣ 50 cartes • ▶️ Carte 10+         │
│  Progress: ███░░░░░░░░░ 8/50                        │
│  [Reprendre] [Terminer]                              │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## 🎮 Fonctionnalités Disponibles

### 1. **Reprendre une Session**
- Cliquez sur le bouton **"Reprendre"**
- Vous serez redirigé vers la page d'étude
- La session reprendra exactement où vous l'aviez laissée
- ✅ Ordre des cartes préservé (shuffle ou non)
- ✅ Sous-ensemble de cartes préservé (start_from)
- ✅ Progression sauvegardée (cartes maîtrisées)

### 2. **Terminer une Session**
- Cliquez sur le bouton **"Terminer"**
- Confirmation demandée (action irréversible)
- La session est marquée comme complétée
- Elle disparaît de la liste des sessions actives

## 🔍 Informations Affichées

Pour chaque session :

| Info | Description |
|------|-------------|
| **Mode** | Badge coloré : Flashcards 🟦, Quiz 🟪, Écriture 🟩, Association 🟧 |
| **Titre du Set** | Nom du set étudié |
| **Temps écoulé** | "Il y a 2h", "Il y a 1j", etc. |
| **Nombre de cartes** | Total de cartes dans cette session |
| **Mélangé** | 🔀 Indique si les cartes sont mélangées |
| **Carte de départ** | ▶️ Carte 10+ si vous avez commencé à une carte spécifique |
| **Progression** | Barre de progression visuelle + X/Y cartes maîtrisées |

## ⚙️ États Possibles

### État 1 : Tout Fonctionne ✅
Vous voyez vos sessions actives avec toutes les informations.

### État 2 : Migration Non Exécutée ⚠️
Vous voyez un message orange :
```
🔄 Sessions en cours
La fonctionnalité de reprise de session nécessite une migration de la base de données.

▶ Comment activer cette fonctionnalité ?
1. Exécutez le fichier supabase/add_session_parameters.sql
2. Rechargez la page
3. Vos sessions seront automatiquement sauvegardées !
```

**Solution** : Suivez le guide dans `MIGRATION_GUIDE.md`

### État 3 : Aucune Session Active
La section n'apparaît pas du tout (c'est normal, rien à afficher).

## 🚀 Comment Ça Marche ?

### Création de Session
1. Vous allez sur `/study/[setId]`
2. Vous configurez vos paramètres (shuffle, start from)
3. Vous cliquez "Lancer"
4. → Session créée en base de données avec tous les paramètres

### Pendant l'Étude
- **Auto-save toutes les 10 secondes** : Votre progression est sauvegardée
- **Changement de mode** : Les paramètres sont préservés
- **Fermeture du navigateur** : Aucun problème, reprenez plus tard

### Reprise de Session
1. Allez sur le dashboard
2. Cliquez "Reprendre" sur une session
3. → Redirection vers `/study/[setId]?resume=[sessionId]`
4. → Restauration complète :
   - Même ordre de cartes
   - Même sous-ensemble (si start_from était utilisé)
   - Même progression (cartes maîtrisées, cartes à revoir)
   - Même mode

## 📱 Responsive

La section s'adapte automatiquement :
- **Desktop** : Affichage complet avec toutes les infos
- **Tablet** : Mise en page optimisée
- **Mobile** : Layout vertical, boutons empilés

## 🎨 Design

- **Couleurs des modes** :
  - Flashcards : Bleu (#3b82f6)
  - Quiz : Violet (#a855f7)
  - Écriture : Vert (#22c55e)
  - Association : Orange (#f97316)

- **Badges** : Indiquent visuellement les paramètres (shuffle, start_from)
- **Barre de progression** : Verte, montre % de maîtrise

## 🔗 Intégration

Le composant est intégré dans :
- ✅ `/app/(dashboard)/dashboard/page.tsx` (ligne 254-256)
- ✅ Composant autonome : `/components/ActiveSessions.tsx`
- ✅ Utilise l'API : `studyService.getActiveSessions()`

## 🐛 Dépannage

### Problème : La section n'apparaît pas
**Causes possibles** :
1. Aucune session active (normal)
2. Migration SQL non exécutée
3. Erreur API

**Solution** :
1. Créez une session d'étude
2. Ne la terminez pas complètement
3. Retournez au dashboard
4. La section devrait apparaître

### Problème : Message d'erreur orange
**Cause** : Migration SQL non exécutée

**Solution** : 
```bash
# Via Supabase Dashboard
1. Allez sur https://app.supabase.com
2. SQL Editor
3. Copiez/collez supabase/add_session_parameters.sql
4. Run
```

### Problème : Bouton "Reprendre" ne fonctionne pas
**Vérifications** :
1. Console du navigateur : Y a-t-il des erreurs ?
2. La session existe-t-elle encore en DB ?
3. Avez-vous les droits sur cette session ?

## 💡 Astuces

1. **Plusieurs appareils** : Créez une session sur votre PC, reprenez-la sur votre mobile !
2. **Pause longue** : Pas de limite de temps, reprenez même après des jours
3. **Nettoyage** : Terminez les vieilles sessions pour garder une liste propre

## 📊 Exemple de Workflow

```
1. Matin (9h00)
   → Démarre session Flashcards "Vocabulaire Anglais"
   → Étudie 10 cartes sur 50
   → Ferme le navigateur pour aller en cours

2. Midi (12h30)
   → Ouvre le dashboard
   → Voit la session active avec 10/50 cartes
   → Clique "Reprendre"
   → Continue exactement où il s'était arrêté

3. Soir (18h00)
   → Reprend la session
   → Termine les 40 cartes restantes
   → Session marquée automatiquement comme complétée
   → Disparaît de la liste

4. Lendemain
   → Nouvelle session, nouveau départ !
```

---

## 🎉 Résumé

✅ **Déjà implémenté** : Section complète dans le dashboard  
✅ **Reprise de session** : Fonctionne parfaitement  
✅ **Terminer session** : Bouton dédié avec confirmation  
✅ **Auto-save** : Toutes les 10 secondes  
✅ **Multi-modes** : Flashcards, Quiz, Writing, Match  
✅ **Paramètres préservés** : Shuffle, start_from, progression  

**Aucun développement supplémentaire nécessaire !** 🚀

La fonctionnalité est prête à l'emploi dès que la migration SQL est exécutée.

