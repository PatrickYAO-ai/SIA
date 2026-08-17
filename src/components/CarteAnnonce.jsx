import { trouverMateriau, libelleUnite } from '../data/materiaux.js'
import { libelleZone } from '../data/zones.js'
import BoutonWhatsApp from './BoutonWhatsApp.jsx'

/**
 * "Carte" au sens fiche : le bloc qui presente une annonce dans la liste.
 * (A ne pas confondre avec CarteInteractive.jsx, qui est la carte geographique.)
 *
 * @param {object} props.annonce
 * @param {Function} [props.onSurvol] - appelee au survol/clic, pour mettre en avant
 *                                      le marqueur correspondant sur la carte
 * @param {Function} [props.onSupprimer]
 */
export default function CarteAnnonce({ annonce, onSurvol, onSupprimer }) {
  const materiau = trouverMateriau(annonce.materiau)

  return (
    <article
      onMouseEnter={() => onSurvol?.(annonce.id)}
      onMouseLeave={() => onSurvol?.(null)}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Photo. Elle est facultative : toutes les annonces n'en auront pas,
          et on ne veut pas bloquer un chantier qui publie depuis un vieux telephone. */}
      {annonce.photo ? (
        <img
          src={annonce.photo}
          alt={`Photo du lot : ${annonce.titre}`}
          className="h-44 w-full bg-slate-100 object-cover"
          loading="lazy" // la photo n'est telechargee qu'au moment ou elle arrive a l'ecran
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-4xl">
          {materiau?.emoji ?? '📦'}
        </div>
      )}

      <div className="space-y-3 p-4">
        {/* Etiquette du materiau, coloree comme le marqueur sur la carte
            pour que l'oeil fasse le lien entre la liste et la carte. */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: materiau?.couleur ?? '#475569' }}
          >
            {materiau?.emoji} {materiau?.libelle ?? annonce.materiau}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {annonce.quantite} {libelleUnite(annonce.unite)}
          </span>
        </div>

        <div>
          <h3 className="font-semibold leading-snug text-slate-900">{annonce.titre}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            📍 {libelleZone(annonce.zone)} · {formaterDate(annonce.creeLe)}
          </p>
        </div>

        {annonce.description && (
          // line-clamp-3 coupe le texte apres 3 lignes : toutes les fiches
          // gardent la meme hauteur, la liste reste lisible.
          <p className="line-clamp-3 text-sm text-slate-600">{annonce.description}</p>
        )}

        <p className="text-sm text-slate-500">
          Chantier : <span className="font-medium text-slate-700">{annonce.nomChantier}</span>
        </p>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1">
            <BoutonWhatsApp annonce={annonce} />
          </div>
          {onSupprimer && (
            <button
              type="button"
              onClick={() => onSupprimer(annonce)}
              title="Supprimer cette annonce"
              className="rounded-lg border border-slate-200 px-3 py-3 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/**
 * Affiche une date en francais, de facon relative quand c'est recent
 * ("il y a 2 h" est plus parlant que "17/08/2026 14:32" pour juger de la fraicheur d'un lot).
 */
function formaterDate(dateIso) {
  const date = new Date(dateIso)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (minutes < 1) return "a l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 60 * 24) return `il y a ${Math.floor(minutes / 60)} h`
  if (minutes < 60 * 24 * 7) return `il y a ${Math.floor(minutes / 1440)} j`

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
