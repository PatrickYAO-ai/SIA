# ♻️ ValoPro

**Plateforme de mise en relation entre chantiers BTP et recycleurs en Côte d'Ivoire.**

Les chantiers publient leurs déchets valorisables (gravats, béton, bois, ferraille…),
les recycleurs les trouvent sur une carte et les contactent sur WhatsApp.

> Prototype présenté au **SIA Digital Awards 2026 — GIBTP**.

---

## Démarrer en 3 commandes

```bash
npm install     # à faire une seule fois
npm run dev     # lance le site sur http://localhost:5173
```

Ouvre ensuite <http://localhost:5173> dans ton navigateur.

**Pour tester sur ton téléphone** : garde le téléphone sur le même wifi que
l'ordinateur, et ouvre l'adresse « Network » affichée dans le terminal
(du type `http://192.168.1.12:5173`).

## Les deux écrans

| Adresse | Écran | Pour qui |
|---|---|---|
| `/` | Liste des annonces + carte interactive + filtres | **Recycleur** |
| `/publier` | Formulaire de publication d'une annonce | **Chantier** |

### Publier une annonce (profil Chantier)
Photo (compressée automatiquement), type de matériau choisi dans une liste fixe,
quantité et unité, description, zone et position GPS, nom du chantier et numéro WhatsApp.

### Consulter les annonces (profil Recycleur)
Filtrage par matériau et par zone, carte interactive avec un marqueur coloré par type de
matériau, et un bouton **Contacter** sur chaque annonce qui ouvre WhatsApp avec un message
déjà rédigé (matériau, quantité, lieu inclus).

## Stack technique

React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Leaflet + OpenStreetMap

Site final : **~109 Ko compressés** — pensé pour fonctionner en 3G.
Aucune clé d'API, aucun service payant, aucun compte à créer.

Le détail des choix techniques et des conventions de code se trouve dans
[`CLAUDE.md`](./CLAUDE.md).

## Où sont les données ?

Dans ce prototype, les annonces sont enregistrées dans le **navigateur** (`localStorage`).
Aucun serveur n'est nécessaire, mais les annonces restent sur l'appareil qui les a créées.

Tout l'accès aux données passe par un seul fichier — `src/services/annonces.js` — afin que
le passage à une vraie base de données (Supabase, Firebase…) ne demande de réécrire que
ce fichier, sans toucher au reste de l'application.

## Mettre en ligne

Le projet est prêt pour Netlify comme pour Vercel : la configuration nécessaire est déjà
présente (`netlify.toml`, `vercel.json`), et le certificat https est fourni
automatiquement — ce qui est indispensable au fonctionnement de la géolocalisation.

**Netlify**
1. Pousser le code sur GitHub.
2. Sur [netlify.com](https://netlify.com) → *Add new site* → *Import an existing project*.
3. Choisir le dépôt. Netlify lit `netlify.toml` : rien à configurer.
4. *Deploy*.

**Vercel**
1. Sur [vercel.com](https://vercel.com) → *Add New* → *Project*.
2. Choisir le dépôt. Le préréglage « Vite » est détecté automatiquement.
3. *Deploy*.

## Commandes disponibles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement, rechargement instantané |
| `npm run build` | Fabrique le site final dans `dist/` |
| `npm run preview` | Teste le site final en local avant mise en ligne |

## Licence

Prototype — tous droits réservés.
