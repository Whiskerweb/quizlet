# 🚀 Fonctionnement du Backend en Production

## Vue d'ensemble

Le backend est une application **NestJS** (framework Node.js avec TypeScript) qui fonctionne comme une **API REST**. Il gère l'authentification, les données, et la logique métier de l'application Quizlet.

---

## 📦 Architecture du Backend

### Structure Modulaire

Le backend utilise l'architecture modulaire de NestJS :

```
apps/api/
├── src/
│   ├── main.ts              # Point d'entrée de l'application
│   ├── app.module.ts        # Module racine qui importe tous les modules
│   ├── prisma/              # Service de connexion à la base de données
│   ├── auth/                # Authentification (login, register, JWT)
│   ├── users/               # Gestion des utilisateurs
│   ├── sets/                # Gestion des sets de flashcards
│   ├── flashcards/          # Gestion des flashcards individuelles
│   ├── study/               # Logique d'étude et sessions
│   ├── stats/               # Statistiques utilisateur
│   └── search/              # Recherche de sets publics
└── prisma/
    └── schema.prisma        # Schéma de la base de données
```

---

## 🔄 Cycle de Vie en Production

### 1. **Build (Compilation)**

Avant de démarrer en production, le code TypeScript est compilé en JavaScript :

```bash
pnpm build
# ou
nest build
```

**Ce qui se passe :**
- TypeScript (`src/`) → JavaScript (`dist/`)
- Les fichiers `.ts` sont compilés en `.js` dans le dossier `dist/`
- Les décorateurs et métadonnées sont préservés
- Source maps générées pour le debugging

**Résultat :** Un dossier `dist/` avec tout le code JavaScript compilé.

---

### 2. **Démarrage de l'Application**

En production, l'application démarre avec :

```bash
node dist/main.js
# ou via le script npm
pnpm start:prod
```

#### Processus de démarrage (`main.ts`)

```typescript
async function bootstrap() {
  // 1. Création de l'application NestJS
  const app = await NestFactory.create(AppModule);
  
  // 2. Configuration CORS (Cross-Origin Resource Sharing)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // 3. Validation globale des données
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Supprime les propriétés non définies
      forbidNonWhitelisted: true, // Rejette les requêtes avec propriétés inconnues
      transform: true,           // Transforme automatiquement les types
    })
  );
  
  // 4. Démarrage du serveur HTTP
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}`);
}
```

**Étapes détaillées :**

1. **Création de l'app** : NestJS instancie tous les modules définis dans `AppModule`
2. **Initialisation des modules** : Chaque module s'initialise (ex: `PrismaService` se connecte à la DB)
3. **Configuration CORS** : Autorise les requêtes depuis le frontend
4. **Validation** : Configure la validation automatique des données entrantes
5. **Écoute** : Le serveur écoute sur le port configuré (3001 par défaut)

---

### 3. **Connexion à la Base de Données**

#### PrismaService (`prisma/prisma.service.ts`)

```typescript
@Injectable()
export class PrismaService extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    // Se connecte à PostgreSQL au démarrage
    await this.$connect();
  }
  
  async onModuleDestroy() {
    // Se déconnecte proprement à l'arrêt
    await this.$disconnect();
  }
}
```

**Fonctionnement :**
- Au démarrage : `onModuleInit()` établit la connexion PostgreSQL
- Pendant l'exécution : Prisma Client est disponible dans tous les services
- À l'arrêt : `onModuleDestroy()` ferme proprement la connexion

**Connexion :** Utilise la variable d'environnement `DATABASE_URL`

---

## 🌐 Gestion des Requêtes HTTP

### Flux d'une Requête

```
Client (Frontend)
    ↓
    HTTP Request (GET/POST/PUT/DELETE)
    ↓
