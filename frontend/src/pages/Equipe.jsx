// Equipe.jsx : fiche équipe — identité, bilan, effectif trié par poste et résultats
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import CarteMatch from '../components/CarteMatch.jsx'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, SqueletteListe } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'
import NotFound from './NotFound.jsx'

export const POSTES = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']
const POSTES_PLURIEL = { Gardien: 'Gardiens', Défenseur: 'Défenseurs', Milieu: 'Milieux', Attaquant: 'Attaquants' }

/** Âge en années à partir d'une date « AAAA-MM-JJ ». */
function age(naissance) {
  const [a, m, j] = naissance.split('-').map(Number)
  const aujourdHui = new Date()
  let ans = aujourdHui.getFullYear() - a
  if (aujourdHui.getMonth() + 1 < m || (aujourdHui.getMonth() + 1 === m && aujourdHui.getDate() < j)) ans -= 1
  return ans
}

export default function Equipe() {
  const { id } = useParams()
  const { donnees: e, chargement, erreur, recharger } = useDonnees(() => api.equipe(id), [id])
  useTitre(e ? e.nom : 'Équipe')

  if (erreur === 'Équipe introuvable') return <NotFound />

  const bilan = e?.stats && [
    ['Rang', e.stats.j ? `${e.stats.rang}e` : '–'],
    ['Points', e.stats.pts],
    ['Joués', e.stats.j],
    ['G / N / P', `${e.stats.g} / ${e.stats.n} / ${e.stats.p}`],
    ['Buts', `${e.stats.bp} – ${e.stats.bc}`],
  ]

  return (
    <>
      <Link to="/equipes" className="retour">
        <Icone nom="fleche-gauche" />
        Toutes les équipes
      </Link>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}
      {chargement && <SqueletteListe nombre={3} libelle="Chargement de l’équipe…" />}

      {e && !chargement && (
        <>
          <header className="fiche-equipe">
            <Ecusson nom={e.nom} couleurs={e.couleurs} logo={e.logo} taille="xl" />
            <div>
              <p className="surtitre">Quartier {e.quartier}</p>
              <h1 className="entete-page__titre">{e.nom}</h1>
              <p className="fiche-equipe__meta">
                <span>
                  <Icone nom="utilisateur" />
                  Entraîneur : {e.entraineur}
                </span>
                <span>
                  <Icone nom="maillot" />
                  Couleurs : {e.couleurs}
                </span>
              </p>
            </div>
          </header>

          {bilan && (
            <dl className="bilan">
              {bilan.map(([libelle, valeur]) => (
                <div key={libelle} className="carte bilan__case">
                  <dt>{libelle}</dt>
                  <dd className="chiffres">{valeur}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="grille-fiche">
            <section className="section" aria-labelledby="titre-effectif">
              <h2 id="titre-effectif" className="section__titre">
                Effectif <span className="pastille">{e.joueurs.length} joueurs</span>
              </h2>
              {POSTES.map((poste) => {
                const joueurs = e.joueurs.filter((j) => j.poste === poste)
                if (!joueurs.length) return null
                return (
                  <div key={poste} className="tableau-conteneur effectif">
                    <table className="tableau">
                      <caption className="effectif__poste">{POSTES_PLURIEL[poste]}</caption>
                      <thead>
                        <tr>
                          <th scope="col">N°</th>
                          <th scope="col" className="gauche">Joueur</th>
                          <th scope="col">Âge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {joueurs.map((j) => (
                          <tr key={j.id}>
                            <td className="fort">{j.numero}</td>
                            <th scope="row" className="gauche">{j.nom}</th>
                            <td>{age(j.date_naissance)} ans</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </section>

            <section className="section" aria-labelledby="titre-resultats">
              <h2 id="titre-resultats" className="section__titre">Matchs</h2>
              <div className="liste-matchs">
                {e.matchs.map((m) => (
                  <CarteMatch key={m.id} match={m} afficherJournee />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}
