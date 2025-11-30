#!/usr/bin/env node

// Script Node.js pour générer les secrets JWT
const crypto = require('crypto');

console.log('🔐 Génération des secrets JWT...\n');

// Générer JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Générer JWT_REFRESH_SECRET
const jwtRefreshSecret = crypto.randomBytes(32).toString('base64');
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}\n`);

console.log('✅ Copiez ces valeurs dans les variables d\'environnement de votre plateforme de déploiement\n');
console.log('Variables à configurer :');
console.log('  - JWT_SECRET');
console.log('  - JWT_REFRESH_SECRET');
console.log('  - JWT_EXPIRES_IN=15m');
console.log('  - JWT_REFRESH_EXPIRES_IN=7d');
console.log('  - FRONTEND_URL=https://votre-app.vercel.app');





