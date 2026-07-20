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

Contrats détaillés :

- `docs/API_CONTRACTS.md`

Endpoints de base :

- `GET /` : identification de l’API.
- `GET /health` : santé applicative.
- `GET /health/db` : test de connexion Supabase/PostgreSQL via `ConnectionStrings__Supabase`.

Endpoints métier :

- `GET /api/profiles/{id}` et `PUT /api/profiles/{id}`
- `GET /api/offers`, `GET /api/offers/{id}`, `POST /api/offers`, `PUT /api/offers/{id}`, `DELETE /api/offers/{id}`
- `GET /api/offers/{offerId}/interests`, `GET /api/profiles/{profileId}/interests`, `POST /api/offers/{offerId}/interests`, `DELETE /api/interests/{id}`
- alias mobile actuels : `GET /partnership-offers`, `POST /partnership-offers`, `POST /partnership-offers/{id}/interests`

## Supabase

Les migrations existent dans `supabase/migrations`.

Elles posent une base volontairement simple :

- `profiles`
- `partnership_offers`
- `partnership_interests`
- RLS activé
- policies RLS préparées autour de Supabase Auth et `auth.uid()`

Décision actuelle : Supabase Auth est utilisé directement côté clients. L’UUID Supabase Auth correspond à `profiles.id`.

## Prochaines décisions à prendre

1. Auth API optionnelle : décider si l’API doit vérifier les JWT Supabase côté serveur avant chaque mutation.
2. Règles produit avancées : archivage d’offres, visibilité fine des profils, scoring de matching.

Les décisions MVP déjà prises sont documentées dans `docs/PRODUCT_DECISIONS.md`.
