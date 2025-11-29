# Architecture Technique
## Quizlet Clone - Architecture Complète

---

## 1. Vue d'Ensemble

### Stack Technologique

**Backend**
- Framework: NestJS 10.x
- Language: TypeScript 5.x
- Database: PostgreSQL 14+
- ORM: Prisma 5.x
- Auth: JWT + Passport
- Validation: class-validator + class-transformer
- File Upload: Multer + AWS S3 (ou MinIO local)

**Frontend**
- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.x
- Styling: TailwindCSS 3.x
- State: Zustand 4.x
- Forms: React Hook Form + Zod
- HTTP: Axios
- Icons: Lucide React

**Monorepo**
- Tool: Turborepo
- Package Manager: pnpm
- Build: Turborepo pipelines

**DevOps**
- Container: Docker + Docker Compose
- CI/CD: GitHub Actions (prévu)
- Env: dotenv

---

## 2. Structure Monorepo

```
quizlet/
├── apps/
│   ├── web/                 # Next.js Frontend
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities, hooks
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── public/          # Static assets
│   │
│   └── api/                 # NestJS Backend
│       ├── src/
│       │   ├── auth/        # Auth module
│       │   ├── users/       # Users module
│       │   ├── sets/        # Sets module
│       │   ├── flashcards/  # Flashcards module
│       │   ├── study/       # Study sessions module
│       │   ├── stats/       # Statistics module
│       │   ├── search/      # Search module
│       │   ├── shared/      # Shared utilities
│       │   └── main.ts      # Entry point
│       └── prisma/          # Prisma schema & migrations
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── config/              # Shared configs (ESLint, TypeScript)
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
│
├── docker-compose.yml       # Local development
├── package.json             # Root package.json
├── turbo.json               # Turborepo config
└── README.md                # Documentation principale
```

---

## 3. Architecture Backend (NestJS)

### Structure Modulaire

```
api/src/
├── main.ts                  # Bootstrap application
├── app.module.ts            # Root module
│
├── auth/                    # Authentication Module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       └── current-user.decorator.ts
│
├── users/                   # Users Module
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── sets/                    # Sets Module
│   ├── sets.module.ts
│   ├── sets.controller.ts
│   ├── sets.service.ts
│   └── dto/
│       ├── create-set.dto.ts
│       ├── update-set.dto.ts
│       └── query-set.dto.ts
│
├── flashcards/              # Flashcards Module
│   ├── flashcards.module.ts
│   ├── flashcards.controller.ts
│   ├── flashcards.service.ts
│   └── dto/
│       ├── create-flashcard.dto.ts
│       └── update-flashcard.dto.ts
│
├── study/                   # Study Sessions Module
│   ├── study.module.ts
│   ├── study.controller.ts
│   ├── study.service.ts
│   └── dto/
│       ├── start-session.dto.ts
│       └── answer-flashcard.dto.ts
│
├── stats/                   # Statistics Module
│   ├── stats.module.ts
│   ├── stats.controller.ts
│   └── stats.service.ts
│
├── search/                  # Search Module
│   ├── search.module.ts
│   ├── search.controller.ts
│   └── search.service.ts
│
└── shared/                  # Shared Module
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── transform.interceptor.ts
    ├── decorators/
    │   └── public.decorator.ts
    └── pipes/
        └── validation.pipe.ts
```

### Flux de Données

```
Client (Next.js)
    ↓ HTTP Request
API Gateway (NestJS)
    ↓
Middleware (Auth, Rate Limiting, Validation)
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Repository / Prisma Client
    ↓
PostgreSQL Database
```

### Authentification Flow

```
1. User Login
   → POST /auth/login
   → Validate credentials
   → Generate JWT access token + refresh token
   → Return tokens

2. Protected Request
   → Client sends: Authorization: Bearer <access_token>
   → JWT Guard validates token
   → Extract user from token
   → Attach to request (CurrentUser decorator)

3. Token Refresh
   → POST /auth/refresh
   → Validate refresh token
   → Generate new access token
   → Return new access token
```

