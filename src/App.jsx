import { Routes, Route, Navigate } from 'react-router-dom'

import EnTete from './components/EnTete.jsx'
import ListeAnnonces from './pages/ListeAnnonces.jsx'
import PublierAnnonce from './pages/PublierAnnonce.jsx'

/**
 * Squelette de l'application : l'en-tete, le pied de page, et entre les deux
 * la page correspondant a l'adresse courante.
 *
 * Le "routeur" fonctionne comme un aiguillage :
 *   adresse "/"          -> page ListeAnnonces
 *   adresse "/publier"   -> page PublierAnnonce
 *   toute autre adresse  -> renvoi vers "/"
 *
 * Pour ajouter une page : creer le fichier dans src/pages/, puis ajouter
 * une ligne <Route> ci-dessous. C'est tout.
 */
export default function App() {
  return (
    // flex + min-h-screen : le pied de page reste en bas meme si la page est courte.
    <div className="flex min-h-screen flex-col">
      <EnTete />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ListeAnnonces />} />
          <Route path="/publier" element={<PublierAnnonce />} />
          {/* Adresse inconnue : on redirige plutot que d'afficher une page blanche. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-600">
            ValoBTP · Valorisation des dechets de chantier en Cote d'Ivoire
          </p>
          <p className="mt-1">Prototype presente au SIA Digital Awards 2026 (GIBTP)</p>
        </div>
      </footer>
    </div>
  )
}
