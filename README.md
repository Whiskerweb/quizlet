# Quizlet Clone - Modern Flashcard Learning Platform

Une plateforme complète de révision par flashcards construite avec Next.js, NestJS, PostgreSQL et Prisma.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Stack Technologique](#stack-technologique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du Projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Développement](#développement)
- [Déploiement](#déploiement)

## ✨ Fonctionnalités

### MVP (Implémenté)
- ✅ Authentification complète (inscription, connexion, JWT)
- ✅ CRUD Sets de flashcards
- ✅ CRUD Flashcards individuelles
- ✅ Mode d'étude Flashcards (recto/verso)
- ✅ Mode Quiz (choix multiples)
- ✅ Mode Écriture (taper la réponse)
- ✅ Recherche de sets publics
- ✅ Partage de sets (lien public/privé)
- ✅ Dashboard utilisateur
- ✅ Profil utilisateur
- ✅ Statistiques basiques

### À Venir (V1)
- ⭐ Mode Match (associer termes)
- ⭐ Images sur flashcards
- ⭐ Audio sur flashcards (TTS)
- ⭐ Répétition espacée (algorithme SM-2)
- ⭐ Statistiques avancées (graphiques, historique)
- ⭐ Collections de sets
- ⭐ Favoris
- ⭐ Export/Import (CSV, JSON)

## 🛠 Stack Technologique

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5.x
- **Auth**: JWT + Passport
- **Validation**: class-validator

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x
- **State**: Zustand 4.x
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Container**: Docker + Docker Compose

## 🏗 Architecture

```
quizlet/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/           # NestJS Backend
├── packages/          # Shared packages
├── docker-compose.yml # PostgreSQL container
└── turbo.json         # Turborepo config
```

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour plus de détails.

## 📦 Installation

### Prérequis

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose (pour PostgreSQL)

### Étapes

1. **Cloner le repository**
```bash
git clone <repository-url>
cd quizlet
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Démarrer PostgreSQL avec Docker**
```bash
docker-compose up -d
```

4. **Configurer les variables d'environnement**

Créez un fichier `.env` dans `apps/api/`:
```env
DATABASE_URL="postgresql://quizlet:quizlet_dev_password@localhost:5432/quizlet?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

Créez un fichier `.env.local` dans `apps/web/`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

5. **Configurer la base de données**

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

6. **Démarrer les serveurs de développement**

Depuis la racine du projet:
```bash
pnpm dev
```

Cela démarre:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## ⚙️ Configuration

### Variables d'Environnement Backend

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | - |
| `JWT_SECRET` | Secret pour JWT access token | - |
| `JWT_EXPIRES_IN` | Expiration access token | `15m` |
| `JWT_REFRESH_SECRET` | Secret pour refresh token | - |
| `JWT_REFRESH_EXPIRES_IN` | Expiration refresh token | `7d` |
| `PORT` | Port du serveur API | `3001` |
| `FRONTEND_URL` | URL du frontend (pour CORS) | `http://localhost:3000` |

### Variables d'Environnement Frontend

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:3001` |

## 🚀 Démarrage

### Développement

```bash
# Démarrer PostgreSQL
docker-compose up -d

# Démarrer tous les services
pnpm dev
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## 📁 Structure du Projet

### Backend (`apps/api/`)

```
src/
├── auth/              # Module authentification
├── users/             # Module utilisateurs
├── sets/              # Module sets
├── flashcards/        # Module flashcards
├── study/             # Module sessions d'étude
├── stats/             # Module statistiques
├── search/            # Module recherche
├── prisma/            # Service Prisma
└── main.ts            # Point d'entrée
```

### Frontend (`apps/web/`)

```
app/
├── (auth)/            # Routes authentification
│   ├── login/
│   └── register/
├── (dashboard)/       # Routes protégées
│   ├── dashboard/
│   ├── sets/
│   ├── study/
│   └── profile/
├── search/            # Recherche publique
└── s/                 # Sets partagés
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir token
- `GET /auth/me` - Profil utilisateur actuel

### Sets
- `GET /sets` - Liste des sets (query: userId, isPublic, search, page, limit)
- `GET /sets/:id` - Détails d'un set
- `GET /sets/share/:shareId` - Set par shareId
- `POST /sets` - Créer un set
- `PATCH /sets/:id` - Modifier un set
- `DELETE /sets/:id` - Supprimer un set
- `POST /sets/:id/duplicate` - Dupliquer un set

### Flashcards
- `GET /sets/:setId/flashcards` - Liste flashcards d'un set
- `GET /flashcards/:id` - Détails d'une flashcard
- `POST /sets/:setId/flashcards` - Créer une flashcard
- `PATCH /flashcards/:id` - Modifier une flashcard
- `DELETE /flashcards/:id` - Supprimer une flashcard
- `PATCH /sets/:setId/flashcards/reorder` - Réordonner flashcards

### Study
- `POST /study/sessions` - Démarrer une session
- `POST /study/sessions/:id/answers` - Enregistrer une réponse
- `PATCH /study/sessions/:id/complete` - Terminer une session
- `GET /study/sessions/:id` - Détails d'une session

### Stats
- `GET /stats/user` - Statistiques utilisateur
- `GET /stats/sets/:id` - Statistiques d'un set
- `GET /stats/sessions` - Historique des sessions

### Search
- `GET /search?q=query&limit=20&offset=0` - Recherche de sets publics

## 💻 Développement

### Commandes Disponibles

```bash
# Développement
pnpm dev              # Démarrer tous les services en mode dev

# Build
pnpm build            # Build tous les packages

# Linting
pnpm lint             # Linter tous les packages

# Type checking
pnpm type-check       # Vérifier les types TypeScript

# Prisma
cd apps/api
npx prisma generate   # Générer Prisma Client
npx prisma migrate dev # Créer une migration
npx prisma studio     # Ouvrir Prisma Studio
```

### Ajouter une Nouvelle Fonctionnalité

1. **Backend**: Créer un nouveau module NestJS dans `apps/api/src/`
2. **Frontend**: Créer les pages/composants dans `apps/web/app/`
3. **API Client**: Ajouter les fonctions dans `apps/web/lib/api/`
4. **Types**: Synchroniser les types entre backend et frontend

## 🐳 Déploiement

### Docker

```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (Frontend)

1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Railway / Render (Backend)

1. Connecter le repository
2. Configurer PostgreSQL
3. Définir les variables d'environnement
4. Déployer

## 📝 Scripts Utiles

```bash
# Nettoyer les builds
pnpm clean

# Formater le code
pnpm format

# Vérifier les types
pnpm type-check
```

## 🧪 Tests

```bash
# Backend tests
cd apps/api
pnpm test

# E2E tests
pnpm test:e2e
```

## 📚 Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique détaillée

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 🎯 Roadmap

Voir [PRD.md](./PRD.md) pour la roadmap complète.

### MVP ✅
- [x] Authentification
- [x] CRUD Sets & Flashcards
- [x] Modes d'étude (Flashcards, Quiz, Writing)
- [x] Recherche & Partage
- [x] Dashboard & Profil

### V1 (En cours)
- [ ] Mode Match
- [ ] Images & Audio
- [ ] Répétition espacée
- [ ] Statistiques avancées
- [ ] Collections & Favoris

### V2 (Planifié)
- [ ] Système premium
- [ ] Collaboration temps réel
- [ ] IA génération flashcards
- [ ] Gamification
- [ ] Mobile app

## 🐛 Problèmes Connus

- Le mode quiz et writing nécessitent des améliorations UX
- Les images/audio ne sont pas encore implémentés
- La recherche pourrait être optimisée avec Elasticsearch

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Créé avec ❤️ en utilisant Next.js, NestJS et Prisma**




