# Décisions produit et transversales

Ce document complète `docs/FEATURES_CHECKLIST.md` pour éviter que mobile, web et API prennent des décisions incompatibles.

## Direction artistique commune

Inspiration : Zed.dev, sans copie directe.

Principes :

- interfaces sobres, nettes, professionnelles ;
- surfaces calmes avec hiérarchie forte ;
- typographie lisible, contrastes maîtrisés ;
- détails précis plutôt que décor excessif ;
- texture papyrus moderne utilisée comme ambiance légère, pas comme thème rustique.

Mobile et web doivent partager une direction, mais pas les mêmes composants ni les mêmes densités.

## Palette commune

Palette de base recommandée :

- fond principal : `#f4efe3`
- surface claire : `#fffaf0`
- surface subtile : `#ebe1cf`
- texte principal : `#171511`
- texte secondaire : `#5f574a`
- accent principal : `#c06a36`
- accent sombre : `#7a3f24`
- bordures : `#d8ccb8`

Règle : mobile peut utiliser des surfaces plus compactes et des CTA plus directs ; web doit garder plus d’espace, une grille desktop-first et une hiérarchie éditoriale plus forte.

## Exemples d’offres réalistes

Éviter les placeholders génériques de type “projet SaaS” sans contexte.

Exemples à privilégier :

- tonte de pelouse et entretien saisonnier ;
- réparation de toiture ou service local spécialisé ;
- lancement d’événement communautaire ;
- création d’un jeu indépendant ;
- commerce local ou kiosque saisonnier ;
- service de nettoyage, déménagement, livraison ou maintenance ;
- activité B2B concrète avec client cible explicite.

Chaque offre d’exemple doit contenir :

- un problème concret ;
- un contexte local ou sectoriel ;
- les compétences recherchées ;
- un niveau d’engagement attendu ;
- un stade de projet clair.

## Cycle de vie d’une offre

Les valeurs API sont :

- `idea` : idée cadrée, pas encore validée ;
- `validation` : validation terrain ou premiers prospects ;
- `building` : MVP, prototype ou opération en construction ;
- `launched` : activité lancée avec premiers utilisateurs, clients ou opérations.

Pour le MVP, une offre reste visible tant qu’elle existe. L’archivage pourra être ajouté plus tard avec un champ dédié si nécessaire.

## Visibilité des profils

MVP :

- les profils sont lisibles par les utilisateurs authentifiés ;
- l’`id` du profil correspond à `auth.uid()` Supabase ;
- le propriétaire peut créer et modifier son profil ;
- les visiteurs anonymes peuvent lire les offres publiques, mais pas les détails relationnels des intérêts.

## Matching initial

Pas d’algorithme de matching automatique au MVP.

Règle initiale :

- tri des offres par date de création descendante ;
- filtres simples par `stage` et `ownerId` côté API ;
- matching éditorial côté clients via compétences, localisation et stade affichés.

Un score de matching pourra être ajouté plus tard à partir des compétences recherchées, de la localisation et du niveau d’engagement.

## Hébergement

Décisions MVP :

- API : Azure App Service, adapté à ASP.NET Core et simple à opérer au démarrage.
- Web : Vercel pour le build statique Vite et la configuration simple de `VITE_API_BASE_URL`.
- Mobile : EAS Build/Submit, avec `apps/mobile/eas.json` comme base de configuration.
