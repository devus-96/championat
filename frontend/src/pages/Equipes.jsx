// Equipes.jsx : liste des équipes en cartes cliquables
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, SqueletteListe } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

export default function Equipes() {
  useTitre('Équipes')
  const { donnees, chargement, erreur, recharger } = useDonnees(api.equipes)

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Saison 2026</p>
          <h1 className="entete-page__titre">Équipes</h1>
          <p className="entete-page__intro">Les clubs engagés, leur quartier et leur entraîneur.</p>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}

      {chargement ? (
        <SqueletteListe nombre={6} />
      ) : (
        <ul className="grille grille--3 liste-nue">
          {donnees?.map((e) => (
            <li key={e.id}>
              <Link to={`/equipes/${e.id}`} className="carte carte--lien carte-equipe">
                <Ecusson nom={e.nom} couleurs={e.couleurs} logo={e.logo} taille="l" decoratif />
                <span className="carte-equipe__texte">
                  <strong className="carte-equipe__nom">{e.nom}</strong>
                  <span className="carte-equipe__meta">
                    <Icone nom="lieu" />
                    {e.quartier}
                  </span>
                  <span className="carte-equipe__meta">
                    <Icone nom="utilisateur" />
                    {e.entraineur}
                  </span>
                </span>
                <Icone nom="chevron" className="carte-equipe__chevron" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
