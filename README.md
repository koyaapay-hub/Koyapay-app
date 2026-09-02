# KoyaPay — Application V1

Stack : **Next.js 14 + Supabase (Auth + PostgreSQL)**

## 1. Créer le projet Supabase (5 min)

1. Va sur https://supabase.com → **New project**
2. Nom : `koyapay`, mot de passe DB solide, région proche (Frankfurt ou autre)
3. Dans **Project Settings → API**, copie :
   - Project URL
   - `anon` `public` key

4. Dans **SQL Editor**, colle et exécute le contenu de `supabase/schema.sql`

5. Dans **Authentication → Providers → Email** :
   - Active Email
   - Option recommandée pour dev : désactive "Confirm email" temporairement  
     **OU** laisse activé et utilise le code OTP à 6 chiffres (Confirm signup)

6. (Optionnel) **Authentication → Email Templates** : personnalise le message OTP

## 2. Configurer l'app locale

```bash
cd koyapay-app
cp .env.local.example .env.local
# Édite .env.local avec ton URL et ta clé Supabase

npm install
npm run dev
```

Ouvre http://localhost:3000 → redirige vers `/login`

## 3. Parcours auth implémenté

| Route | Rôle |
|-------|------|
| `/register` | Téléphone + email + mot de passe → signUp Supabase |
| `/verify` | Saisie code OTP email (6 chiffres) |
| `/onboarding` | Nom entreprise + WhatsApp → table `companies` |
| `/login` | Connexion email / mot de passe |
| `/dashboard` | Accueil protégé (solde, raccourcis) |

## 4. Déployer sur Vercel

1. Push le dossier `koyapay-app` sur GitHub
2. Import dans Vercel
3. Ajoute les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Prochaine étape

Module **Employés** (CRUD + import Excel) branché sur la table `employees`.
