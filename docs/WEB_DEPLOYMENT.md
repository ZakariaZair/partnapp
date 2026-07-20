# Déploiement web PartNApp

Décision MVP : déployer le client web Vite sur Vercel.

## Pourquoi Vercel

- compatible avec un build statique Vite ;
- configuration simple des variables d’environnement ;
- preview deployments utiles pendant l’itération produit ;
- pas de dépendance avec Expo ou React Native.

## Prérequis

Depuis la racine du dépôt :

```bash
npm run web:build
```

Variable obligatoire en environnement Vercel :

```bash
VITE_API_BASE_URL=https://api.partnapp.example
```

L’URL exacte dépendra du déploiement API.

## Configuration Vercel recommandée

- Framework preset : Vite
- Root directory : `apps/web`
- Build command : `npm run build`
- Output directory : `dist`

## Contrat avec l’API

Le client web doit consommer les endpoints documentés dans `docs/API_CONTRACTS.md`.

Le choix Vercel ne change pas le contrat API. Il impose seulement que `VITE_API_BASE_URL` pointe vers l’API déployée.
