# Vérifications de ValoPro

Deux scripts qui contrôlent que l'application fonctionne réellement — pas
seulement qu'elle compile. Ils ont été écrits après avoir constaté qu'un build
réussi ne prouve rien : trois vrais bugs sont passés à travers `npm run build`
et n'ont été trouvés qu'en pilotant l'application.

## 1. Données et fonctions — rapide, aucune installation

```bash
npm run verifier:donnees
```

S'exécute avec Node seul, en une fraction de seconde. À lancer **après chaque
modification de `src/data/` ou de `src/utils/whatsapp.js`**.

Contrôle notamment que les identifiants de matériaux et de zones restent
uniques : un doublon rendrait des annonces existantes introuvables.

## 2. Parcours navigateur — complet, plus lent

```bash
# une seule fois : installer l'outil de pilotage
npm install --no-save playwright
npx playwright install chromium

npm run verifier:navigateur
```

Pilote l'application dans un vrai navigateur, sur un écran de téléphone
(390 × 844), et couvre onze domaines — photo, validation, géolocalisation,
suppression, stockage saturé, ergonomie tactile, tenue en charge, carte.

Compter deux à trois minutes : deux étapes attendent volontairement un délai
d'expiration de 12 secondes.

### Pourquoi Playwright n'est pas dans `package.json`

Il pèse plusieurs centaines de mégaoctets une fois le navigateur téléchargé.
Le laisser hors des dépendances garde `npm install` léger — ce qui compte quand
on travaille avec une connexion limitée. On l'installe le jour où on lance
cette vérification, et l'option `--no-save` évite qu'il s'ajoute au projet.

### Tester le site final plutôt que le serveur de développement

C'est le site final qui sera mis en ligne pour le concours : il vaut mieux
vérifier celui-là avant une présentation.

```bash
npm run build
npx vite preview --port 4180
VALOPRO_URL=http://localhost:4180 npm run verifier:navigateur
```

## À quoi ressemble un échec

Chaque contrôle affiche `ok` ou `ECHEC`, suivi de la valeur obtenue. Exemple
réel, celui qui a révélé que des boutons étaient trop petits pour un doigt :

```
ECHEC zones tactiles >= 44 px (formulaire) -> SELECT"-- Choisir --" 40px
```

Le script se termine sur `TOUTES LES VERIFICATIONS PASSENT`, ou sur le nombre
d'échecs.

## Bon à savoir

Sans accès à OpenStreetMap, le fond de carte reste **gris**. Ce n'est pas un
échec : les marqueurs, les popups et le recentrage sont testés indépendamment
des images de fond.