CORS Middleware (vérifie l'origine)
    ↓
Validation Pipe (valide et transforme les données)
    ↓
Route Handler (Controller)
    ↓
Service (logique métier)
    ↓
PrismaService (requête DB)
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ↓
Client (Frontend)
```

### Exemple : Création de Compte

**Requête :**
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Traitement :**

1. **Controller** (`auth.controller.ts`) :
   ```typescript
   @Post('register')
   async register(@Body() dto: RegisterDto) {
     return this.authService.register(dto);
   }
   ```

2. **Validation** : `RegisterDto` valide automatiquement :
   - `username` : string, min 3 caractères
   - `email` : format email valide
   - `password` : string, min 6 caractères

3. **Service** (`auth.service.ts`) :
   - Hash le mot de passe avec `bcrypt`
   - Crée l'utilisateur dans la DB via Prisma
   - Génère un JWT token
   - Retourne l'utilisateur + tokens

4. **Réponse** :
   ```json
   {
     "user": {
       "id": "123",
       "username": "john",
       "email": "john@example.com"
     },
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```

---

## 🔐 Authentification JWT

### Système de Tokens

Le backend utilise **JWT (JSON Web Tokens)** avec deux types de tokens :

1. **Access Token** : Court (15 min), utilisé pour chaque requête authentifiée
2. **Refresh Token** : Long (7 jours), utilisé pour obtenir un nouveau access token

### Protection des Routes

```typescript
@UseGuards(JwtAuthGuard)  // ← Protège la route
@Get('sets')
async getMySets(@CurrentUser() user: any) {
  // Seuls les utilisateurs authentifiés peuvent accéder
  return this.setsService.findByUser(user.id);
}
```

**Fonctionnement :**
1. Client envoie `Authorization: Bearer <token>` dans les headers
2. `JwtAuthGuard` vérifie et valide le token
3. Si valide : la requête continue, `@CurrentUser()` contient l'utilisateur
4. Si invalide : retourne `401 Unauthorized`

---

## 📊 Modules Principaux

### 1. **AuthModule** - Authentification
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `POST /auth/refresh` - Rafraîchir le token
- `GET /auth/me` - Obtenir l'utilisateur actuel

### 2. **SetsModule** - Sets de Flashcards
- `GET /sets` - Liste des sets de l'utilisateur
- `POST /sets` - Créer un set
- `GET /sets/:id` - Détails d'un set
- `PUT /sets/:id` - Modifier un set
- `DELETE /sets/:id` - Supprimer un set

### 3. **FlashcardsModule** - Flashcards
- `GET /sets/:setId/flashcards` - Liste des flashcards
- `POST /sets/:setId/flashcards` - Créer une flashcard
- `PUT /flashcards/:id` - Modifier une flashcard
- `DELETE /flashcards/:id` - Supprimer une flashcard

### 4. **StudyModule** - Sessions d'Étude
- `POST /study/sessions` - Démarrer une session
- `POST /study/sessions/:id/answers` - Enregistrer une réponse
- `GET /study/sessions/:id` - Détails d'une session

### 5. **StatsModule** - Statistiques
- `GET /stats` - Statistiques globales utilisateur
- `GET /stats/sets/:id` - Statistiques d'un set

### 6. **SearchModule** - Recherche
- `GET /search?q=query` - Rechercher des sets publics

---

## 🔧 Variables d'Environnement

### Variables Requises

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secrets
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# Serveur
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=https://votre-app.vercel.app
```

### Génération des Secrets

```bash
# Générer un secret JWT
openssl rand -base64 32

# Générer un refresh secret (différent)
openssl rand -base64 32
```

---

## 🚀 Déploiement en Production

### Processus de Build et Démarrage

**Sur Railway/Render/Heroku :**

1. **Installation des dépendances**
   ```bash
   pnpm install
   ```
   - Installe toutes les dépendances npm
   - Exécute `postinstall` : `prisma generate` (génère Prisma Client)

2. **Build**
   ```bash
   pnpm build
   ```
   - Compile TypeScript → JavaScript dans `dist/`

3. **Migrations de base de données**
   ```bash
   pnpm prisma:migrate:deploy
   ```
   - Applique les migrations Prisma à la base de données
   - Crée les tables si elles n'existent pas

4. **Démarrage**
   ```bash
   pnpm start:prod
   ```
   - Lance `node dist/main.js`
   - L'application écoute sur le port configuré

---

## 📈 Performance et Scalabilité

### Optimisations

1. **Connection Pooling** : Prisma gère automatiquement un pool de connexions PostgreSQL
2. **Validation Rapide** : `class-validator` valide les données avant traitement
3. **Caching** : (À implémenter) Redis pour les sessions fréquentes
4. **Rate Limiting** : (À implémenter) Limiter les requêtes par IP

### Monitoring

- **Logs** : Tous les logs sont envoyés à `stdout` (capturés par la plateforme)
- **Health Check** : (À implémenter) Endpoint `/health` pour vérifier l'état
- **Error Tracking** : (À implémenter) Sentry pour tracker les erreurs

---

## 🔍 Debugging en Production

### Logs

Le backend log automatiquement :
- Démarrage : `🚀 API server running on http://localhost:${port}`
- Erreurs : Toutes les erreurs non gérées sont loggées

### Commandes Utiles

```bash
# Voir les logs en temps réel (Railway)
railway logs

# Voir les logs (Render)
render logs

# Accéder à la base de données
pnpm prisma:studio
# Ouvre Prisma Studio sur http://localhost:5555
```

---

## ✅ Checklist Production

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL créée
- [ ] Migrations Prisma appliquées (`prisma migrate deploy`)
- [ ] CORS configuré avec l'URL du frontend
- [ ] Secrets JWT générés et sécurisés
- [ ] Build réussi (`pnpm build`)
- [ ] Application démarre sans erreur
- [ ] Health check fonctionne
- [ ] Logs accessibles
- [ ] Backup de la base de données configuré

---

## 🎯 Résumé

**Le backend en production :**

1. ✅ **Compile** le TypeScript en JavaScript
2. ✅ **Démarre** un serveur HTTP NestJS
3. ✅ **Se connecte** à PostgreSQL via Prisma
4. ✅ **Écoute** les requêtes HTTP sur un port
5. ✅ **Valide** les données entrantes
6. ✅ **Authentifie** les utilisateurs via JWT
7. ✅ **Traite** les requêtes via les controllers/services
8. ✅ **Interroge** la base de données via Prisma
9. ✅ **Retourne** des réponses JSON au frontend

**C'est une API REST classique qui gère toute la logique métier et les données de votre application Quizlet !** 🚀




