# ValoPro — contexte du projet

> Ce fichier est lu automatiquement par Claude Code au début de chaque session.
> Il évite d'avoir à réexpliquer le projet à chaque fois. À maintenir à jour
> quand une décision importante est prise.

---

## 1. Le projet en trois phrases

**ValoPro** met en relation les **chantiers BTP** et les **recycleurs** en Côte d'Ivoire,
pour que les déchets de chantier (gravats, béton, bois, ferraille…) soient valorisés
plutôt qu'abandonnés en décharge sauvage.

Un chantier publie une annonce (photo, matériau, quantité, localisation). Un recycleur
consulte les annonces sur une carte, filtre par type de matériau et par zone, puis
contacte le chantier **directement sur WhatsApp**.

Projet présenté au **SIA Digital Awards 2026 (GIBTP)**. Stade actuel : **prototype /
preuve de concept**.

## 2. Contraintes à ne jamais perdre de vue

Ces contraintes priment sur toute considération d'élégance technique.

| Contrainte | Conséquence concrète sur le code |
|---|---|
| **Développeur autodidacte** | Code simple et abondamment commenté en français. Pas d'abstraction « maligne ». Si un choix demande plus de trois phrases d'explication, c'est probablement le mauvais choix. |
| **Faible connectivité (3G)** | Le site doit rester léger. Budget actuel : **~109 Ko compressés**. Toute nouvelle dépendance doit être justifiée par rapport à ce budget. |
| **Usage majoritairement mobile** | On conçoit d'abord pour un écran de téléphone, on adapte ensuite pour l'ordinateur (`sm:`, `lg:` en Tailwind). Zones tactiles d'au moins 44 px de haut. |
| **Zéro budget** | Aucun service payant, aucune clé d'API nécessitant une carte bancaire. C'est pour cela qu'on utilise OpenStreetMap et non Google Maps. |

## 3. Stack technique et justification

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework front | **React 18** | La techno front la plus documentée au monde : trouver une réponse à un problème est toujours possible. |
| Outil de build | **Vite 5** | Démarrage instantané, produit un site statique très léger, quasi aucune configuration. |
| Styles | **Tailwind CSS 3** | Les styles s'écrivent directement sur l'élément : pas de va-et-vient entre fichiers, résultat visible immédiatement. |
| Navigation | **React Router 6** | Standard de fait pour les pages d'une application React. |
| Carte | **Leaflet + react-leaflet + OpenStreetMap** | Gratuit, sans clé d'API, ~40 Ko. Google Maps impose une facturation active dès le premier chargement. |
| Contact | **Lien `wa.me`** | Aucune messagerie à développer. Chantiers et recycleurs utilisent déjà WhatsApp au quotidien. |
| Stockage | **`localStorage` du navigateur** | Aucun serveur, aucun compte, fonctionne hors ligne. Voir la limite en section 6. |

**Versions volontairement non « dernières »** : React 18 plutôt que 19, Tailwind 3 plutôt
que 4, React Router 6 plutôt que 7. Ces versions concentrent l'immense majorité des
tutoriels et des réponses en ligne — un vrai avantage quand on apprend seul. Combinaison
vérifiée compatible. À ne pas mettre à jour sans raison précise.

## 4. Structure des dossiers

```
/
├── CLAUDE.md              ← ce fichier
├── README.md              ← comment lancer et déployer le projet
├── index.html             ← page HTML unique, point de départ
├── package.json           ← dépendances et commandes npm
├── vite.config.js         ← configuration du build
├── tailwind.config.js     ← couleurs de la marque ValoPro
├── postcss.config.js      ← branchement de Tailwind (à ne pas toucher)
├── netlify.toml           ← déploiement Netlify
├── vercel.json            ← déploiement Vercel
└── src/
    ├── main.jsx           ← point d'entrée : branche React sur index.html
    ├── App.jsx            ← en-tête + routeur (aiguillage des pages) + pied de page
    ├── index.css          ← styles globaux (volontairement très peu nombreux)
    │
    ├── data/              ← DONNÉES DE RÉFÉRENCE (à modifier sans toucher au code)
    │   ├── materiaux.js   ← liste fixe des matériaux + unités
    │   └── zones.js       ← communes d'Abidjan + villes, avec leurs coordonnées GPS
    │
    ├── services/          ← ACCÈS AUX DONNÉES — voir section 6
    │   └── annonces.js    ← lister / créer / filtrer / supprimer les annonces
    │
    ├── utils/             ← fonctions utilitaires sans affichage
    │   ├── image.js       ← compression des photos avant enregistrement
    │   └── whatsapp.js    ← normalisation des numéros + génération du lien wa.me
    │
    ├── components/        ← morceaux d'interface réutilisables
    │   ├── EnTete.jsx
    │   ├── Filtres.jsx
    │   ├── CarteAnnonce.jsx      ← la FICHE d'une annonce
    │   ├── CarteInteractive.jsx  ← la CARTE géographique (Leaflet)
    │   └── BoutonWhatsApp.jsx
    │
    └── pages/             ← une page = une adresse
        ├── ListeAnnonces.jsx   ← "/"        profil Recycleur
        └── PublierAnnonce.jsx  ← "/publier" profil Chantier
```

