# 📧 Configuration des Emails de Confirmation Supabase

## 🔧 Configuration dans Supabase

### 1. Aller dans les paramètres d'authentification

1. Dans Supabase Dashboard, allez dans **Authentication** → **URL Configuration**
2. Configurez les URLs de redirection :

### 2. URLs de redirection

**Site URL** (pour la production) :
```
https://votre-app.vercel.app
```

**Redirect URLs** (ajoutez ces URLs) :
```
https://votre-app.vercel.app/**
http://localhost:3000/**
```

Le `**` permet toutes les sous-routes.

### 3. Email Templates (optionnel)

Dans **Authentication** → **Email Templates**, vous pouvez personnaliser :
- **Confirm signup** : Email de confirmation
- **Magic Link** : Lien magique
- **Change Email Address** : Changement d'email
- **Reset Password** : Réinitialisation de mot de passe

## 🚀 Pour le développement local

### Option 1 : Désactiver la confirmation d'email (recommandé pour dev)

Dans Supabase Dashboard → **Authentication** → **Providers** → **Email** :
- Désactivez **Confirm email** temporairement
- Ou utilisez un email de test

### Option 2 : Utiliser un service de test d'email

Supabase envoie les emails, mais vous pouvez :
1. Vérifier dans **Authentication** → **Users** si l'utilisateur est créé
2. Confirmer manuellement l'email dans le dashboard
3. Ou utiliser un service comme **Mailtrap** pour les tests

## ✅ Une fois sur Vercel

1. **Déployez votre app sur Vercel**
2. **Notez l'URL** : `https://votre-app.vercel.app`
3. **Dans Supabase** :
   - Allez dans **Authentication** → **URL Configuration**
   - Mettez à jour **Site URL** avec votre URL Vercel
   - Ajoutez votre URL Vercel dans **Redirect URLs**
4. **Testez** : Les emails de confirmation pointeront maintenant vers votre app Vercel

## 🔐 Sécurité

- ✅ Les emails de confirmation sont sécurisés
- ✅ Les liens expirent après un certain temps
- ✅ Seul l'utilisateur avec l'email peut confirmer

## 💡 Astuce

Pour tester en local sans email :
1. Créez un compte
2. Allez dans Supabase Dashboard → **Authentication** → **Users**
3. Trouvez votre utilisateur
4. Cliquez sur **"Confirm email"** manuellement

---

**Une fois sur Vercel, tout fonctionnera automatiquement !** 🎉










