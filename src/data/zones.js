// Zones geographiques couvertes par ValoPro (Cote d'Ivoire).
//
// Chaque zone porte ses coordonnees GPS approximatives (latitude / longitude).
// Elles servent a deux choses :
//   1. centrer la carte sur la zone choisie dans les filtres ;
//   2. donner une position par defaut a une annonce quand le chantier
//      refuse ou ne peut pas activer la geolocalisation de son telephone.
//
// Rappel de vocabulaire : la latitude va du sud au nord, la longitude d'ouest
// en est. La Cote d'Ivoire est au nord de l'equateur (latitude positive) et a
// l'ouest de Greenwich (longitude negative).

export const ZONES = [
  // --- District d'Abidjan (decoupe par commune, la ou il y a le plus de chantiers) ---
  { id: 'abidjan-cocody', libelle: 'Abidjan - Cocody', groupe: 'Abidjan', lat: 5.36, lng: -3.99 },
  { id: 'abidjan-yopougon', libelle: 'Abidjan - Yopougon', groupe: 'Abidjan', lat: 5.345, lng: -4.08 },
  { id: 'abidjan-plateau', libelle: 'Abidjan - Plateau', groupe: 'Abidjan', lat: 5.325, lng: -4.02 },
  { id: 'abidjan-marcory', libelle: 'Abidjan - Marcory', groupe: 'Abidjan', lat: 5.295, lng: -3.98 },
  { id: 'abidjan-treichville', libelle: 'Abidjan - Treichville', groupe: 'Abidjan', lat: 5.295, lng: -4.01 },
  { id: 'abidjan-koumassi', libelle: 'Abidjan - Koumassi', groupe: 'Abidjan', lat: 5.29, lng: -3.945 },
  { id: 'abidjan-port-bouet', libelle: 'Abidjan - Port-Bouet', groupe: 'Abidjan', lat: 5.26, lng: -3.926 },
  { id: 'abidjan-abobo', libelle: 'Abidjan - Abobo', groupe: 'Abidjan', lat: 5.43, lng: -4.02 },
  { id: 'abidjan-adjame', libelle: 'Abidjan - Adjame', groupe: 'Abidjan', lat: 5.36, lng: -4.025 },
  { id: 'abidjan-attecoube', libelle: 'Abidjan - Attecoube', groupe: 'Abidjan', lat: 5.34, lng: -4.04 },
  { id: 'abidjan-bingerville', libelle: 'Abidjan - Bingerville', groupe: 'Abidjan', lat: 5.355, lng: -3.885 },
  { id: 'abidjan-songon', libelle: 'Abidjan - Songon', groupe: 'Abidjan', lat: 5.32, lng: -4.25 },
  { id: 'abidjan-anyama', libelle: 'Abidjan - Anyama', groupe: 'Abidjan', lat: 5.494, lng: -4.052 },

  // --- Autres villes ---
  { id: 'grand-bassam', libelle: 'Grand-Bassam', groupe: 'Autres villes', lat: 5.2118, lng: -3.7383 },
  { id: 'yamoussoukro', libelle: 'Yamoussoukro', groupe: 'Autres villes', lat: 6.8276, lng: -5.2893 },
  { id: 'bouake', libelle: 'Bouake', groupe: 'Autres villes', lat: 7.69, lng: -5.03 },
  { id: 'san-pedro', libelle: 'San-Pedro', groupe: 'Autres villes', lat: 4.7485, lng: -6.6363 },
  { id: 'daloa', libelle: 'Daloa', groupe: 'Autres villes', lat: 6.877, lng: -6.45 },
  { id: 'korhogo', libelle: 'Korhogo', groupe: 'Autres villes', lat: 9.458, lng: -5.6294 },
  { id: 'man', libelle: 'Man', groupe: 'Autres villes', lat: 7.4125, lng: -7.5539 },
  { id: 'gagnoa', libelle: 'Gagnoa', groupe: 'Autres villes', lat: 6.1319, lng: -5.9506 },
  { id: 'abengourou', libelle: 'Abengourou', groupe: 'Autres villes', lat: 6.7297, lng: -3.4964 },
  { id: 'divo', libelle: 'Divo', groupe: 'Autres villes', lat: 5.839, lng: -5.3572 },
]

// Vue par defaut de la carte : le district d'Abidjan, la ou se concentre l'activite BTP.
export const CENTRE_PAR_DEFAUT = { lat: 5.345, lng: -4.024 }
export const ZOOM_PAR_DEFAUT = 11

/** Retourne l'objet zone correspondant a un id, ou undefined. */
export function trouverZone(id) {
  return ZONES.find((z) => z.id === id)
}

/** Retourne le libelle lisible d'une zone. */
export function libelleZone(id) {
  return trouverZone(id)?.libelle ?? id
}

/**
 * Regroupe les zones par "groupe" (Abidjan / Autres villes).
 * Sert a afficher un <select> avec des <optgroup>, plus lisible qu'une liste de 23 lignes.
 */
export function zonesParGroupe() {
  const groupes = {}
  for (const zone of ZONES) {
    // Si le groupe n'existe pas encore, on cree le tableau vide.
    if (!groupes[zone.groupe]) groupes[zone.groupe] = []
    groupes[zone.groupe].push(zone)
  }
  return groupes
}
