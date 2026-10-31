// App.jsx : déclaration des routes (plan du site)
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { SqueletteListe } from './components/Etats.jsx'
import Accueil from './pages/Accueil.jsx'
import Calendrier from './pages/Calendrier.jsx'
import Match from './pages/Match.jsx'
import Classement from './pages/Classement.jsx'
import Equipes from './pages/Equipes.jsx'
import Equipe from './pages/Equipe.jsx'
import Buteurs from './pages/Buteurs.jsx'
import Statistiques from './pages/Statistiques.jsx'
import NotFound from './pages/NotFound.jsx'
import Connexion from './pages/admin/Connexion.jsx'
import Tableau from './pages/admin/Tableau.jsx'
import MatchsAdmin from './pages/admin/Matchs.jsx'
import SaisieResultat from './pages/admin/SaisieResultat.jsx'
import EquipesAdmin from './pages/admin/Equipes.jsx'

// Vitrine du design system : incluse seulement en développement (absente du build)
const Charte = import.meta.env.DEV ? lazy(() => import('./pages/Charte.jsx')) : null

export default function App() {
  return (
    <Suspense fallback={<SqueletteListe />}>
      <Routes>
        {/* Accueil : pleine largeur pour le bandeau (hero) */}
        <Route element={<Layout pleineLargeur />}>
          <Route index element={<Accueil />} />
        </Route>

        {/* Partie publique */}
        <Route element={<Layout />}>
          <Route path="calendrier" element={<Calendrier />} />
          <Route path="matchs/:id" element={<Match />} />
          <Route path="classement" element={<Classement />} />
          <Route path="equipes" element={<Equipes />} />
          <Route path="equipes/:id" element={<Equipe />} />
          <Route path="buteurs" element={<Buteurs />} />
          <Route path="statistiques" element={<Statistiques />} />
          {Charte && <Route path="charte" element={<Charte />} />}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Administration : tout sauf la connexion exige une session */}
        <Route path="admin" element={<Layout admin />}>
          <Route path="connexion" element={<Connexion />} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Tableau />} />
            <Route path="matchs" element={<MatchsAdmin />} />
            <Route path="matchs/:id" element={<SaisieResultat />} />
            <Route path="equipes" element={<EquipesAdmin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