---

## 4. Architecture Frontend (Next.js)

### Structure App Router

```
web/app/
├── (auth)/                  # Auth routes group
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (dashboard)/            # Protected routes group
│   ├── layout.tsx          # Auth check + layout
│   ├── dashboard/
│   │   └── page.tsx
│   ├── sets/
│   │   ├── page.tsx        # List sets
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx    # View/Edit set
│   │       └── edit/
│   │           └── page.tsx
│   ├── study/
│   │   └── [id]/
│   │       └── page.tsx    # Study session
│   ├── profile/
│   │   └── [username]/
│   │       └── page.tsx
│   └── settings/
│       └── page.tsx
│
├── search/
│   └── page.tsx            # Public search
│
├── s/
│   └── [shareId]/
│       └── page.tsx        # Shared set view
│
├── layout.tsx              # Root layout
└── page.tsx                # Homepage
```

### Composants

```
web/components/
├── layout/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
├── sets/
│   ├── SetCard.tsx
│   ├── SetEditor.tsx
│   ├── SetList.tsx
│   └── FlashcardEditor.tsx
│
├── study/
│   ├── FlashcardMode.tsx
│   ├── QuizMode.tsx
│   ├── WritingMode.tsx
│   └── StudyProgress.tsx
│
├── search/
│   ├── SearchBar.tsx
│   └── SearchResults.tsx
│
├── ui/                     # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ...
│
└── auth/
    ├── LoginForm.tsx
    └── RegisterForm.tsx
```

### State Management (Zustand)

```
web/store/
├── authStore.ts            # Auth state (user, tokens)
├── setsStore.ts            # Sets state (current sets, filters)
├── studyStore.ts           # Study session state
└── uiStore.ts              # UI state (theme, modals)
```

### API Client

```
web/lib/
├── api/
│   ├── client.ts           # Axios instance with interceptors
│   ├── auth.api.ts        # Auth endpoints
│   ├── sets.api.ts        # Sets endpoints
│   ├── flashcards.api.ts  # Flashcards endpoints
│   ├── study.api.ts       # Study endpoints
│   └── stats.api.ts       # Stats endpoints
│
├── hooks/
│   ├── useAuth.ts
│   ├── useSets.ts
│   └── useStudy.ts
│
└── utils/
    ├── format.ts
    └── validation.ts
```

---

## 5. Schéma Base de Données (Prisma)

### Modèles Principaux

```prisma
// User
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  password      String    // hashed
  firstName     String?
  lastName      String?
  avatar        String?
  isPremium     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sets          Set[]
  studySessions StudySession[]
  stats         UserStats?
}

// Set
model Set {
  id          String      @id @default(cuid())
  title       String
  description String?
  isPublic    Boolean     @default(false)
  shareId     String      @unique @default(cuid())
  coverImage  String?
  tags        String[]
  language    String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  flashcards  Flashcard[]
  studySessions StudySession[]
  stats       SetStats?
}

// Flashcard
model Flashcard {
  id          String   @id @default(cuid())
  front       String
  back        String
  imageUrl    String?
  audioUrl    String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  setId       String
  set         Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
  answers     Answer[]
}

// Study Session
model StudySession {
  id          String   @id @default(cuid())
  mode        String   // 'flashcard' | 'quiz' | 'writing' | 'match'
  score       Int?
  totalCards  Int
  completed   Boolean  @default(false)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  setId       String
  set         Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
  answers     Answer[]
}

// Answer (réponses dans une session)
model Answer {
  id            String   @id @default(cuid())
  isCorrect     Boolean
  timeSpent     Int?     // milliseconds
  answeredAt    DateTime @default(now())
  
  flashcardId   String
  flashcard     Flashcard @relation(fields: [flashcardId], references: [id], onDelete: Cascade)
  sessionId     String
  session       StudySession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// User Stats
model UserStats {
  id              String   @id @default(cuid())
  totalSets       Int      @default(0)
  totalFlashcards Int      @default(0)
  totalStudyTime  Int      @default(0) // minutes
  totalSessions   Int      @default(0)
  averageScore    Float    @default(0)
  updatedAt       DateTime @updatedAt
  
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Set Stats
model SetStats {
  id              String   @id @default(cuid())
  views           Int      @default(0)
  studies         Int      @default(0)
  favorites       Int      @default(0)
  averageScore    Float    @default(0)
  updatedAt       DateTime @updatedAt
  
  setId           String   @unique
  set             Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
}
```

