# OrdiSpace — Espace Partenaire

Application web mobile (Next.js) des **partenaires OrdiSpace** : des représentants d'OrdiSpace dans une ou plusieurs villes. Le partenaire dispose de tout le catalogue OrdiSpace, l'achète à son **prix de cession** (fixé par l'administration) et le revend au prix qu'il veut à ses clients : la différence est son bénéfice.

Elle consomme l'API du dépôt [`Ordi-Space_backend`](https://github.com/Daymond2025/Ordi-Space_backend) (Laravel) via des jetons Bearer (Sanctum).

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Authentification : téléphone + code OTP reçu par WhatsApp **uniquement** (rôle `partenaire`). Pas d'inscription : le compte (boutique, villes couvertes, remise) est créé par l'administration.
- Application installable (PWA)

## Fonctionnement

- **Prix de cession** : prix OrdiSpace moins la remise par défaut du partenaire, ou prix d'exception fixé produit par produit par l'administration. Le partenaire ne voit jamais le prix fournisseur.
- **Prix de vente** : fixé par le partenaire, jamais inférieur à son prix de cession.
- **Stock** : chaque mouvement est tracé (approvisionnement, vente, retour, ajustement) ; il ne peut pas passer sous zéro.
- **Commandes** : mêmes statuts que le circuit OrdiSpace (en attente, validée, en livraison, livrée, reportée, client injoignable, numéro incorrect, annulée). Le stock sort à la validation et revient en cas d'annulation. Le partenaire encaisse et livre lui-même son client.
- **Commande depuis le catalogue** : le partenaire saisit le nom, le numéro et le lieu de livraison de son client. En stock, la commande est validée tout de suite ; sinon il paie à OrdiSpace le prix de cession des articles manquants. L'écran « Confirmation » (Wave) est une **formalité** : le paiement se fait hors application, l'administration le valide, expédie, et la commande du client est validée à la réception.
- **Conversations** : visibles du partenaire et du coordinateur uniquement — jamais du fournisseur.

## Écrans

- **Space** — accueil : compteurs par période (stock, ventes, nouvelles commandes, chiffre d'affaires, investissement, bénéfice) et produits commandés.
- **Centre des commandes** (bouton central) — « Chat & commandes » et « Commandes uniquement » ; discussion produit ; détail commande (Suivie / Information) avec feuille de statut.
- **Catalogue** — mêmes pages que la Market Space client (recherche, catégories, filtres, fiche produit) avec ses prix, bénéfice et stock ; commande pour un client, récapitulatif, confirmation et suivi du paiement.
- **Profil** et **Statistiques**.

## Structure du projet

```text
src/
├── app/
│   ├── connexion/ (verification/)
│   ├── (shell)/               # Pages avec la barre de navigation
│   │   ├── commandes/, commande/[id]/, produits/[id]/   # Suivi des commandes et discussions
│   │   ├── catalogue/ (filtres/, resultats/)
│   │   └── profil/ (modifier/), statistiques/
│   ├── article/[id]/          # Fiche produit + parcours de commande (plein écran)
│   └── paiement/[id]/         # Suivi du paiement d'un approvisionnement
├── components/                # catalogue/, commande/, discussion/, operations/, space/, icônes
├── context/                   # AuthContext
└── lib/                       # api.ts, types.ts, catalogue.ts, filtresCatalogue.ts, statuts.ts…
```

## Démarrage

Prérequis : Node.js 20+, et l'API backend lancée.

```bash
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3006 (port fixé dans package.json)
```

`http://localhost:3006` doit figurer dans `CORS_ALLOWED_ORIGINS` du backend. En local, sans WhatsApp configuré, le code OTP est renvoyé par l'API (`code_debug`).

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de base de l'API (ex. `http://127.0.0.1:8000/api/v1` en local, `https://ordisapce.daymondboutique.com/api/v1` en production) |

Aucune clé secrète ne doit se trouver dans cette app.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement sur le port 3006 (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Déploiement

Configurer `NEXT_PUBLIC_API_URL` sur l'hébergeur et ajouter le domaine de l'app à `CORS_ALLOWED_ORIGINS` côté backend. Tout nouveau domaine d'API doit être ajouté à `images.remotePatterns` dans `next.config.ts` (images produits servies depuis `/storage`).
