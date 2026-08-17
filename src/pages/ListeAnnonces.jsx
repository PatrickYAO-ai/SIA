import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { filtrerAnnonces, supprimerAnnonce } from '../services/annonces.js'
import { trouverZone } from '../data/zones.js'
import CarteAnnonce from '../components/CarteAnnonce.jsx'
import CarteInteractive from '../components/CarteInteractive.jsx'
import Filtres from '../components/Filtres.jsx'

/**
 * PAGE 2 - Liste des annonces (profil "Recycleur").
 *
 * Trois elements travaillent ensemble sur cette page :
 *   - les filtres (materiau, zone)
 *   - la carte geographique
 *   - la liste des fiches
 * Les trois lisent LA MEME source : la variable "annonces" ci-dessous.
 * C'est la regle d'or : une seule verite en memoire, sinon la carte et la liste
 * finissent par afficher des choses differentes.
 */
export default function ListeAnnonces() {
  // useSearchParams lit ce qui suit le "?" dans l'adresse.
  // On s'en sert pour le message de confirmation apres publication (/?publiee=1).
  const [parametresUrl, setParametresUrl] = useSearchParams()
  const vientDePublier = parametresUrl.get('publiee') === '1'

  const [annonces, setAnnonces] = useState([])
  const [filtres, setFiltres] = useState({ materiau: '', zone: '' })
  const [chargement, setChargement] = useState(true)
  const [annonceActive, setAnnonceActive] = useState(null) // id survole dans la liste

  /**
   * Recharge les annonces des que les filtres changent.
   *
   * useEffect = "execute ce code apres l'affichage, et refais-le quand une des
   * valeurs surveillees change". Ici on surveille les filtres.
   */
  useEffect(() => {
    let annule = false // garde-fou, explique plus bas

    async function charger() {
      setChargement(true)
      const resultats = await filtrerAnnonces(filtres)

      // Si l'utilisateur a change de filtre pendant le chargement, ce resultat
      // est perime : on l'ignore. Sans ce garde-fou, une reponse lente pourrait
      // ecraser une reponse plus recente et afficher les mauvaises annonces.
      // Le probleme est theorique avec localStorage, mais deviendra reel
      // avec un vrai serveur : autant prendre l'habitude tout de suite.
      if (annule) return

      setAnnonces(resultats)
      setChargement(false)
    }

    charger()

    // Cette fonction de "nettoyage" est appelee par React avant de relancer l'effet.
    return () => {
      annule = true
    }
  }, [filtres])

  /** Supprime une annonce apres confirmation, puis rafraichit la liste. */
  async function gererSuppression(annonce) {
    const confirme = window.confirm(`Supprimer definitivement l'annonce "${annonce.titre}" ?`)
    if (!confirme) return

    await supprimerAnnonce(annonce.id)
    setAnnonces(await filtrerAnnonces(filtres))
  }

  // Quand un filtre de zone est actif, on centre la carte sur cette zone.
  // Sinon on laisse la carte s'ajuster seule autour des annonces affichees.
  const zoneChoisie = filtres.zone ? trouverZone(filtres.zone) : null
  const centreCarte = zoneChoisie ? { lat: zoneChoisie.lat, lng: zoneChoisie.lng } : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {vientDePublier && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">
            ✅ Ton annonce est publiee. Elle apparait maintenant sur la carte pour les recycleurs.
          </p>
          <button
            type="button"
            // On retire le parametre de l'adresse pour que le message ne reapparaisse
            // pas si l'utilisateur recharge la page.
            onClick={() => setParametresUrl({})}
            className="text-green-700 hover:text-green-900"
            aria-label="Fermer le message"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Annonces disponibles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Trouve les dechets de chantier valorisables pres de chez toi.
          </p>
        </div>
        <Link
          to="/publier"
          className="rounded-lg bg-valo-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          + Publier une annonce
        </Link>
      </div>

      <div className="mb-5">
        <Filtres filtres={filtres} onChange={setFiltres} nombreResultats={annonces.length} />
      </div>

      {/* La carte. Hauteur reduite sur mobile (l'ecran est petit), plus grande sur ordinateur. */}
      <div className="mb-6 h-[300px] overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:h-[420px]">
        <CarteInteractive
          annonces={annonces}
          annonceActive={annonceActive}
          centre={centreCarte}
        />
      </div>

      {/* Trois etats possibles, a toujours traiter dans cet ordre :
          chargement -> liste vide -> liste remplie. Oublier le cas "vide" est
          l'erreur la plus courante, et c'est celle que le jury verra en premier. */}
      {chargement ? (
        <p className="py-10 text-center text-sm text-slate-500">Chargement des annonces...</p>
      ) : annonces.length === 0 ? (
        <ListeVide filtreActif={filtres.materiau !== '' || filtres.zone !== ''} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((annonce) => (
            <CarteAnnonce
              key={annonce.id} // React a besoin d'une cle unique et stable pour chaque element d'une liste
              annonce={annonce}
              onSurvol={setAnnonceActive}
              onSupprimer={gererSuppression}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Message affiche quand aucune annonce ne correspond. */
function ListeVide({ filtreActif }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <p className="text-4xl">🏗️</p>
      <p className="mt-3 font-semibold text-slate-800">
        {filtreActif ? 'Aucune annonce pour ces criteres' : 'Aucune annonce pour le moment'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {filtreActif
          ? 'Essaie d elargir ta recherche en changeant le materiau ou la zone.'
          : 'Sois le premier chantier a proposer des dechets valorisables.'}
      </p>
      {!filtreActif && (
        <Link
          to="/publier"
          className="mt-4 inline-block rounded-lg bg-valo-vert px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          Publier une annonce
        </Link>
      )}
    </div>
  )
}