⚠️ **Piège de vocabulaire** : en français, « carte » signifie à la fois *fiche* et *map*.
Dans ce projet : `CarteAnnonce` = la fiche d'une annonce ; `CarteInteractive` = la carte
géographique. Conserver cette distinction.

## 5. Conventions de code

**Langue.** Tout est en français : noms de variables, de fonctions, de composants,
commentaires. Seuls restent en anglais les mots imposés par React et JavaScript
(`useState`, `props`, `map`, `className`…). Les commentaires évitent les caractères
accentués pour rester lisibles dans tous les éditeurs et terminaux.

**Nommage.**
- Composants : `PascalCase`, un fichier `.jsx` par composant (`CarteAnnonce.jsx`).
- Fonctions et variables : `camelCase` (`listerAnnonces`, `annonceActive`).
- Constantes fixes : `MAJUSCULES_AVEC_UNDERSCORES` (`MATERIAUX`, `CLE_STOCKAGE`).
- Gestionnaires d'événements : préfixe `gerer` (`gererPhoto`, `gererSuppression`).
- Propriétés de type callback : préfixe `on` (`onChange`, `onSurvol`).

**Organisation d'un fichier de page**, toujours dans cet ordre :
1. les états (`useState`) — ce qui change à l'écran ;
2. les fonctions de gestion — ce qui se passe quand l'utilisateur agit ;
3. le `return` (JSX) — ce qui s'affiche ;
4. les petits composants d'affichage locaux, en bas de fichier.

**Commentaires.** On commente le **pourquoi**, jamais le **quoi**. `// on incrémente i`
est inutile ; `// garde-fou : évite qu'une réponse lente écrase une réponse plus récente`
est utile. Chaque décision technique non évidente doit être expliquée en langage simple.

**Découpage en composants.** Un composant utilisé par une seule page reste **dans le
fichier de cette page**, en bas. On le déplace dans `src/components/` seulement quand une
**deuxième** page en a besoin. Objectif : éviter une forêt de micro-fichiers.

**Données de référence.** Ajouter un matériau ou une zone se fait **uniquement** dans
`src/data/`. Le formulaire, les filtres et la carte se mettent à jour automatiquement.
Ne jamais écrire en dur une liste de matériaux dans une page.

**Styles.** Tailwind directement dans le JSX. On n'ajoute une règle dans `index.css` que
si elle doit vraiment s'appliquer partout. Toujours partir du mobile, puis ajouter les
variantes `sm:` / `lg:`.

**Validation.** Toujours valider en JavaScript, jamais en se reposant uniquement sur les
attributs HTML `required` — ils se contournent trop facilement. Les messages d'erreur
sont en français, concrets, et proposent une solution.

**Les trois états d'une liste.** Toute liste doit gérer : *chargement* → *vide* →
*remplie*. Oublier le cas « vide » est l'erreur la plus fréquente, et la première que
verra un jury.

## 6. Le point le plus important : `src/services/annonces.js`

**Aucune page ne parle directement à `localStorage`.** Toutes passent par les fonctions
de `src/services/annonces.js` (`listerAnnonces`, `creerAnnonce`, `filtrerAnnonces`,
`supprimerAnnonce`).

Cette règle a un but précis : le jour où le projet passe à une vraie base de données
(Supabase, Firebase, serveur Node), **seul ce fichier sera réécrit**. Les noms des
fonctions restent identiques, et le reste de l'application continue de fonctionner sans
modification. C'est ce qu'on appelle *isoler la couche de données*.

