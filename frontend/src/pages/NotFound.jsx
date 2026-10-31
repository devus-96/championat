// NotFound.jsx : page 404 (équivalent du gabarit 404 de Flask)
import { Link } from 'react-router-dom'
import { EtatVide } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import useTitre from '../hooks/useTitre.js'

export default function NotFound() {
  useTitre('Page introuvable')
  return (
    <>
      <h1 className="entete-page__titre">Hors-jeu !</h1>
      <EtatVide titre="Page introuvable (erreur 404)" texte="La page demandée n’existe pas ou a été déplacée.">
        <Link to="/" className="bouton bouton--primaire">
          <Icone nom="accueil" />
          Retour à l’accueil
        </Link>
      </EtatVide>
    </>
  )
}
