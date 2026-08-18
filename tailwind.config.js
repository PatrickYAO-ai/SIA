/** @type {import('tailwindcss').Config} */

// Configuration de Tailwind CSS.
// "content" dit a Tailwind ou chercher les classes utilisees, pour ne garder
// que le CSS reellement necessaire dans le fichier final (site plus leger = plus rapide en 3G).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Palette ValoBTP. On definit les couleurs une seule fois ici,
      // ensuite on ecrit simplement "bg-valo-vert" partout dans l'application.
      colors: {
        'valo-vert': '#15803d', // vert principal (valorisation, recyclage)
        'valo-vert-clair': '#dcfce7',
        'valo-orange': '#ea580c', // couleur d'accent (chantier, BTP)
        'valo-gris': '#f8fafc', // fond de page
      },
    },
  },
  plugins: [],
}
