// Match.jsx : détail d'un match — score, buteurs (avec minute) et cartons, côte à côte par équipe
import { Link, useParams } from 'react-router-dom'
import { api, formaterDate } from '../api.js'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, SqueletteListe } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'
import NotFound from './NotFound.jsx'

/** Liste des événements (buts ou cartons) d'une équipe. */
function Evenements({ buts, cartons }) {
  if (!buts.length && !cartons.length) return <p className="detail-match__rien">Aucun événement</p>
  return (
    <ul className="detail-match__evenements">
      {buts.map((b) => (
        <li key={`b${b.id}`}>
          <Icone nom="ballon" />
          <span>{b.joueur}</span>
          <span className="detail-match__minute chiffres">{b.minute}′</span>
          <span className="visuellement-cache">but</span>
        </li>
      ))}
      {cartons.map((c) => (
        <li key={`c${c.id}`}>
          <span className={`carton carton--${c.couleur}`} role="img" aria-label={`Carton ${c.couleur}`} />
          <span>{c.joueur}</span>
          <span className="detail-match__minute chiffres">{c.minute}′</span>
        </li>
      ))}
    </ul>
  )
}

export default function Match() {
  const { id } = useParams()
  const { donnees: m, chargement, erreur, recharger } = useDonnees(() => api.match(id), [id])
  useTitre(m ? `${m.equipe_dom} – ${m.equipe_ext}` : 'Match')

  if (erreur === 'Match introuvable') return <NotFound />

  const deLEquipe = (liste, equipeId) => liste.filter((x) => x.equipe_id === equipeId)

  return (
    <>
      <Link to={m ? `/calendrier?journee=${m.journee}` : '/calendrier'} className="retour">
        <Icone nom="fleche-gauche" />
        Retour au calendrier
      </Link>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}
      {chargement && <SqueletteListe nombre={2} libelle="Chargement du match…" />}

      {m && !chargement && (
        <article className="detail-match" aria-labelledby="titre-match">
          <header className="carte detail-match__entete zone-foncee">
            <p className="detail-match__meta">
              <span className="pastille pastille--fonce">Journée {m.journee}</span>
              <span>
                <Icone nom="calendrier" />
                {formaterDate(m.date_match, true)}
              </span>
              <span>
                <Icone nom="lieu" />
                {m.stade}
              </span>
            </p>
            <h1 id="titre-match" className="visuellement-cache">
              {m.equipe_dom} contre {m.equipe_ext}
            </h1>
            <div className="detail-match__affiche">
              <Link to={`/equipes/${m.equipe_dom_id}`} className="detail-match__equipe">
                <Ecusson nom={m.equipe_dom} couleurs={m.couleurs_dom} taille="xl" decoratif />
                {m.equipe_dom}
              </Link>
              <p className="detail-match__score chiffres">
                {m.joue ? (
                  <>
                    {m.score_dom}
                    <span aria-hidden="true"> – </span>
                    <span className="visuellement-cache"> à </span>
                    {m.score_ext}
                  </>
                ) : (
                  <span className="detail-match__a-jouer">À jouer</span>
                )}
              </p>
              <Link to={`/equipes/${m.equipe_ext_id}`} className="detail-match__equipe">
                <Ecusson nom={m.equipe_ext} couleurs={m.couleurs_ext} taille="xl" decoratif />
                {m.equipe_ext}
              </Link>
            </div>
          </header>

          {m.joue ? (
            <div className="grille">
              <section className="carte" aria-labelledby="ev-dom">
                <h2 id="ev-dom" className="carte__entete carte__titre">{m.equipe_dom}</h2>
                <div className="carte__corps">
                  <Evenements buts={deLEquipe(m.buts, m.equipe_dom_id)} cartons={deLEquipe(m.cartons, m.equipe_dom_id)} />
                </div>
              </section>
              <section className="carte" aria-labelledby="ev-ext">
                <h2 id="ev-ext" className="carte__entete carte__titre">{m.equipe_ext}</h2>
                <div className="carte__corps">
                  <Evenements buts={deLEquipe(m.buts, m.equipe_ext_id)} cartons={deLEquipe(m.cartons, m.equipe_ext_id)} />
                </div>
              </section>
            </div>
          ) : (
            <p className="detail-match__info">Ce match n’a pas encore été joué : le score, les buteurs et les cartons apparaîtront après la saisie du résultat.</p>
          )}
        </article>
      )}
    </>
  )
}
