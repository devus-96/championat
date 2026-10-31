// ProtectedRoute.jsx : vérifie la session (/api/admin/moi) avant d'afficher une page admin.
// 401 → redirection vers /admin/connexion (en mémorisant la page demandée).
// Affiche aussi la barre « Connecté en tant que … · Se déconnecter ».
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import Bouton from './Bouton.jsx'
import Icone from './Icone.jsx'
import { SqueletteListe } from './Etats.jsx'
import { useToast } from './Toast.jsx'

export default function ProtectedRoute() {
  const [etat, setEtat] = useState({ verifie: false, login: null })
  const [deconnexion, setDeconnexion] = useState(false)
  const location = useLocation()
  const naviguer = useNavigate()
  const { afficherToast } = useToast()

  useEffect(() => {
    let actif = true
    api
      .moi()
      .then((r) => actif && setEtat({ verifie: true, login: r.login }))
      .catch(() => actif && setEtat({ verifie: true, login: null }))
    return () => {
      actif = false
    }
  }, [])

  const seDeconnecter = async () => {
    setDeconnexion(true)
    try {
      await api.deconnexion()
      afficherToast('Vous êtes déconnecté.')
      naviguer('/admin/connexion', { replace: true })
    } catch (e) {
      afficherToast(e.message, 'erreur')
      setDeconnexion(false)
    }
  }

  if (!etat.verifie) return <SqueletteListe nombre={2} libelle="Vérification de la session…" />
  if (!etat.login) return <Navigate to="/admin/connexion" replace state={{ depuis: location.pathname }} />

  return (
    <>
      <div className="barre-admin">
        <span className="barre-admin__utilisateur">
          <Icone nom="utilisateur" />
          Connecté en tant que <strong>{etat.login}</strong>
        </span>
        <Bouton variante="fantome" petit icone="deconnexion" chargement={deconnexion} libelleChargement="Déconnexion…" onClick={seDeconnecter}>
          Se déconnecter
        </Bouton>
      </div>
      <Outlet />
    </>
  )
}
