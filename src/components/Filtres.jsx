import { MATERIAUX } from '../data/materiaux.js'
import { zonesParGroupe } from '../data/zones.js'

/**
 * Barre de filtres de la page Annonces (materiau + zone).
 *
 * C'est un composant dit "controle" : il ne garde AUCUNE memoire de son etat.
 * Il recoit les valeurs actuelles (props filtres) et previent le parent quand
 * l'utilisateur change quelque chose (props onChange). Toute la memoire vit
 * dans la page ListeAnnonces.jsx.
 *
 * Pourquoi faire ainsi ? Parce que la carte ET la liste doivent reagir aux memes
 * filtres. Si le composant gardait l'information pour lui, il faudrait la
 * dupliquer ailleurs, avec le risque classique que les deux copies se desynchronisent.
 *
 * @param {{materiau: string, zone: string}} props.filtres
 * @param {Function} props.onChange - recoit le nouvel objet filtres complet
 * @param {number} props.nombreResultats
 */
export default function Filtres({ filtres, onChange, nombreResultats }) {
  const groupes = zonesParGroupe()
  const filtreActif = filtres.materiau !== '' || filtres.zone !== ''

  /**
   * Met a jour UN champ sans effacer les autres.
   * Le "...filtres" recopie l'objet existant, puis on ecrase la seule cle modifiee.
   */
  function modifier(champ, valeur) {
    onChange({ ...filtres, [champ]: valeur })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* grid-cols-1 sur mobile, sm:grid-cols-2 des 640px de large :
          c'est comme ca qu'on rend une interface responsive avec Tailwind. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="filtre-materiau" className="mb-1 block text-sm font-medium text-slate-700">
            Type de materiau
          </label>
          <select
            id="filtre-materiau"
            value={filtres.materiau}
            onChange={(e) => modifier('materiau', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-valo-vert focus:outline-none focus:ring-2 focus:ring-valo-vert/20"
          >
            <option value="">Tous les materiaux</option>
            {MATERIAUX.map((materiau) => (
              <option key={materiau.id} value={materiau.id}>
                {materiau.emoji} {materiau.libelle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtre-zone" className="mb-1 block text-sm font-medium text-slate-700">
            Zone
          </label>
          <select
            id="filtre-zone"
            value={filtres.zone}
            onChange={(e) => modifier('zone', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-valo-vert focus:outline-none focus:ring-2 focus:ring-valo-vert/20"
          >
            <option value="">Toute la Cote d'Ivoire</option>
            {/* Object.entries transforme {Abidjan: [...], "Autres villes": [...]}
                en [["Abidjan", [...]], ["Autres villes", [...]]] pour pouvoir boucler dessus. */}
            {Object.entries(groupes).map(([nomGroupe, zones]) => (
              <optgroup key={nomGroupe} label={nomGroupe}>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.libelle}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{nombreResultats}</span>{' '}
          {nombreResultats > 1 ? 'annonces trouvees' : 'annonce trouvee'}
        </p>

        {/* Le bouton de reinitialisation n'apparait que s'il y a quelque chose a reinitialiser. */}
        {filtreActif && (
          <button
            type="button"
            onClick={() => onChange({ materiau: '', zone: '' })}
            className="text-sm font-medium text-valo-vert hover:underline"
          >
            Reinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  )
}
