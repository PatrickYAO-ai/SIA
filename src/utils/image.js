// Traitement des photos avant enregistrement.
//
// LE PROBLEME
// Une photo prise avec un smartphone recent pese entre 3 et 8 Mo.
// Or le stockage du navigateur (localStorage) est limite a environ 5 Mo AU TOTAL.
// Enregistrer une seule photo brute suffirait donc a bloquer toute l'application.
// Et meme avec un vrai serveur, envoyer 5 Mo en 3G a Bouake prendrait plusieurs minutes.
//
// LA SOLUTION
// On redimensionne et on recompresse la photo directement dans le navigateur,
// avant tout enregistrement. Resultat typique : 3 Mo -> environ 100 Ko,
// soit 30 fois plus leger, pour une qualite largement suffisante
// (on veut reconnaitre un tas de gravats, pas imprimer une affiche).

/** Largeur/hauteur maximale de la photo enregistree, en pixels. */
const TAILLE_MAX = 1000

/** Qualite JPEG : 0 = illisible, 1 = qualite maximale. 0.72 est un bon compromis. */
const QUALITE_JPEG = 0.72

/** Taille maximale acceptee pour le fichier d'origine (10 Mo), pour eviter de faire ramer le telephone. */
export const TAILLE_FICHIER_MAX_MO = 10

/**
 * Prend le fichier choisi par l'utilisateur et retourne une version compressee
 * sous forme de "data URL" (une longue chaine de texte commencant par "data:image/jpeg;base64,").
 *
 * Ce format texte a un gros avantage pour un prototype : il s'enregistre dans
 * localStorage et s'affiche dans un <img src="..."> sans aucun serveur de fichiers.
 *
 * @param {File} fichier - le fichier issu de <input type="file">
 * @returns {Promise<string>} la photo compressee en data URL
 */
export async function compresserImage(fichier) {
  // 1. Verifications de base avant de commencer le travail.
  if (!fichier) {
    throw new Error('Aucun fichier fourni.')
  }
  if (!fichier.type.startsWith('image/')) {
    throw new Error("Le fichier choisi n'est pas une image.")
  }
  if (fichier.size > TAILLE_FICHIER_MAX_MO * 1024 * 1024) {
    throw new Error(`La photo est trop lourde (maximum ${TAILLE_FICHIER_MAX_MO} Mo).`)
  }

  // 2. On charge le fichier dans un objet Image que le navigateur sait dessiner.
  const image = await chargerImage(fichier)

  // 3. On calcule les nouvelles dimensions en gardant les proportions.
  //    Exemple : une photo 4000x3000 devient 1000x750.
  const ratio = Math.min(TAILLE_MAX / image.width, TAILLE_MAX / image.height, 1)
  const largeur = Math.round(image.width * ratio)
  const hauteur = Math.round(image.height * ratio)

  // 4. On redessine la photo aux nouvelles dimensions dans un <canvas> invisible.
  //    Le canvas est une "zone de dessin" du navigateur : on y colle l'image
  //    en petit, puis on redemande le resultat au format JPEG compresse.
  const canvas = document.createElement('canvas')
  canvas.width = largeur
  canvas.height = hauteur

  const contexte = canvas.getContext('2d')
  // Fond blanc : si la photo d'origine est un PNG transparent, la transparence
  // deviendrait noire en JPEG. On l'evite en peignant du blanc dessous.
  contexte.fillStyle = '#ffffff'
  contexte.fillRect(0, 0, largeur, hauteur)
  contexte.drawImage(image, 0, 0, largeur, hauteur)

  // 5. On libere la memoire occupee par l'image d'origine (important sur telephone).
  URL.revokeObjectURL(image.src)

  return canvas.toDataURL('image/jpeg', QUALITE_JPEG)
}

/**
 * Charge un fichier image en memoire.
 * Fonction interne : elle n'est pas exportee car elle ne sert qu'ici.
 *
 * On l'ecrit avec une Promise parce que le chargement d'une image est asynchrone
 * (le navigateur previent quand c'est pret via l'evenement "onload").
 */
function chargerImage(fichier) {
  return new Promise((resoudre, rejeter) => {
    const image = new Image()
    // createObjectURL cree une adresse temporaire vers le fichier local,
    // beaucoup plus rapide et econome en memoire que de le lire en base64.
    image.src = URL.createObjectURL(fichier)
    image.onload = () => resoudre(image)
    image.onerror = () => {
      URL.revokeObjectURL(image.src)
      rejeter(new Error("Impossible de lire cette image. Essaie une autre photo."))
    }
  })
}

/**
 * Estime le poids d'une data URL, en kilo-octets.
 * Sert a afficher un retour a l'utilisateur ("photo prete - 96 Ko").
 * Le base64 gonfle les donnees d'environ 33 %, d'ou la division par 1,37.
 */
export function poidsDataUrlKo(dataUrl) {
  if (!dataUrl) return 0
  const longueurBase64 = dataUrl.length - (dataUrl.indexOf(',') + 1)
  return Math.round((longueurBase64 / 1.37) / 1024)
}
