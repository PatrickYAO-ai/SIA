// =============================================================================
//  COUCHE DE DONNEES DE VALOBTP
// =============================================================================
//
// C'EST LE FICHIER LE PLUS IMPORTANT DU PROJET. Lis ce bloc avant de le modifier.
//
// Aujourd'hui, les annonces sont enregistrees dans le localStorage du navigateur :
// une petite base de donnees integree a Chrome / Firefox, qui survit a la fermeture
// de l'onglet. Aucun serveur, aucun compte a creer, aucun cout : parfait pour
// un prototype qu'on doit pouvoir demontrer partout, meme sans connexion internet.
//
// SA LIMITE, a connaitre et a assumer devant le jury :
// les annonces restent sur LE telephone qui les a creees. Deux utilisateurs
// differents ne voient pas les memes annonces. C'est acceptable pour une preuve
// de concept, pas pour la vraie vie.
//
// POURQUOI TOUT PASSER PAR CE FICHIER ?
// Aucune page de l'application ne parle directement a localStorage. Elles appellent
// uniquement les fonctions ci-dessous (listerAnnonces, creerAnnonce, ...).
// Le jour ou tu passes a une vraie base de donnees (Supabase, Firebase, ton propre
// serveur Node), tu ne reecris QUE ce fichier : tu remplaces le contenu des fonctions,
// tu gardes exactement les memes noms, et tout le reste de l'application continue
// de fonctionner sans y toucher. C'est ce qu'on appelle "isoler la couche de donnees",
// et c'est ce qui evite de tout casser lors d'une migration.
//
// Toutes les fonctions sont deja "async" (asynchrones) alors que localStorage est
// instantane. C'est volontaire : un vrai serveur, lui, met du temps a repondre.
// En ecrivant async des maintenant, les pages sont deja pretes pour cette bascule.
// =============================================================================

/**
 * Cle sous laquelle les annonces sont rangees dans le navigateur.
 * Le numero de version permet, plus tard, de changer la forme des donnees
 * sans faire planter l'application des utilisateurs qui ont l'ancienne version.
 */
const CLE_STOCKAGE = 'valobtp.annonces.v1'

/**
 * Lit le tableau brut des annonces depuis le navigateur.
 * Fonction interne (non exportee) : le reste de l'application ne doit pas s'en servir.
 */
function lireStockage() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return []

    const donnees = JSON.parse(brut)
    // Ceinture et bretelles : si quelqu'un a corrompu la valeur a la main,
    // on repart d'une liste vide plutot que de faire planter toute l'application.
    return Array.isArray(donnees) ? donnees : []
  } catch (erreur) {
    console.error('ValoBTP : donnees illisibles dans le navigateur.', erreur)
    return []
  }
}

/**
 * Enregistre le tableau complet des annonces dans le navigateur.
 * Fonction interne.
 */
function ecrireStockage(annonces) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(annonces))
  } catch (erreur) {
    // L'erreur la plus frequente ici : le quota de 5 Mo est atteint (trop de photos).
    // On renvoie un message comprehensible plutot que l'erreur technique du navigateur.
    if (erreur.name === 'QuotaExceededError' || erreur.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw new Error(
        "L'espace de stockage du navigateur est plein. Supprime quelques annonces existantes avant d'en publier une nouvelle."
      )
    }
    throw erreur
  }
}

/**
 * Genere un identifiant unique pour une nouvelle annonce.
 * crypto.randomUUID est disponible sur tous les navigateurs modernes ;
 * on prevoit quand meme une solution de repli pour les vieux telephones Android.
 */
function genererId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `annonce-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// -----------------------------------------------------------------------------
//  API PUBLIQUE : les seules fonctions que les pages ont le droit d'appeler.
// -----------------------------------------------------------------------------

/**
 * Forme d'une annonce (le "modele de donnees") :
 *
 * {
 *   id: string,             identifiant unique
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
 *   creeLe: string          date de creation au format ISO
 * }
 */

/**
 * Retourne toutes les annonces, de la plus recente a la plus ancienne.
 * @returns {Promise<Array>} la liste des annonces
 */
export async function listerAnnonces() {
  const annonces = lireStockage()
  // On trie du plus recent au plus ancien : c'est ce qu'attend un recycleur
  // qui ouvre l'application pour voir "ce qu'il y a de nouveau".
  return [...annonces].sort((a, b) => new Date(b.creeLe) - new Date(a.creeLe))
}

/**
 * Retourne une annonce precise, ou null si elle n'existe pas.
 * @param {string} id
 */
export async function trouverAnnonce(id) {
  return lireStockage().find((annonce) => annonce.id === id) ?? null
}

/**
 * Cree une nouvelle annonce.
 * L'id et la date de creation sont generes ici : la page qui appelle
 * n'a pas a s'en occuper.
 *
 * @param {object} donnees - les champs saisis dans le formulaire
 * @returns {Promise<object>} l'annonce complete telle qu'enregistree
 */
export async function creerAnnonce(donnees) {
  const annonce = {
    ...donnees,
    id: genererId(),
    creeLe: new Date().toISOString(),
  }

  const annonces = lireStockage()
  annonces.push(annonce)
  ecrireStockage(annonces)

  return annonce
}

/**
 * Supprime une annonce (utile pendant les demonstrations, et pour liberer
 * de la place quand le stockage est plein).
 * @param {string} id
 */
export async function supprimerAnnonce(id) {
  const annonces = lireStockage().filter((annonce) => annonce.id !== id)
  ecrireStockage(annonces)
}

/**
 * Filtre les annonces par materiau et/ou par zone.
 *
 * Le filtrage est fait ici, dans la couche de donnees, et non dans la page.
 * Raison : avec une vraie base de donnees, ce filtrage sera fait par le serveur
 * (bien plus rapide sur des milliers d'annonces). En le placant deja ici,
 * la bascule se fera sans toucher a la page.
 *
 * @param {{materiau?: string, zone?: string}} filtres - une valeur vide = "tous"
 */
export async function filtrerAnnonces({ materiau = '', zone = '' } = {}) {
  const annonces = await listerAnnonces()

  return annonces.filter((annonce) => {
    const materiauOk = !materiau || annonce.materiau === materiau
    const zoneOk = !zone || annonce.zone === zone
    // Une annonce n'est gardee que si elle passe TOUS les filtres actifs.
    return materiauOk && zoneOk
  })
}

/**
 * Efface toutes les annonces. Reservee au bouton de reinitialisation
 * de la demonstration : a manipuler avec precaution, l'action est irreversible.
 */
export async function viderAnnonces() {
  ecrireStockage([])
}
