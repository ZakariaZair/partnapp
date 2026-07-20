# PartNApp - Checklist des features

Cette checklist sert de point de synchronisation entre les agents.

## `apps/mobile` - Application iOS/Android

- [x] Mettre en place la navigation mobile.
- [x] Créer l’écran d’accueil mobile.
- [x] Créer l’onboarding mobile.
- [x] Ajouter l’authentification mobile.
- [x] Créer l’écran profil utilisateur.
- [x] Afficher la liste des offres de partenariat.
- [x] Afficher le détail d’une offre de partenariat.
- [x] Créer le formulaire de publication d’une offre.
- [x] Permettre à un utilisateur d’exprimer son intérêt pour une offre.
- [x] Ajouter les états loading, empty et error.
- [x] Configurer l’URL de l’API via `EXPO_PUBLIC_API_BASE_URL`.
- [x] Préparer la configuration EAS build pour iOS/Android.
- [x] Refaire le design mobile avec une direction visuelle inspirée de Zed.dev : moderne, sobre, précis, avec une texture ou ambiance papyrus maîtrisée.
- [x] Placer la navigation principale mobile en bas de l’écran plutôt qu’en haut.
- [x] Remplacer les exemples d’offres par des projets concrets de vraie vie : tonte de pelouse, toiture, lancement d’événement, création de jeu, petit commerce local, service saisonnier, etc.
- [x] Vérifier que les cartes d’offres mobile restent lisibles et actionnables sur petits écrans.

Note Agent 1 Mobile : l’app mobile expose le parcours complet côté client avec fallback local si
`EXPO_PUBLIC_API_BASE_URL` est absent. Les endpoints mobiles attendus sont maintenant exposés par
l’API : `GET /partnership-offers`, `POST /partnership-offers` et
`POST /partnership-offers/{id}/interests`. L’authentification mobile peut s’aligner sur la décision
transversale Supabase Auth côté clients.

Note design Agent 1 Mobile : navigation basse persistante, palette papier/papyrus, surfaces sombres
sobres, exemples d’offres réalistes et cartes compactes avec titre, méta, résumé limité et zone
tappable complète pour préserver la lisibilité sur petits écrans.

## `apps/web` - Client web séparé

- [x] Créer une landing page web claire.
- [x] Créer un parcours onboarding web.
- [x] Ajouter l’authentification web. Note : parcours démo local en attendant la décision auth Supabase/API.
- [x] Créer la page profil utilisateur. Note : données démo locales en attendant l’endpoint profil.
- [x] Afficher la liste des offres de partenariat. Note : données démo locales en attendant l’endpoint offres.
- [x] Afficher le détail d’une offre de partenariat. Note : données démo locales en attendant l’endpoint détail.
- [x] Créer le formulaire de publication d’une offre. Note : création locale en mémoire en attendant l’endpoint création.
- [x] Permettre à un utilisateur d’exprimer son intérêt pour une offre. Note : action locale en attendant l’endpoint intérêts/contact.
- [x] Ajouter les états loading, empty et error.
- [x] Configurer l’URL de l’API via `VITE_API_BASE_URL`.
- [x] Préparer le build de production web.
- [x] Documenter le futur choix de déploiement web. Note : Vercel pour le MVP, documenté dans `docs/WEB_DEPLOYMENT.md`.
- [x] Refaire le design web avec une direction visuelle inspirée de Zed.dev : professionnel, minimal, premium, avec une ambiance papyrus moderne.
- [x] S’assurer que la version web ne ressemble pas à une application mobile agrandie.
- [x] Concevoir une expérience web professionnelle : layout desktop-first, navigation web claire, sections larges, hiérarchie éditoriale forte.
- [x] Différencier explicitement les composants web des composants mobile : cartes, formulaires, navigation, spacing et densité d’information.
- [x] Adapter les exemples d’offres web à des cas professionnels et crédibles, sans ton trop “démo mobile”.

## `apps/api` - API ASP.NET Core

- [x] Créer les endpoints de santé de base.
- [x] Ajouter un endpoint de test de connexion Supabase.
- [x] Définir les DTOs API.
- [x] Ajouter la validation des payloads.
- [x] Créer les endpoints profil utilisateur.
- [x] Créer les endpoints offres de partenariat.
- [x] Créer les endpoints intérêts / demandes de contact.
- [x] Standardiser les erreurs HTTP.
- [x] Documenter les contrats d’API consommés par mobile et web.
- [x] Configurer CORS selon les environnements.
- [x] Ajouter des tests API de base. Note : smoke tests HTTP dans `apps/api/PartNApp.Api.http`.
- [x] Exposer les alias attendus par le mobile. Note : routes compatibles `GET /partnership-offers`, `POST /partnership-offers`, `POST /partnership-offers/{id}/interests`.

## `supabase` - Database

- [x] Créer une migration initiale.
- [x] Créer la table `profiles`.
- [x] Créer la table `partnership_offers`.
- [x] Créer la table `partnership_interests`.
- [x] Activer RLS sur les tables initiales.
- [x] Décider le modèle d’authentification. Note : Supabase Auth côté clients ; `auth.uid()` correspond à `profiles.id`.
- [x] Ajouter les policies RLS pour les profils.
- [x] Ajouter les policies RLS pour les offres.
- [x] Ajouter les policies RLS pour les intérêts.
- [x] Ajouter des seeds de développement si nécessaire. Note : pas de seed obligatoire à ce stade ; les tests HTTP créent leurs données.

## Transversal

- [x] Décider si Supabase Auth est utilisé directement côté clients ou via l’API. Note : Supabase Auth directement côté clients.
- [x] Définir les rôles utilisateurs. Note : rôles Supabase `anon` et `authenticated` pour le MVP ; ownership via `profiles.id`.
- [x] Définir une direction artistique commune inspirée de Zed.dev : minimalisme, surfaces calmes, typographie nette, détails précis, texture papyrus moderne. Note : voir `docs/PRODUCT_DECISIONS.md`.
- [x] Définir une palette couleur commune mobile/web sans rendre les deux interfaces identiques. Note : voir `docs/PRODUCT_DECISIONS.md`.
- [x] Définir des règles d’exemples d’offres réalistes pour éviter les données fictives trop génériques. Note : voir `docs/PRODUCT_DECISIONS.md`.
- [x] Définir le cycle de vie d’une offre de partenariat. Note : `idea`, `validation`, `building`, `launched`.
- [x] Définir le niveau de visibilité des profils. Note : profils lisibles par utilisateurs authentifiés ; offres publiques ; intérêts visibles aux participants.
- [x] Définir les règles de matching initiales. Note : pas de score automatique au MVP ; tri date descendante et filtres simples.
- [x] Choisir l’hébergement API. Note : Azure App Service pour le MVP ASP.NET Core.
- [x] Choisir l’hébergement web. Note : Vercel pour le build statique Vite.
- [x] Préparer la publication mobile via EAS. Note : `apps/mobile/eas.json` est présent avec profils development, preview et production.
