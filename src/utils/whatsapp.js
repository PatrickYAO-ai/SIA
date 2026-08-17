// Generation des liens WhatsApp.
//
// POURQUOI WHATSAPP ET PAS UNE MESSAGERIE INTERNE ?
// Construire une messagerie (comptes, notifications, moderation) represente
// des semaines de travail. Or en Cote d'Ivoire, chantiers comme recycleurs
// utilisent deja WhatsApp au quotidien. On s'appuie sur cet usage existant :
// zero compte a creer, zero notification a developper, adoption immediate.
//
// COMMENT CA MARCHE
// WhatsApp fournit une adresse universelle : https://wa.me/<numero>?text=<message>
// Ouverte sur telephone, elle lance l'application WhatsApp sur la conversation
// avec le bon contact, message deja ecrit. Ouverte sur ordinateur, elle bascule
// vers WhatsApp Web. Aucune cle API, aucun compte WhatsApp Business necessaire.

import { libelleMateriau, libelleUnite } from '../data/materiaux.js'
import { libelleZone } from '../data/zones.js'

/** Indicatif telephonique de la Cote d'Ivoire. */
const INDICATIF_CI = '225'

/**
 * Nettoie et met un numero de telephone au format attendu par WhatsApp :
 * uniquement des chiffres, indicatif pays inclus, sans "+" ni espaces.
 *
 * Exemples de saisies acceptees, toutes converties en "2250701020304" :
 *   "07 01 02 03 04"     (format local ivoirien)
 *   "+225 07 01 02 03 04"
 *   "00225 0701020304"
 *   "225-07-01-02-03-04"
 *
 * @param {string} numero - le numero tel que saisi par l'utilisateur
 * @returns {string} le numero au format international, ou "" si invalide
 */
export function normaliserNumero(numero) {
  if (!numero) return ''

  // 1. On ne garde que les chiffres : on jette espaces, tirets, points, parentheses, "+".
  let chiffres = String(numero).replace(/\D/g, '')

  // 2. Le prefixe international "00" (compose depuis un fixe) devient rien du tout.
  if (chiffres.startsWith('00')) {
    chiffres = chiffres.slice(2)
  }

  // 3. Si l'indicatif pays est deja la, on ne le rajoute pas une deuxieme fois.
  if (chiffres.startsWith(INDICATIF_CI)) {
    return chiffres
  }

  // 4. Sinon, c'est un numero local : on prefixe avec l'indicatif ivoirien.
  return INDICATIF_CI + chiffres
}

/**
 * Verifie qu'un numero est plausible.
 * Depuis 2021, les numeros ivoiriens comptent 10 chiffres (ex. 07 01 02 03 04),
 * soit 13 chiffres une fois l'indicatif 225 ajoute. On accepte une petite marge
 * pour ne pas bloquer un numero etranger ou un ancien format.
 *
 * @returns {boolean}
 */
export function numeroValide(numero) {
  const normalise = normaliserNumero(numero)
  return normalise.length >= 11 && normalise.length <= 15
}

/**
 * Ecrit le message pre-rempli envoye par le recycleur au chantier.
 *
 * Le message est redige a la place de l'utilisateur pour deux raisons :
 * il fait gagner du temps, et surtout il garantit que le chantier recoit
 * toutes les informations utiles (materiau, quantite, lieu) des le premier
 * message, sans aller-retour.
 *
 * @param {object} annonce
 * @returns {string} le message pret a envoyer
 */
export function messagePreRempli(annonce) {
  const materiau = libelleMateriau(annonce.materiau)
  const unite = libelleUnite(annonce.unite)
  const zone = libelleZone(annonce.zone)

  // Un tableau de lignes joint par des sauts de ligne : plus lisible a relire
  // et a modifier qu'une longue chaine avec des \n disperses.
  return [
    `Bonjour ${annonce.nomChantier},`,
    '',
    `Je vous contacte via ValoPro au sujet de votre annonce "${annonce.titre}".`,
    `Materiau : ${materiau} - ${annonce.quantite} ${unite}`,
    `Lieu : ${zone}`,
    '',
    'Je suis recycleur et je suis interesse par cette collecte.',
    'Pouvons-nous convenir d un passage ?',
    '',
    'Merci.',
  ].join('\n')
}

/**
 * Construit le lien WhatsApp complet pour une annonce donnee.
 *
 * encodeURIComponent transforme les espaces, accents et sauts de ligne en
 * caracteres compatibles avec une adresse web. Sans lui, le message serait
 * tronque au premier espace.
 *
 * @param {object} annonce
 * @returns {string} l'adresse a ouvrir
 */
export function lienWhatsApp(annonce) {
  const numero = normaliserNumero(annonce.telephone)
  const texte = encodeURIComponent(messagePreRempli(annonce))
  return `https://wa.me/${numero}?text=${texte}`
}
