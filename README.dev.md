# Notes de setup

## Architecture choisie

- `apps/mobile` : application iOS/Android avec Expo + React Native.
- `apps/web` : client web séparé avec React + Vite, avec son propre build et son futur déploiement.
- `apps/api` : API ASP.NET Core Minimal API (.NET 10) pour exposer les endpoints métier.
- `supabase` : configuration et migrations SQL Supabase/PostgreSQL.

Décision importante : Expo n’est pas utilisé comme client web. Même si Expo supporte le web, le script `web` a été retiré du projet mobile pour éviter la confusion.

## Choix techniques

- Mobile : Expo, parce que l’objectif est de publier sur iOS et Android sans maintenir deux apps natives séparées.
- Web : React/Vite séparé, parce que le produit web doit pouvoir avoir une expérience et un cycle de déploiement indépendants du mobile.
- API : ASP.NET Core Minimal API, parce que c’est simple, rapide à faire évoluer, typé, et suffisant pour démarrer sans architecture lourde.
- Database : Supabase/PostgreSQL.

## Prérequis locaux

- Node.js 22+
- npm 11+
- .NET SDK 10+
- Supabase CLI, à installer plus tard si tu veux gérer les migrations depuis la machine

## Installation

```bash
npm install
dotnet restore apps/api/PartNApp.Api.csproj
cp .env.example .env
```

Renseigne ensuite `ConnectionStrings__Supabase` avec la connection string Supabase.

## Commandes

```bash
npm run api:dev
npm run mobile:start
npm run mobile:ios
npm run mobile:android
npm run web:dev
npm run web:build
```

## API

Endpoints initiaux :

- `GET /` : identification de l’API.
- `GET /health` : santé applicative.
- `GET /health/db` : test de connexion Supabase/PostgreSQL via `ConnectionStrings__Supabase`.

## Supabase

Une première migration existe dans `supabase/migrations`.

Elle pose une base volontairement simple :

- `profiles`
- `partnership_offers`
- `partnership_interests`
- RLS activé, sans policies pour l’instant

Les policies RLS doivent être ajoutées quand le modèle d’authentification sera décidé.

## Prochaines décisions à prendre

1. Authentification : Supabase Auth directement côté clients, ou auth centralisée via l’API.
2. Hébergement API : Azure App Service, Container Apps, Fly.io, Render, ou autre.
3. Hébergement web : Vercel, Netlify, Cloudflare Pages, ou pipeline custom.
4. Publication mobile : Expo Application Services (EAS) build/submit.
5. RLS Supabase : policies exactes selon les règles produit.
