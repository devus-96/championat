// Connexion.jsx : connexion administrateur, avec vérification JavaScript avant envoi (champs non vides)
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import Bouton from '../../components/Bouton.jsx'
import ChampFormulaire from '../../components/ChampFormulaire.jsx'
import Icone from '../../components/Icone.jsx'
import { useToast } from '../../components/Toast.jsx'
import useTitre from '../../hooks/useTitre.js'

export default function Connexion() {
  useTitre('Connexion administrateur')
  const [valeurs, setValeurs] = useState({ login: '', mot_de_passe: '' })
  const [erreurs, setErreurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const [erreurServeur, setErreurServeur] = useState(null)
  const champLogin = useRef(null)
  const champMdp = useRef(null)
  const naviguer = useNavigate()
  const { state } = useLocation()
  const { afficherToast } = useToast()

  const modifier = (e) => {
    const { name, value } = e.target
    setValeurs((v) => ({ ...v, [name]: value }))
    if (erreurs[name]) setErreurs((er) => ({ ...er, [name]: null }))
  }

  /** Vérification côté navigateur ; le serveur revérifie de toute façon. */
  const verifier = () => {
    const er = {}
    if (!valeurs.login.trim()) er.login = 'Saisissez votre identifiant.'
    if (!valeurs.mot_de_passe) er.mot_de_passe = 'Saisissez votre mot de passe.'
    return er
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreurServeur(null)
    const er = verifier()
    setErreurs(er)
    if (er.login) return champLogin.current?.focus()
    if (er.mot_de_passe) return champMdp.current?.focus()

    setEnvoi(true)
    try {
      const r = await api.connexion(valeurs.login.trim(), valeurs.mot_de_passe)
      afficherToast(`Bienvenue, ${r.login}.`)
      naviguer(state?.depuis || '/admin', { replace: true })
    } catch (err) {
      setErreurServeur(err.message)
      setValeurs((v) => ({ ...v, mot_de_passe: '' }))
      champMdp.current?.focus()
      setEnvoi(false)
    }
  }

  return (
    <div className="connexion">
      <div className="carte connexion__carte">
        <div className="carte__corps">
          <p className="surtitre">
            <Icone nom="bouclier" className="connexion__icone" />
            Espace réservé
          </p>
          <h1 className="connexion__titre">Connexion</h1>
          <p className="entete-page__intro">Réservé à l’organisation du championnat.</p>

          {erreurServeur && (
            <p className="champ__erreur connexion__erreur" role="alert">
              <Icone nom="alerte" />
              {erreurServeur}
            </p>
          )}

          <form className="formulaire" onSubmit={soumettre} noValidate>
            <ChampFormulaire
              ref={champLogin}
              id="login"
              name="login"
              label="Identifiant"
              autoComplete="username"
              value={valeurs.login}
              onChange={modifier}
              erreur={erreurs.login}
              obligatoire
              autoFocus
            />
            <ChampFormulaire
              ref={champMdp}
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              label="Mot de passe"
              autoComplete="current-password"
              value={valeurs.mot_de_passe}
              onChange={modifier}
              erreur={erreurs.mot_de_passe}
              obligatoire
            />
            <Bouton type="submit" bloc chargement={envoi} libelleChargement="Connexion…">
              Se connecter
            </Bouton>
          </form>
        </div>
      </div>
    </div>
  )
}
