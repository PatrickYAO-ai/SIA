import { Link, useLocation } from 'react-router-dom'

/**
 * Barre de navigation affichee en haut de toutes les pages.
 *
 * useLocation() nous dit sur quelle page on se trouve actuellement.
 * On s'en sert pour mettre en evidence l'onglet actif : sur un petit ecran,
 * l'utilisateur doit voir en un coup d'oeil ou il est.
 */
export default function EnTete() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        {/* Logo : un simple texte, aucune image a telecharger. */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-valo-vert text-lg text-white">
            ♻
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Valo<span className="text-valo-vert">Pro</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <LienOnglet to="/" actif={pathname === '/'}>
            Annonces
          </LienOnglet>
          <LienOnglet to="/publier" actif={pathname === '/publier'}>
            + Publier
          </LienOnglet>
        </nav>
      </div>
    </header>
  )
}

/**
 * Un onglet de navigation.
 *
 * Composant local : il n'est utilise que dans ce fichier, donc on le laisse ici
 * plutot que de creer un fichier de plus. Regle simple a suivre dans ce projet :
 * on sort un composant dans son propre fichier seulement quand une DEUXIEME page
 * en a besoin.
 */
function LienOnglet({ to, actif, children }) {
  return (
    <Link
      to={to}
      className={
        'rounded-lg px-3 py-2 text-sm font-medium transition ' +
        (actif ? 'bg-valo-vert-clair text-valo-vert' : 'text-slate-600 hover:bg-slate-100')
      }
    >
      {children}
    </Link>
  )
}
