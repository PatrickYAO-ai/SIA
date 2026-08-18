// Liste FIXE des types de materiaux valorisables sur ValoBTP.
//
// Pourquoi une liste fixe plutot qu'un champ texte libre ?
// Parce que si chaque chantier ecrit ce qu'il veut ("beton", "Béton", "beton arme"),
// le filtrage cote recycleur devient impossible. Une liste fermee garantit
// que le filtre "Beton" retrouve bien 100 % des annonces de beton.
//
// Pour ajouter un materiau : ajouter un objet ici, rien d'autre a modifier
// dans l'application. Le formulaire, les filtres et la carte se mettent a jour seuls.
//
// - id       : valeur technique stockee en base. NE JAMAIS la changer une fois en production
//              (les anciennes annonces deviendraient introuvables).
// - libelle  : ce que l'utilisateur lit a l'ecran.
// - emoji    : repere visuel, utile quand on lit vite sur un petit ecran.
// - couleur  : couleur du marqueur sur la carte (code hexadecimal).

export const MATERIAUX = [
  {
    id: 'gravats',
    libelle: 'Gravats',
    emoji: '🧱',
    couleur: '#8b7355',
    description: 'Debris de demolition, briques, parpaings casses',
  },
  {
    id: 'beton',
    libelle: 'Beton',
    emoji: '🪨',
    couleur: '#64748b',
    description: 'Beton concasse, dalles, blocs, beton arme',
  },
  {
    id: 'bois',
    libelle: 'Bois',
    emoji: '🪵',
    couleur: '#b45309',
    description: 'Coffrages, palettes, chutes de charpente',
  },
  {
    id: 'ferraille',
    libelle: 'Ferraille',
    emoji: '⚙️',
    couleur: '#b91c1c',
    description: 'Fers a beton, profiles metalliques, chutes d acier',
  },
  {
    id: 'terre',
    libelle: 'Terre et remblais',
    emoji: '⛰️',
    couleur: '#92400e',
    description: 'Terre de terrassement, sable, laterite excedentaire',
  },
  {
    id: 'carrelage',
    libelle: 'Carrelage et ceramique',
    emoji: '🔲',
    couleur: '#0f766e',
    description: 'Carreaux casses, faience, sanitaires',
  },
  {
    id: 'plastique',
    libelle: 'Plastique et PVC',
    emoji: '🧴',
    couleur: '#1d4ed8',
    description: 'Tuyaux PVC, bâches, emballages de chantier',
  },
  {
    id: 'melange',
    libelle: 'Melange (tout-venant)',
    emoji: '📦',
    couleur: '#475569',
    description: 'Benne contenant plusieurs types de dechets',
  },
]

// Unites de quantite proposees dans le formulaire.
// On reste sur les unites reellement utilisees sur un chantier ivoirien.
export const UNITES = [
  { id: 'tonne', libelle: 'tonne(s)' },
  { id: 'm3', libelle: 'm³ (metre cube)' },
  { id: 'benne', libelle: 'benne(s) / camion(s)' },
  { id: 'palette', libelle: 'palette(s)' },
]

// --- Petites fonctions utilitaires ---
// On les met ici pour ne jamais avoir a chercher un materiau "a la main"
// avec un .find() recopie dans dix fichiers differents.

/** Retourne l'objet materiau correspondant a un id, ou undefined si inconnu. */
export function trouverMateriau(id) {
  return MATERIAUX.find((m) => m.id === id)
}

/** Retourne le libelle lisible d'un materiau (ou l'id brut si le materiau a ete supprime). */
export function libelleMateriau(id) {
  return trouverMateriau(id)?.libelle ?? id
}

/** Retourne le libelle lisible d'une unite. */
export function libelleUnite(id) {
  return UNITES.find((u) => u.id === id)?.libelle ?? id
}