C'est aussi pour cela que ces fonctions sont déjà `async` alors que `localStorage` est
instantané : un vrai serveur, lui, met du temps à répondre. Les pages sont donc déjà
prêtes pour cette bascule.

**Limite à assumer devant le jury** : avec `localStorage`, les annonces restent sur le
téléphone qui les a créées. Deux utilisateurs ne voient pas les mêmes annonces. C'est
acceptable pour une preuve de concept, pas pour la mise en production.

**Modèle de données d'une annonce :**

```js
{
  id: string,           // identifiant unique généré automatiquement
  titre: string,
  materiau: string,     // id issu de src/data/materiaux.js — ex. "gravats"
  quantite: number,
  unite: string,        // id issu de src/data/materiaux.js — ex. "tonne"
  description: string,
  photo: string | null, // photo compressée en data URL (base64)
  zone: string,         // id issu de src/data/zones.js — ex. "abidjan-cocody"
  lat: number,          // latitude GPS
  lng: number,          // longitude GPS
  nomChantier: string,
  telephone: string,    // format international sans "+" — ex. "2250701020304"
  creeLe: string        // date ISO
}
```

⚠️ Les `id` de `src/data/materiaux.js` et `src/data/zones.js` sont **stockés dans les
données**. Renommer un `id` rendrait introuvables toutes les annonces existantes. On peut
changer librement un `libelle` (le texte affiché) ; jamais un `id`.

## 7. Pièges déjà rencontrés et résolus

- **Photos et quota.** `localStorage` est limité à ~5 Mo, une photo de smartphone pèse
  3 à 8 Mo. `src/utils/image.js` redimensionne à 1000 px et recompresse en JPEG (~100 Ko)
  **avant** tout enregistrement. Ne jamais enregistrer une photo brute.
- **Icônes Leaflet cassées avec Vite.** Problème classique de chemin d'images. Contourné
  en dessinant les marqueurs en HTML/CSS via `L.divIcon` (voir `CarteInteractive.jsx`) :
  plus léger, et coloré par matériau.
- **La carte n'apparaît pas.** `.leaflet-container` a besoin d'une hauteur explicite.
  Elle est définie dans `index.css`.
- **`useMap()` plante.** Ce hook n'est utilisable que dans un composant placé *à
  l'intérieur* de `<MapContainer>`. D'où le composant `RecentrerCarte`, qui n'affiche
  rien mais pilote la carte.
- **Erreur 404 en production sur `/publier`.** Une application React n'a qu'un seul
  fichier HTML. Le serveur doit renvoyer toutes les adresses vers `index.html` — c'est le
  rôle de `netlify.toml` et `vercel.json`. Ne pas supprimer ces fichiers.
- **Géolocalisation inactive.** L'API du navigateur exige `https://` (ou `localhost`).
  Ce n'est pas un bug : en ligne, le https est automatique. Il existe de toute façon un
  repli sur le centre de la zone choisie, pour qu'une annonce ait **toujours** un point
  sur la carte.
- **Un `<button>` dans un `<form>` soumet le formulaire.** Toujours écrire
  `type="button"` sur un bouton qui ne doit pas soumettre.

## 8. Commandes

```bash
npm install      # installer les dépendances (une seule fois)
npm run dev      # serveur de développement → http://localhost:5173
npm run build    # fabriquer le site final dans dist/
npm run preview  # tester le site final en local avant mise en ligne
```

`npm run dev` est accessible depuis un téléphone sur le même wifi (option `host: true`
dans `vite.config.js`) : afficher l'adresse réseau donnée dans le terminal.

## 9. Pistes d'évolution, par ordre de priorité

1. **Vraie base de données partagée** (Supabase). Ne modifier que
   `src/services/annonces.js`. C'est ce qui débloque la démonstration multi-utilisateurs.
2. **Comptes utilisateurs** avec les deux profils Chantier / Recycleur, pour qu'un
   chantier ne puisse modifier que ses propres annonces.
3. **Recherche par proximité** : « les annonces à moins de 10 km de moi ».
4. **Mode hors ligne** (PWA) : consulter les annonces déjà chargées sans réseau — un
   vrai atout côté connectivité.
5. **Statut d'une annonce** (disponible / réservée / collectée), pour éviter que dix
   recycleurs appellent pour un lot déjà parti.
6. **Indicateurs d'impact** : tonnes détournées de la décharge, CO₂ évité. Argument fort
   pour un concours et pour d'éventuels partenaires institutionnels.
