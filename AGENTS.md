# Instructions communes aux agents PartNApp

Ce document s’applique à tous les agents qui travaillent dans ce dépôt.

## Objectif du projet

PartNApp aide des personnes à trouver des partenaires pour lancer des projets entrepreneuriaux.

Architecture actuelle :

- `apps/mobile` : application iOS/Android avec Expo + React Native.
- `apps/web` : client web séparé avec React + Vite.
- `apps/api` : API ASP.NET Core Minimal API connectée à Supabase/PostgreSQL.
- `supabase` : migrations et configuration Supabase.
- `docs` : documentation de coordination et checklist produit.

## Règles de synchronisation

1. Chaque agent doit rester prioritairement dans son périmètre :
   - Mobile : `apps/mobile`
   - Web : `apps/web`
   - API : `apps/api`, `supabase`
2. Les fichiers racine partagés (`package.json`, `package-lock.json`, `.gitignore`, `README.dev.md`, `AGENTS.md`) ne doivent être modifiés que si c’est nécessaire.
3. Avant de modifier un fichier partagé, l’agent doit vérifier que le changement ne casse pas le travail des autres agents.
4. Les contrats entre apps doivent être explicites :
   - l’API documente ses endpoints ;
   - les clients mobile/web consomment ces endpoints sans inventer de réponse implicite ;
   - si un endpoint manque, l’agent client ajoute une note dans `docs/FEATURES_CHECKLIST.md` ou demande à l’agent API.
5. Aucun agent ne doit ajouter une dépendance majeure sans raison concrète.
6. Aucun secret ne doit être commité. Les fichiers `.env` sont ignorés. Utiliser `.env.example` pour documenter les variables.
7. Après une modification, exécuter les validations adaptées au périmètre :
   - Mobile : `npm run mobile:doctor`
   - Web : `npm run web:build`
   - API : `dotnet build PartNApp.slnx --no-restore`
8. Si une règle manque, un agent peut l’ajouter dans ce fichier uniquement si elle est nécessaire, concrète, et ne bloque pas la synchronisation avec les autres agents.

## Règles mobile Expo

Expo évolue vite. Avant d’écrire du code mobile, vérifier la documentation correspondant à la version utilisée par le projet.

Version actuelle :

- Expo `~57.0.6`
- React Native `0.86.0`

Documentation de référence :

- https://docs.expo.dev/versions/v57.0.0/

Le projet mobile ne doit pas servir de client web. Le web est séparé dans `apps/web`.

## Règles web

Le client web doit rester indépendant du client mobile.

Il peut partager des conventions métier avec mobile, mais il ne doit pas dépendre d’Expo ni de React Native.

## Règles API

L’API doit rester simple tant que le produit est jeune.

Priorités :

- endpoints clairs ;
- validation des entrées ;
- erreurs HTTP cohérentes ;
- accès Supabase/PostgreSQL explicite ;
- pas d’architecture lourde prématurée.

## Documentation de travail

Les features à construire sont suivies dans :

- `docs/FEATURES_CHECKLIST.md`

Quand une feature est terminée, cocher la case correspondante et ajouter une courte note si le comportement livré diffère de la checklist initiale.
