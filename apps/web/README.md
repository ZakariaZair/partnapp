# PartNApp Web

Client web React + Vite indépendant de l’application mobile Expo.

## Configuration

Créer un `.env` à la racine du dépôt à partir de `.env.example` :

```bash
cp .env.example .env
```

Variable utilisée par le client web :

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Commandes

Depuis la racine :

```bash
npm run web:dev
npm run web:build
npm run web:preview
```

## État fonctionnel

Le client web contient aujourd’hui :

- landing page ;
- onboarding web ;
- connexion démo ;
- profil utilisateur démo ;
- liste, détail et création locale d’offres ;
- expression d’intérêt locale ;
- états loading, empty et error ;
- affichage de l’URL API configurée.

Les appels persistants attendent les contrats API métier : profils, offres, intérêts et authentification.

## Déploiement web

Le choix MVP est Vercel. La décision est documentée dans `docs/WEB_DEPLOYMENT.md`.

Le prérequis est un build `npm run web:build` avec `VITE_API_BASE_URL` renseigné pour l’environnement ciblé.