### Indexes

```prisma
// Performance indexes
@@index([userId])
@@index([setId])
@@index([isPublic])
@@index([shareId])
@@index([email])
@@index([username])
```

---

## 6. API Endpoints

### Authentication
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - Profil utilisateur actuel

### Sets
- `GET /sets` - Liste des sets (query: userId, isPublic, search)
- `GET /sets/:id` - Détails d'un set
- `POST /sets` - Créer un set
- `PATCH /sets/:id` - Modifier un set
- `DELETE /sets/:id` - Supprimer un set
- `GET /sets/:id/share` - Obtenir lien de partage
- `POST /sets/:id/duplicate` - Dupliquer un set

### Flashcards
- `GET /sets/:setId/flashcards` - Liste flashcards d'un set
- `GET /flashcards/:id` - Détails d'une flashcard
- `POST /sets/:setId/flashcards` - Créer une flashcard
- `PATCH /flashcards/:id` - Modifier une flashcard
- `DELETE /flashcards/:id` - Supprimer une flashcard
- `PATCH /flashcards/reorder` - Réordonner flashcards

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
- `GET /search` - Recherche de sets publics (query: q, tags, limit, offset)

### Upload
- `POST /upload/image` - Upload image
- `POST /upload/audio` - Upload audio

---

## 7. Sécurité

### Authentication
- JWT avec expiration courte (15 min) pour access token
- Refresh token avec expiration longue (7 jours)
- Tokens stockés en httpOnly cookies (optionnel) ou localStorage
- Password hashing avec bcrypt (10 rounds)

### Authorization
- Guards NestJS pour routes protégées
- Vérification ownership pour modification/suppression
- Public/Private sets avec permissions

### Validation
- DTOs avec class-validator
- Sanitization des inputs
- Rate limiting (100 req/min par IP)

### CORS
- Configuration stricte pour production
- Whitelist des origines autorisées

---

## 8. Performance

### Backend
- Pagination sur toutes les listes
- Indexes database optimisés
- Cache Redis (optionnel) pour recherches fréquentes
- Lazy loading des relations Prisma

### Frontend
- Code splitting automatique (Next.js)
- Image optimization (next/image)
- Lazy loading des composants
- Memoization avec React.memo, useMemo
- SSR/SSG où approprié

### Database
- Indexes sur colonnes fréquemment queryées
- Relations optimisées (select fields)
- Pagination avec cursor ou offset

---

## 9. Déploiement

### Local Development
```bash
# Docker Compose pour PostgreSQL
docker-compose up -d

# Migrations Prisma
cd apps/api && npx prisma migrate dev

# Start dev servers
pnpm dev
```

### Production
- Backend: Vercel, Railway, Render, ou AWS
- Frontend: Vercel (recommandé pour Next.js)
- Database: PostgreSQL managed (Supabase, Neon, Railway)
- Storage: AWS S3 ou Cloudflare R2
- CDN: Cloudflare ou Vercel Edge

---

## 10. Monitoring & Logging

### Logging
- Structured logging (Winston ou Pino)
- Log levels: error, warn, info, debug
- Request/Response logging middleware

### Error Tracking
- Sentry (optionnel)
- Error boundaries React
- Global exception filters NestJS

### Analytics
- Custom events tracking
- User behavior analytics
- Performance monitoring

---

**Document créé le**: 2024
**Version**: 1.0


