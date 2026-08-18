import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration de Vite (l'outil qui lance le serveur de dev et fabrique le site final).
// On garde le strict minimum : plus il y a de configuration, plus c'est dur a maintenir.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // "host: true" rend le serveur accessible depuis un telephone sur le meme wifi.
    // Pratique pour tester ValoBTP sur un vrai smartphone pendant le developpement.
    host: true,
  },
  build: {
    // Le dossier genere par "npm run build". C'est ce dossier qu'on met en ligne.
    outDir: 'dist',
  },
})
