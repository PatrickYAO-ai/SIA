// PostCSS est l'outil qui execute Tailwind au moment du build.
// Ce fichier ne changera quasiment jamais : on le pose une fois et on l'oublie.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // ajoute automatiquement les prefixes navigateurs (-webkit-, etc.)
  },
}
