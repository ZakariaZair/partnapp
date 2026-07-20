# Contrats API PartNApp

Base locale recommandée :

- API : `http://localhost:5000`
- Web : configurer `VITE_API_BASE_URL=http://localhost:5000`
- Mobile : configurer `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000`

## Décision auth

PartNApp utilise Supabase Auth côté clients.

- Les clients web/mobile obtiennent l’identité utilisateur via Supabase Auth.
- L’UUID utilisateur Supabase Auth est aussi l’`id` de `profiles`.
- Les policies Supabase RLS sont préparées avec `auth.uid()`.
- L’API expose les contrats métier consommés par les clients. L’authentification HTTP de l’API pourra être ajoutée ensuite si le backend doit vérifier les JWT Supabase avant chaque mutation.

## Erreurs

L’API utilise les statuts HTTP standards :

- `400` avec `ValidationProblemDetails` pour les payloads invalides.
- `404` avec `ProblemDetails` pour les ressources absentes.
- `503` avec `ProblemDetails` si la connexion Supabase/PostgreSQL manque ou est indisponible.

## Health

### `GET /`

Retourne l’identité de l’API.

### `GET /health`

Retourne la santé applicative.

### `GET /health/db`

Teste la connexion PostgreSQL configurée par `ConnectionStrings__Supabase`.

## Profils

### `GET /api/profiles/{id}`

Retourne un profil.

Réponse `200` :

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "displayName": "Alex Founder",
  "headline": "Builds B2B SaaS products",
  "createdAt": "2026-07-15T12:00:00+00:00",
  "updatedAt": "2026-07-15T12:00:00+00:00"
}
```

### `PUT /api/profiles/{id}`

Crée ou met à jour le profil correspondant à l’utilisateur Supabase Auth.

Payload :

```json
{
  "displayName": "Alex Founder",
  "headline": "Builds B2B SaaS products"
}
```

Validation :

- `displayName` requis, 2 à 80 caractères.
- `headline` optionnel, maximum 160 caractères.

## Offres de partenariat

Valeurs autorisées :

- `stage` : `idea`, `validation`, `building`, `launched`
- `locationMode` : `remote`, `hybrid`, `onsite`

### `GET /api/offers`

Retourne les offres, triées par création descendante.

Filtres optionnels :

- `stage`
- `ownerId`

Exemple :

```http
GET /api/offers?stage=validation&ownerId=00000000-0000-0000-0000-000000000001
```

### `GET /api/offers/{id}`

Retourne une offre.

### `POST /api/offers`

Crée une offre.

Payload :

```json
{
  "ownerId": "00000000-0000-0000-0000-000000000001",
  "title": "Find a technical cofounder",
  "description": "I am validating a marketplace idea and looking for a technical partner to build the first version.",
  "stage": "validation",
  "skillsNeeded": ["React", "ASP.NET Core", "Product"],
  "commitment": "Evenings and weekends",
  "locationMode": "remote"
}
```

Validation :

- `ownerId` requis, UUID non vide.
- `title` requis, 3 à 120 caractères.
- `description` requise, 20 à 4000 caractères.
- `stage` requis, valeur autorisée.
- `skillsNeeded` requis, maximum 20 éléments ; chaque élément est non vide et maximum 60 caractères.
- `commitment` optionnel, maximum 160 caractères.
- `locationMode` requis, valeur autorisée.

### `PUT /api/offers/{id}`

Met à jour une offre avec le même payload que `POST /api/offers`.

### `DELETE /api/offers/{id}`

Supprime une offre.

Réponse :

- `204` si supprimée.
- `404` si absente.

## Compatibilité mobile actuelle

L’application mobile actuelle consomme encore les routes sans préfixe `/api`. L’API expose donc des alias compatibles pour éviter de bloquer l’intégration mobile.

### `GET /partnership-offers`

Alias mobile de `GET /api/offers`.

Réponse mobile :

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000010",
    "title": "Service local de tonte saisonnière",
    "summary": "Recherche un partenaire opérationnel pour lancer un service local de tonte et entretien de cour.",
    "projectStage": "Validation marché",
    "skillsNeeded": ["Opérations", "Vente locale"],
    "ownerName": "Alex",
    "location": "remote"
  }
]
```

### `POST /partnership-offers`

Alias mobile de création d’offre. L’API transforme le payload mobile vers `partnership_offers` et crée un profil mobile de développement si nécessaire.

Payload mobile :

```json
{
  "id": "local-123",
  "title": "Service local de tonte saisonnière",
  "summary": "Recherche un partenaire opérationnel pour lancer un service local de tonte et entretien de cour.",
  "projectStage": "Validation marché",
  "skillsNeeded": ["Opérations", "Vente locale"],
  "ownerName": "Alex",
  "location": "Montréal"
}
```

### `POST /partnership-offers/{id}/interests`

Alias mobile de `POST /api/offers/{offerId}/interests`.

Payload mobile :

```json
{
  "profileName": "Zakaria",
  "message": "Je souhaite échanger sur cette offre depuis l'app mobile."
}
```

Si `{id}` est un identifiant local non UUID, l’API accepte la requête sans créer de ligne Supabase. Cela permet au fallback local mobile de rester fonctionnel pendant l’intégration complète.

## Intérêts / demandes de contact

### `GET /api/offers/{offerId}/interests`

Retourne les intérêts reçus pour une offre.

### `GET /api/profiles/{profileId}/interests`

Retourne les intérêts envoyés par un profil.

### `POST /api/offers/{offerId}/interests`

Crée ou met à jour l’intérêt d’un profil pour une offre.

Payload :

```json
{
  "profileId": "00000000-0000-0000-0000-000000000001",
  "message": "I am interested in discussing the product and technical scope."
}
```

Validation :

- `profileId` requis, UUID non vide.
- `message` optionnel, maximum 1000 caractères.

### `DELETE /api/interests/{id}`

Supprime un intérêt.

Réponse :

- `204` si supprimé.
- `404` si absent.
