import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'

// Feuilles de style. L'ordre compte : Leaflet d'abord, nos styles ensuite,
// pour que nos regles puissent corriger celles de Leaflet si besoin.
import 'leaflet/dist/leaflet.css'
import './index.css'

// Point d'entree unique de l'application.
// Tout part d'ici : React vient s'accrocher a la div #root de index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter active la navigation entre les pages (/, /publier). */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
