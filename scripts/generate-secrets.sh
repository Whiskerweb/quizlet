#!/bin/bash

# Script pour générer les secrets JWT nécessaires pour la production

echo "🔐 Génération des secrets JWT..."
echo ""

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Générer JWT_REFRESH_SECRET
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""

echo "✅ Copiez ces valeurs dans les variables d'environnement de votre plateforme de déploiement"
echo ""
echo "Variables à configurer :"
echo "  - JWT_SECRET"
echo "  - JWT_REFRESH_SECRET"
echo "  - JWT_EXPIRES_IN=15m"
echo "  - JWT_REFRESH_EXPIRES_IN=7d"
echo "  - FRONTEND_URL=https://votre-app.vercel.app"






