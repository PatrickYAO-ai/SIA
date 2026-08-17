import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

import { trouverMateriau, libelleUnite } from '../data/materiaux.js'
import { libelleZone, CENTRE_PAR_DEFAUT, ZOOM_PAR_DEFAUT } from '../data/zones.js'
import BoutonWhatsApp from './BoutonWhatsApp.jsx'

/**
 * Carte geographique affichant les annonces.
 *
 * POURQUOI LEAFLET ET OPENSTREETMAP ?
 * Leaflet est une bibliotheque de cartographie libre (~40 Ko) et OpenStreetMap
 * fournit les fonds de carte gratuitement, sans cle API ni carte bancaire.
 * Google Maps exige d'activer une facturation des le premier chargement :
 * inutile de s'imposer ca au stade prototype.
 *
 * @param {Array} props.annonces - les annonces a afficher
 * @param {string|null} props.annonceActive - id de l'annonce survolee dans la liste
 * @param {{lat: number, lng: number}} [props.centre] - centre force (suit le filtre de zone)
 */
export default function CarteInteractive({ annonces, annonceActive, centre }) {
  return (
    <MapContainer
      center={[CENTRE_PAR_DEFAUT.lat, CENTRE_PAR_DEFAUT.lng]}
      zoom={ZOOM_PAR_DEFAUT}
      scrollWheelZoom={false} // evite de zoomer par accident en faisant defiler la page
      className="h-full w-full"
    >
      {/* TileLayer = le fond de carte, decoupe en petites images ("tuiles").
          L'attribution OpenStreetMap est OBLIGATOIRE : c'est la condition de la licence. */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Composant invisible qui recentre la carte quand les filtres changent. */}
      <RecentrerCarte annonces={annonces} centre={centre} />

      {annonces.map((annonce) => (
        <Marker
          key={annonce.id}
          position={[annonce.lat, annonce.lng]}
          icon={creerIcone(annonce, annonce.id === annonceActive)}
        >
          {/* Popup = la petite bulle qui s'ouvre au clic sur un marqueur. */}
          <Popup>
            <div className="w-56 space-y-2">
              {annonce.photo && (
                <img
                  src={annonce.photo}
                  alt=""
                  className="h-24 w-full rounded-md object-cover"
                />
              )}
              <p className="!m-0 font-semibold text-slate-900">{annonce.titre}</p>
              <p className="!m-0 text-xs text-slate-600">
                {trouverMateriau(annonce.materiau)?.libelle} · {annonce.quantite}{' '}
                {libelleUnite(annonce.unite)}
              </p>
              <p className="!m-0 text-xs text-slate-500">📍 {libelleZone(annonce.zone)}</p>
              <BoutonWhatsApp annonce={annonce} compact />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

/**
 * Cree l'icone d'un marqueur.
 *
 * Leaflet fournit une icone par defaut sous forme d'image, mais elle s'affiche
 * cassee avec Vite (un probleme de chemin bien connu). On dessine donc notre
 * propre pastille en HTML/CSS via "divIcon" : plus leger (aucune image a
 * telecharger), et surtout coloree selon le materiau, ce qui permet au recycleur
 * d'identifier ce qui l'interesse sans cliquer sur chaque point.
 */
function creerIcone(annonce, estActif) {
  const materiau = trouverMateriau(annonce.materiau)
  const couleur = materiau?.couleur ?? '#475569'
  const taille = estActif ? 38 : 28

  return L.divIcon({
    className: '', // on vide la classe par defaut de Leaflet, qui ajoute un fond blanc
    html: `<div class="valo-marqueur" style="background:${couleur};width:${taille}px;height:${taille}px;${
      estActif ? 'transform:scale(1.1);box-shadow:0 0 0 4px rgba(21,128,61,.35);' : ''
    }">${materiau?.emoji ?? '📦'}</div>`,
    iconSize: [taille, taille],
    // iconAnchor = le point de l'icone qui touche reellement les coordonnees GPS.
    // On prend le centre de la pastille.
    iconAnchor: [taille / 2, taille / 2],
    popupAnchor: [0, -taille / 2],
  })
}

/**
 * Composant technique sans affichage : il ne sert qu'a piloter la carte.
 *
 * react-leaflet impose cette approche : le hook useMap() n'est utilisable que
 * DANS un composant place a l'interieur de <MapContainer>. On cree donc ce petit
 * composant qui ne retourne rien (null) mais qui a acces a la carte.
 */
function RecentrerCarte({ annonces, centre }) {
  const carte = useMap()

  useEffect(() => {
    // Priorite 1 : un centre impose par le filtre de zone.
    if (centre) {
      carte.setView([centre.lat, centre.lng], 13)
      return
    }

    // Priorite 2 : ajuster la vue pour que toutes les annonces soient visibles.
    if (annonces.length > 0) {
      const limites = L.latLngBounds(annonces.map((a) => [a.lat, a.lng]))
      // padding : une marge pour que les marqueurs ne collent pas aux bords.
      carte.fitBounds(limites, { padding: [40, 40], maxZoom: 15 })
      return
    }

    // Priorite 3 : aucune annonce, on revient sur Abidjan.
    carte.setView([CENTRE_PAR_DEFAUT.lat, CENTRE_PAR_DEFAUT.lng], ZOOM_PAR_DEFAUT)
    // La dependance sur "annonces" utilise les identifiants plutot que le tableau lui-meme :
    // sinon React relancerait ce code a chaque rendu, et la carte bougerait sans arret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte, centre?.lat, centre?.lng, annonces.map((a) => a.id).join(',')])

  return null
}
