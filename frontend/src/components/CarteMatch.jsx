// CarteMatch.jsx : un match sous forme de carte cliquable
// « Équipe A  2 – 1  Équipe B », date, stade, pastille « À jouer » / « Terminé »
import { Link } from 'react-router-dom'
import Ecusson from './Ecusson.jsx'
import Icone from './Icone.jsx'
import { formaterDate } from '../api.js'

export default function CarteMatch({ match, vers = `/matchs/${match.id}`, afficherJournee = false }) {
  const joue = Boolean(match.joue)
  const libelle = joue
    ? `${match.equipe_dom} ${match.score_dom}, ${match.equipe_ext} ${match.score_ext}`
    : `${match.equipe_dom} contre ${match.equipe_ext}, à jouer`

  return (
    <Link to={vers} className="carte carte--lien carte-match" aria-label={`${libelle}. Voir le détail`}>
      <div className="carte-match__infos">
        {afficherJournee && <span className="pastille">Journée {match.journee}</span>}
        <span className="carte-match__meta">
          <Icone nom="calendrier" />
          {formaterDate(match.date_match)}
        </span>
        <span className="carte-match__meta">
          <Icone nom="lieu" />
          {match.stade}
        </span>
        {joue ? (
          <span className="pastille pastille--termine"><span className="pastille__point" />Terminé</span>
        ) : (
          <span className="pastille pastille--a-jouer"><span className="pastille__point" />À jouer</span>
        )}
      </div>

      <div className="carte-match__affiche" aria-hidden="true">
        <span className="carte-match__equipe">
          <span className="equipe-nom__texte">{match.equipe_dom}</span>
          <Ecusson nom={match.equipe_dom} couleurs={match.couleurs_dom} decoratif />
        </span>
        <span className={`carte-match__score chiffres${joue ? '' : ' carte-match__score--vide'}`}>
          {joue ? `${match.score_dom} – ${match.score_ext}` : 'vs'}
        </span>
        <span className="carte-match__equipe carte-match__equipe--ext">
          <Ecusson nom={match.equipe_ext} couleurs={match.couleurs_ext} decoratif />
          <span className="equipe-nom__texte">{match.equipe_ext}</span>
        </span>
      </div>
    </Link>
  )
}
