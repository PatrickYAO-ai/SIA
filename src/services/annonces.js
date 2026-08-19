// =============================================================================
//  COUCHE DE DONNEES DE VALOBTP
// =============================================================================
//
// C'EST LE FICHIER LE PLUS IMPORTANT DU PROJET. Lis ce bloc avant de le modifier.
//
// Depuis la migration vers Supabase, les annonces sont enregistrees dans une
// vraie base de donnees partagee, hebergee en ligne. Tous les visiteurs du
// site — chantiers et recycleurs, sur n'importe quel telephone ou ordinateur —
// lisent et ecrivent dans la MEME base. C'est ce qui permet a un recycleur de
// voir l'annonce publiee par un chantier a l'autre bout de la ville.
//
// (Avant cette migration, les annonces vivaient dans le localStorage du
// navigateur : chaque telephone avait sa propre liste, invisible des autres.
// Voir l'historique Git si besoin de retrouver cette version.)
//
// POURQUOI TOUT PASSER PAR CE FICHIER ?
// Aucune page de l'application ne parle directement a Supabase. Elles appellent
// uniquement les fonctions ci-dessous (listerAnnonces, creerAnnonce, ...).
// Si un jour le projet change encore de base de donnees, on ne reecrit QUE ce
// fichier : on garde exactement les memes noms de fonctions, et tout le reste
// de l'application continue de fonctionner sans y toucher. C'est ce qu'on
// appelle "isoler la couche de donnees".
//
// LIMITE A ASSUMER DEVANT LE JURY :
// Il n'y a pas de compte utilisateur. N'importe quel visiteur peut supprimer
// n'importe quelle annonce, pas seulement les siennes — exactement comme le
// permettait deja la version precedente sur son propre telephone, mais cette
// fois-ci le geste est visible de tous. Acceptable pour une preuve de concept
// publique ; la piste d'evolution n°2 de CLAUDE.md (comptes Chantier /
// Recycleur) est ce qui regle ce point pour une mise en production.
// =============================================================================

import { supabase } from './supabaseClient.js'

/** Nom de la table Supabase qui contient les annonces. */
const TABLE = 'annonces'

/**
 * Transforme une erreur Supabase en message comprehensible.
 * Fonction interne : Supabase renvoie des erreurs techniques (en anglais,
 * parfois cryptiques) ; on les remplace par un message utile en francais.
 */
function erreurLisible(erreur, contexte) {
  console.error(`ValoBTP : echec Supabase (${contexte}).`, erreur)
  return new Error(
    "Impossible de joindre la base de donnees en ligne. Verifie ta connexion " +
      'internet et reessaie dans un instant.'
  )
}

/**
 * Forme d'une annonce (le "modele de donnees") :
 *
 * {
 *   id: string,             identifiant unique, genere par la base de donnees
 *   titre: string,          ex. "Gravats de demolition - Villa Cocody"
 *   materiau: string,       id issu de src/data/materiaux.js (ex. "gravats")
 *   quantite: number,       ex. 12
 *   unite: string,          id issu de src/data/materiaux.js (ex. "tonne")
 *   description: string,    texte libre du chantier
 *   photo: string | null,   photo compressee en data URL
 *   zone: string,           id issu de src/data/zones.js (ex. "abidjan-cocody")
 *   lat: number,            latitude GPS
 *   lng: number,            longitude GPS
 *   nomChantier: string,    nom de l'entreprise ou du chantier
 *   telephone: string,      numero WhatsApp au format international (ex. "2250701020304")
 *   creeLe: string          date de creation au format ISO, generee par la base
 * }
 */

/**
 * Retourne toutes les annonces, de la plus recente a la plus ancienne.
 * @returns {Promise<Array>} la liste des annonces
 */
export async function listerAnnonces() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('creeLe', { ascending: false })

  if (error) throw erreurLisible(error, 'listerAnnonces')
  return data
}

/**
 * Retourne une annonce precise, ou null si elle n'existe pas.
 * @param {string} id
 */
export async function trouverAnnonce(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()

  if (error) throw erreurLisible(error, 'trouverAnnonce')
  return data
}

/**
 * Cree une nouvelle annonce.
 * L'id et la date de creation sont generes par la base de donnees elle-meme
 * (voir la table "annonces" cote Supabase) : la page qui appelle n'a pas a
 * s'en occuper.
 *
 * @param {object} donnees - les champs saisis dans le formulaire
 * @returns {Promise<object>} l'annonce complete telle qu'enregistree
 */
export async function creerAnnonce(donnees) {
  const { data, error } = await supabase.from(TABLE).insert(donnees).select().single()

  if (error) throw erreurLisible(error, 'creerAnnonce')
  return data
}

/**
 * Supprime une annonce (utile pendant les demonstrations, et pour liberer
 * de la place quand le stockage est plein).
 * @param {string} id
 */
export async function supprimerAnnonce(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error) throw erreurLisible(error, 'supprimerAnnonce')
}

/**
 * Filtre les annonces par materiau et/ou par zone.
 *
 * Le filtrage est fait ici, dans la couche de donnees : c'est Supabase (le
 * serveur) qui trie parmi toutes les annonces et ne renvoie que celles qui
 * correspondent, plutot que de tout envoyer au telephone pour filtrer sur
 * place. Important en 3G : moins de donnees a faire transiter.
 *
 * @param {{materiau?: string, zone?: string}} filtres - une valeur vide = "tous"
 */
export async function filtrerAnnonces({ materiau = '', zone = '' } = {}) {
  let requete = supabase.from(TABLE).select('*').order('creeLe', { ascending: false })

  if (materiau) requete = requete.eq('materiau', materiau)
  if (zone) requete = requete.eq('zone', zone)

  const { data, error } = await requete
  if (error) throw erreurLisible(error, 'filtrerAnnonces')
  return data
}

/**
 * Efface toutes les annonces. Reservee au bouton de reinitialisation
 * de la demonstration : a manipuler avec precaution, l'action est irreversible
 * et touche desormais la base PARTAGEE par tous les visiteurs du site.
 */
export async function viderAnnonces() {
  // Supabase exige un filtre explicite sur delete() par securite : "id n'est
  // jamais vide" est une condition toujours vraie, donc ceci supprime tout.
  const { error } = await supabase.from(TABLE).delete().not('id', 'is', null)
  if (error) throw erreurLisible(error, 'viderAnnonces')
}
