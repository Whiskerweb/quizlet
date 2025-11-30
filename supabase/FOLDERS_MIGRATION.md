# Migration : Ajout des dossiers (Folders)

Ce fichier explique comment ajouter la fonctionnalité de dossiers pour organiser les sets.

## Étape 1 : Exécuter la migration SQL

1. Allez dans votre **Supabase Dashboard**
2. Ouvrez le **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `add_folders.sql`
5. Exécutez la requête (Run ou Cmd/Ctrl + Enter)

## Ce que fait la migration

- ✅ Crée la table `folders` pour stocker les dossiers
- ✅ Ajoute la colonne `folder_id` à la table `sets`
- ✅ Crée les index pour optimiser les requêtes
- ✅ Configure les politiques RLS (Row Level Security) pour la sécurité

## Structure

- **folders** : Table pour les dossiers
  - `id` : UUID (clé primaire)
  - `name` : Nom du dossier
  - `user_id` : Propriétaire du dossier
  - `color` : Couleur du dossier (optionnel)
  - `order` : Ordre d'affichage
  - `created_at`, `updated_at` : Timestamps

- **sets.folder_id** : Colonne ajoutée pour lier un set à un dossier
  - `NULL` : Set sans dossier
  - `UUID` : ID du dossier

## Après la migration

Une fois la migration exécutée, vous pouvez :
- Créer des dossiers depuis le dashboard
- Glisser-déposer des sets dans les dossiers
- Organiser vos sets par catégories


