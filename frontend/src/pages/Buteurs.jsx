// Buteurs.jsx : classement des 10 meilleurs buteurs (données de /api/buteurs)
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, EtatVide, SqueletteTableau } from '../components/Etats.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

export default function Buteurs() {
  useTitre('Buteurs')
  const { donnees, chargement, erreur, recharger } = useDonnees(() => api.buteurs(10))

  // Rang « sportif » : deux joueurs à égalité de buts partagent le même rang
  const rangs = []
  donnees?.forEach((b, i) => {
    rangs.push(i > 0 && b.buts === donnees[i - 1].buts ? rangs[i - 1] : i + 1)
  })

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Saison 2026</p>
          <h1 className="entete-page__titre">Buteurs</h1>
          <p className="entete-page__intro">Les dix meilleurs buteurs du championnat.</p>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}

      {chargement ? (
        <SqueletteTableau lignes={10} />
      ) : donnees?.length ? (
        <div className="tableau-conteneur">
          <table className="tableau">
            <caption>Classement des buteurs</caption>
            <thead>
              <tr>
                <th scope="col">Rang</th>
                <th scope="col" className="gauche fige">Joueur</th>
                <th scope="col" className="gauche">Équipe</th>
                <th scope="col">Buts</th>
              </tr>
            </thead>
            <tbody>
              {donnees.map((b, i) => (
                <tr key={b.id} className={rangs[i] <= 3 ? `ligne--tete ligne--podium-${rangs[i]}` : undefined}>
                  <td className="classement__rang">{rangs[i]}</td>
                  <th scope="row" className="gauche fige">{b.nom}</th>
                  <td className="gauche">
                    <Link to={`/equipes/${b.equipe_id}`} className="equipe-nom">
                      <Ecusson nom={b.equipe} couleurs={b.couleurs} taille="s" decoratif />
                      <span className="equipe-nom__texte">{b.equipe}</span>
                    </Link>
                  </td>
                  <td className="classement__pts">{b.buts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !erreur && <EtatVide titre="Aucun but marqué pour l’instant" />
      )}
    </>
  )
}
