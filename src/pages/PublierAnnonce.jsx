import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MATERIAUX, UNITES } from '../data/materiaux.js'
import { ZONES, zonesParGroupe, trouverZone } from '../data/zones.js'
import { creerAnnonce } from '../services/annonces.js'
import { compresserImage, poidsDataUrlKo } from '../utils/image.js'
import { numeroValide, normaliserNumero } from '../utils/whatsapp.js'

/**
 * PAGE 1 - Publication d'une annonce (profil "Chantier").
 *
 * ORGANISATION DU FICHIER, a reproduire dans toute nouvelle page :
 *   1. les etats (useState)        -> ce qui change a l'ecran
 *   2. les fonctions de gestion    -> ce qui se passe quand l'utilisateur agit
 *   3. le return (JSX)             -> ce qui s'affiche
 * Toujours dans cet ordre : on lit le fichier de haut en bas comme une recette.
 */
export default function PublierAnnonce() {
  const naviguer = useNavigate()

  // --- 1. LES ETATS -----------------------------------------------------------
  // useState cree une "case memoire" que React surveille : des qu'on la modifie,
  // React redessine automatiquement la partie concernee de l'ecran.

  // Tous les champs du formulaire dans un seul objet, plutot qu'un useState par champ.
  // Avec une dizaine de champs, ca evite dix lignes quasi identiques.
  const [formulaire, setFormulaire] = useState({
    titre: '',
    materiau: '',
    quantite: '',
    unite: 'tonne',
    description: '',
    zone: '',
    nomChantier: '',
    telephone: '',
  })

  const [photo, setPhoto] = useState(null) // la photo compressee (data URL)
  const [coordonnees, setCoordonnees] = useState(null) // { lat, lng } issus du GPS
  const [erreurs, setErreurs] = useState({}) // { nomDuChamp: "message d'erreur" }
  const [enCours, setEnCours] = useState(false) // pour desactiver le bouton pendant l'envoi
  const [messageGps, setMessageGps] = useState('')
  const [photoEnCours, setPhotoEnCours] = useState(false)
  const [gpsEnCours, setGpsEnCours] = useState(false)

  // --- 2. LES FONCTIONS DE GESTION -------------------------------------------

  /** Met a jour un champ du formulaire et efface l'erreur qui lui etait associee. */
  function modifierChamp(champ, valeur) {
    setFormulaire((precedent) => ({ ...precedent, [champ]: valeur }))
    // Effacer l'erreur des que l'utilisateur corrige : plus agreable que de la
    // laisser affichee jusqu'a la prochaine validation.
    setErreurs((precedent) => ({ ...precedent, [champ]: undefined }))
  }

  /** Appelee quand l'utilisateur choisit une photo. */
  async function gererPhoto(evenement) {
    const fichier = evenement.target.files?.[0]
    if (!fichier) return

    setPhotoEnCours(true)
    setErreurs((precedent) => ({ ...precedent, photo: undefined }))

    try {
      // La compression peut prendre 1 a 2 secondes sur un telephone d'entree de gamme,
      // d'ou l'indicateur de chargement.
      const compressee = await compresserImage(fichier)
      setPhoto(compressee)
    } catch (erreur) {
      setErreurs((precedent) => ({ ...precedent, photo: erreur.message }))
    } finally {
      // "finally" s'execute dans tous les cas, succes comme echec :
      // c'est la garantie que l'indicateur de chargement s'arrete toujours.
      setPhotoEnCours(false)
    }
  }

  /**
   * Demande la position GPS au navigateur.
   *
   * A SAVOIR : la geolocalisation ne fonctionne QUE sur une adresse https://
   * (ou sur localhost pendant le developpement). C'est une regle de securite
   * des navigateurs, pas un bug. Une fois le site en ligne sur Netlify ou Vercel,
   * le https est automatique, donc ca marchera.
   */
  function localiserMoi() {
    if (!navigator.geolocation) {
      setMessageGps("Ton navigateur ne gere pas la geolocalisation. Choisis la zone dans la liste.")
      return
    }

    setMessageGps('Localisation en cours...')
    setGpsEnCours(true)

    // GARDE-FOU (piege verifie a la mesure, ne pas retirer).
    // On demande ci-dessous au navigateur d'abandonner au bout de 10 s
    // (option "timeout"). Mais certains navigateurs ne rappellent JAMAIS :
    // c'est le cas quand la demande d'autorisation reste affichee sans que
    // l'utilisateur y reponde. Sans ce garde-fou, le message "Localisation en
    // cours..." restait alors affiche indefiniment, avec un bouton toujours
    // cliquable sur lequel on pouvait s'acharner.
    // On lance donc notre propre minuterie, un peu plus longue que celle du
    // navigateur, pour reprendre la main s'il ne dit rien.
    let repondu = false
    const minuterie = setTimeout(() => {
      if (repondu) return
      repondu = true
      setGpsEnCours(false)
      setMessageGps(
        "Le telephone n a pas repondu. Verifie l autorisation de localisation, ou choisis simplement ta zone dans la liste."
      )
    }, 12000)

    navigator.geolocation.getCurrentPosition(
      // Cas de succes
      (position) => {
        // Le navigateur a fini par repondre : on annule le garde-fou.
        if (repondu) return
        repondu = true
        clearTimeout(minuterie)
        setGpsEnCours(false)

        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCoordonnees({ lat, lng })
        setMessageGps(`Position enregistree (${lat.toFixed(4)}, ${lng.toFixed(4)})`)

        // Confort : si la zone n'est pas encore choisie, on devine la plus proche.
        if (!formulaire.zone) {
          const proche = zoneLaPlusProche(lat, lng)
          if (proche) modifierChamp('zone', proche.id)
        }
      },
      // Cas d'echec (refus de l'utilisateur, GPS coupe, delai depasse...)
      (erreur) => {
        if (repondu) return
        repondu = true
        clearTimeout(minuterie)
        setGpsEnCours(false)

        const messages = {
          1: "Tu as refuse la geolocalisation. Choisis simplement ta zone dans la liste.",
          2: 'Position indisponible. Verifie que le GPS est active.',
          3: 'La localisation a pris trop de temps. Reessaie ou choisis ta zone.',
        }
        setMessageGps(messages[erreur.code] ?? 'Localisation impossible.')
      },
      // Options : precision maximale, abandon au bout de 10 s, pas de position en cache.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  /**
   * Verifie tous les champs avant enregistrement.
   * Retourne un objet d'erreurs ; s'il est vide, tout est bon.
   *
   * On valide TOUJOURS cote application, jamais en se fiant uniquement aux
   * attributs "required" du HTML : ceux-ci peuvent etre contournes.
   */
  function valider() {
    const nouvelles = {}

    if (!formulaire.titre.trim()) {
      nouvelles.titre = "Donne un titre a ton annonce."
    }
    if (!formulaire.materiau) {
      nouvelles.materiau = 'Choisis un type de materiau.'
    }
    const quantite = Number(formulaire.quantite)
    if (!formulaire.quantite || Number.isNaN(quantite) || quantite <= 0) {
      nouvelles.quantite = 'Indique une quantite superieure a 0.'
    }
    if (!formulaire.zone) {
      nouvelles.zone = 'Indique la zone du chantier.'
    }
    if (!formulaire.nomChantier.trim()) {
      nouvelles.nomChantier = "Indique le nom du chantier ou de l'entreprise."
    }
    if (!numeroValide(formulaire.telephone)) {
      nouvelles.telephone = 'Numero WhatsApp invalide. Exemple : 07 01 02 03 04'
    }

    return nouvelles
  }

  /** Soumission du formulaire. */
  async function envoyer(evenement) {
    // Sans cette ligne, le navigateur rechargerait la page et on perdrait tout.
    evenement.preventDefault()

    const nouvellesErreurs = valider()
    setErreurs(nouvellesErreurs)
    if (Object.keys(nouvellesErreurs).length > 0) {
      // On remonte en haut pour que l'utilisateur voie les messages d'erreur.
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setEnCours(true)
    try {
      // Position finale : le GPS s'il a fonctionne, sinon le centre de la zone choisie.
      // Ainsi une annonce a TOUJOURS un point sur la carte, meme sans GPS.
      const zone = trouverZone(formulaire.zone)
      const position = coordonnees ?? { lat: zone.lat, lng: zone.lng }

      await creerAnnonce({
        titre: formulaire.titre.trim(),
        materiau: formulaire.materiau,
        quantite: Number(formulaire.quantite),
        unite: formulaire.unite,
        description: formulaire.description.trim(),
        photo,
        zone: formulaire.zone,
        lat: position.lat,
        lng: position.lng,
        nomChantier: formulaire.nomChantier.trim(),
        // On enregistre le numero deja normalise : ainsi le lien WhatsApp
        // fonctionne quelle que soit la facon dont l'utilisateur l'a tape.
        telephone: normaliserNumero(formulaire.telephone),
      })

      // Redirection vers la liste, avec un indicateur pour afficher un message de succes.
      naviguer('/?publiee=1')
    } catch (erreur) {
      setErreurs({ global: erreur.message })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnCours(false)
    }
  }

  // --- 3. L'AFFICHAGE ---------------------------------------------------------

  const groupesZones = zonesParGroupe()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Publier une annonce</h1>
        <p className="mt-1 text-sm text-slate-600">
          Decris les dechets disponibles sur ton chantier. Les recycleurs de ta zone les verront
          immediatement sur la carte.
        </p>
      </div>

      {erreurs.global && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erreurs.global}
        </div>
      )}

      {/* noValidate desactive les bulles de validation du navigateur :
          on prefere nos propres messages, en francais et coherents partout. */}
      <form onSubmit={envoyer} noValidate className="space-y-5">
        {/* --- Bloc photo --- */}
        <Bloc titre="Photo du lot" sousTitre="Facultatif, mais une annonce avec photo est bien plus contactee.">
          {photo ? (
            <div className="space-y-2">
              <img src={photo} alt="Apercu du lot" className="h-48 w-full rounded-lg object-cover" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Photo prete · {poidsDataUrlKo(photo)} Ko</span>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Retirer
                </button>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-valo-vert hover:bg-valo-vert-clair/40">
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium text-slate-700">
                {photoEnCours ? 'Traitement de la photo...' : 'Prendre ou choisir une photo'}
              </span>
              <span className="text-xs text-slate-500">La photo est compressee automatiquement</span>
              <input
                type="file"
                accept="image/*"
                // capture="environment" ouvre directement l'appareil photo arriere
                // sur un telephone : un geste de moins pour le chef de chantier.
                capture="environment"
                onChange={gererPhoto}
                disabled={photoEnCours}
                className="hidden"
              />
            </label>
          )}
          {erreurs.photo && <MessageErreur>{erreurs.photo}</MessageErreur>}
        </Bloc>

        {/* --- Bloc materiau --- */}
        <Bloc titre="Le materiau">
          <Champ label="Titre de l'annonce" erreur={erreurs.titre} obligatoire>
            <input
              type="text"
              value={formulaire.titre}
              onChange={(e) => modifierChamp('titre', e.target.value)}
              placeholder="Ex. Gravats de demolition - Villa Cocody"
              className={classeChamp(erreurs.titre)}
            />
          </Champ>

          <Champ label="Type de materiau" erreur={erreurs.materiau} obligatoire>
            <select
              value={formulaire.materiau}
              onChange={(e) => modifierChamp('materiau', e.target.value)}
              className={classeChamp(erreurs.materiau)}
            >
              <option value="">-- Choisir --</option>
              {/* La liste vient de src/data/materiaux.js : pour ajouter un materiau,
                  on modifie ce fichier de donnees, jamais cette page. */}
              {MATERIAUX.map((materiau) => (
                <option key={materiau.id} value={materiau.id}>
                  {materiau.emoji} {materiau.libelle}
                </option>
              ))}
            </select>
            {/* Petit rappel de ce que recouvre le materiau choisi. */}
            {formulaire.materiau && (
              <p className="mt-1 text-xs text-slate-500">
                {MATERIAUX.find((m) => m.id === formulaire.materiau)?.description}
              </p>
            )}
          </Champ>

          <div className="grid grid-cols-2 gap-3">
            <Champ label="Quantite" erreur={erreurs.quantite} obligatoire>
              <input
                type="number"
                inputMode="decimal" // fait apparaitre le pave numerique sur mobile
                min="0"
                step="0.5"
                value={formulaire.quantite}
                onChange={(e) => modifierChamp('quantite', e.target.value)}
                placeholder="12"
                className={classeChamp(erreurs.quantite)}
              />
            </Champ>

            <Champ label="Unite">
              <select
                value={formulaire.unite}
                onChange={(e) => modifierChamp('unite', e.target.value)}
                className={classeChamp()}
              >
                {UNITES.map((unite) => (
                  <option key={unite.id} value={unite.id}>
                    {unite.libelle}
                  </option>
                ))}
              </select>
            </Champ>
          </div>

          <Champ label="Description">
            <textarea
              rows={4}
              value={formulaire.description}
              onChange={(e) => modifierChamp('description', e.target.value)}
              placeholder="Ex. Gravats propres issus d une demolition, acces camion possible, disponibles jusqu au 30 du mois."
              className={classeChamp()}
            />
          </Champ>
        </Bloc>

        {/* --- Bloc localisation --- */}
        <Bloc titre="Localisation" sousTitre="Elle permet aux recycleurs proches de te trouver sur la carte.">
          <Champ label="Zone" erreur={erreurs.zone} obligatoire>
            <select
              value={formulaire.zone}
              onChange={(e) => modifierChamp('zone', e.target.value)}
              className={classeChamp(erreurs.zone)}
            >
              <option value="">-- Choisir --</option>
              {Object.entries(groupesZones).map(([nomGroupe, zones]) => (
                <optgroup key={nomGroupe} label={nomGroupe}>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.libelle}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Champ>

          <button
            type="button" // sans ceci, un <button> dans un <form> soumettrait le formulaire
            onClick={localiserMoi}
            // Desactive pendant la recherche : evite que l'utilisateur relance
            // dix demandes en s'acharnant sur le bouton.
            disabled={gpsEnCours}
            className="w-full rounded-lg border border-valo-vert bg-valo-vert-clair px-4 py-3 text-sm font-semibold text-valo-vert transition hover:bg-valo-vert hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-valo-vert-clair disabled:hover:text-valo-vert"
          >
            {gpsEnCours ? '📍 Localisation en cours...' : '📍 Utiliser ma position GPS actuelle (plus precis)'}
          </button>

          {messageGps && <p className="text-xs text-slate-600">{messageGps}</p>}

          <p className="text-xs text-slate-500">
            Sans GPS, l'annonce est placee au centre de la zone choisie. C'est suffisant pour qu'un
            recycleur sache s'il doit se deplacer.
          </p>
        </Bloc>

        {/* --- Bloc contact --- */}
        <Bloc titre="Contact" sousTitre="Les recycleurs t'ecriront directement sur WhatsApp.">
          <Champ label="Nom du chantier ou de l'entreprise" erreur={erreurs.nomChantier} obligatoire>
            <input
              type="text"
              value={formulaire.nomChantier}
              onChange={(e) => modifierChamp('nomChantier', e.target.value)}
              placeholder="Ex. Entreprise BTP Konan"
              className={classeChamp(erreurs.nomChantier)}
            />
          </Champ>

          <Champ label="Numero WhatsApp" erreur={erreurs.telephone} obligatoire>
            <input
              type="tel"
              inputMode="tel"
              value={formulaire.telephone}
              onChange={(e) => modifierChamp('telephone', e.target.value)}
              placeholder="07 01 02 03 04"
              className={classeChamp(erreurs.telephone)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Format ivoirien accepte avec ou sans indicatif. L'indicatif +225 est ajoute
              automatiquement.
            </p>
          </Champ>
        </Bloc>

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-lg bg-valo-vert px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-green-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? 'Publication...' : "Publier l'annonce"}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Petits composants d'affichage, utilises uniquement dans cette page.
//  Ils evitent de recopier vingt fois les memes classes Tailwind : si un jour
//  tu veux changer l'apparence de tous les champs, tu modifies un seul endroit.
// ---------------------------------------------------------------------------

function Bloc({ titre, sousTitre, children }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">{titre}</h2>
        {sousTitre && <p className="mt-0.5 text-xs text-slate-500">{sousTitre}</p>}
      </div>
      {children}
    </section>
  )
}

function Champ({ label, erreur, obligatoire, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {obligatoire && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
    </div>
  )
}

function MessageErreur({ children }) {
  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>
}

/** Classes Tailwind communes a tous les champs, avec bordure rouge en cas d'erreur. */
function classeChamp(erreur) {
  return (
    // py-3 : hauteur de 44 px, la taille tactile minimale du projet (CLAUDE.md section 2).
    'w-full rounded-lg border bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 ' +
    (erreur
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-300 focus:border-valo-vert focus:ring-valo-vert/20')
  )
}

/**
 * Trouve la zone la plus proche de coordonnees GPS donnees.
 *
 * On compare les distances "a vol d'oiseau" de facon simplifiee (theoreme de
 * Pythagore sur les degres). Ce n'est pas exact sur de longues distances, mais
 * a l'echelle d'une ville c'est parfaitement suffisant, et ca evite d'importer
 * une bibliotheque de calcul geographique pour trois lignes de code.
 */
function zoneLaPlusProche(lat, lng) {
  let meilleure = null
  let meilleureDistance = Infinity

  for (const zone of ZONES) {
    const distance = (zone.lat - lat) ** 2 + (zone.lng - lng) ** 2
    if (distance < meilleureDistance) {
      meilleureDistance = distance
      meilleure = zone
    }
  }

  return meilleure
}
