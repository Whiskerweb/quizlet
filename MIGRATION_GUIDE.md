# Guide de Migration - Session Persistence

## ⚠️ Important

Les boutons "Correct" et "Incorrect" fonctionnent maintenant même SANS la migration SQL grâce aux fallbacks ajoutés. Cependant, pour activer la **persistance complète des sessions** (reprendre plus tard), vous devez exécuter la migration.

## Option 1 : Sans Migration (Fonctionne Maintenant)

✅ Les boutons Correct/Incorrect fonctionnent
✅ Tous les modes respectent les paramètres
✅ Progression locale fonctionne dans la session active
❌ Pas de sauvegarde en base de données
❌ Impossible de reprendre une session plus tard

## Option 2 : Avec Migration (Fonctionnalités Complètes)

### Étape 1 : Vérifier votre configuration Supabase

Vous avez besoin de l'URL et de la clé de votre projet Supabase.

### Étape 2 : Exécuter la migration

#### Via Supabase Dashboard (Recommandé)

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez-collez le contenu de `supabase/add_session_parameters.sql`
6. Cliquez sur "Run"

#### Via CLI

```bash
# Si vous avez Supabase CLI installé
cd /Users/lucasroncey/Desktop/quizlet
supabase db push
```

#### Via psql (Si accès direct à la DB)

```bash
psql -h YOUR_HOST -d YOUR_DB -U YOUR_USER -f supabase/add_session_parameters.sql
```

### Étape 3 : Vérifier

Après la migration, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'study_sessions';
```

Vous devriez voir :
- `shuffle` (boolean)
- `start_from` (integer)
- `card_order` (jsonb)
- `session_state` (jsonb)

## Fonctionnalités Débloquées Après Migration

✅ **Sessions persistées** : Les sessions sont sauvegardées en DB
✅ **Reprise automatique** : L'écran de démarrage affiche les sessions en cours
✅ **Auto-save** : État sauvegardé toutes les 10 secondes
✅ **Cohérence totale** : Tous les modes partagent les mêmes paramètres
✅ **Historique** : Les sessions complétées sont enregistrées

## Vérification que Tout Fonctionne

1. **Ouvrez la console du navigateur** (F12)
2. **Lancez une session d'étude**
3. **Vérifiez les logs** :
   - `[Study] Session created successfully: <session-id>` ✅ Migration OK
   - `[Study] Failed to start session - continuing without backend persistence` ⚠️ Migration pas encore faite (mais ça fonctionne quand même)

## Rollback (Si Problème)

Si vous voulez annuler la migration :

```sql
ALTER TABLE public.study_sessions
  DROP COLUMN IF EXISTS shuffle,
  DROP COLUMN IF EXISTS start_from,
  DROP COLUMN IF EXISTS card_order,
  DROP COLUMN IF EXISTS session_state;
```

## Support

Les modifications actuelles garantissent que l'application fonctionne dans les deux cas :
- **Sans migration** : Mode dégradé mais fonctionnel (pas de persistance)
- **Avec migration** : Toutes les fonctionnalités activées

Vous pouvez donc utiliser l'application immédiatement et exécuter la migration quand vous êtes prêt !
