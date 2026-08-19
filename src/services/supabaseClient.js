// Connexion a la base de donnees partagee (Supabase).
//
// C'est le SEUL endroit du projet ou on ouvre la connexion. Tout le reste
// de l'application passe par src/services/annonces.js, qui importe ce
// fichier — jamais l'inverse.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !cle) {
  // Erreur volontairement bruyante : mieux vaut un message clair au demarrage
  // qu'une page blanche silencieuse si les variables d'environnement manquent
  // (oubli frequent lors d'une premiere mise en ligne).
  throw new Error(
    'Configuration Supabase manquante. Verifie que VITE_SUPABASE_URL et ' +
      'VITE_SUPABASE_ANON_KEY sont bien definies (fichier .env en local, ' +
      'variables d\'environnement sur Netlify en production).'
  )
}

export const supabase = createClient(url, cle)
