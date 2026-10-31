// Accueil.jsx : bandeau d'accueil + prochains matchs, tête du classement et meilleurs buteurs
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import CarteMatch from '../components/CarteMatch.jsx'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, EtatVide, SqueletteListe, SqueletteTableau } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import TableauClassement from '../components/TableauClassement.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

/** Charge en parallèle tout ce dont l'accueil a besoin. */
async function chargerAccueil() {
  const [journees, classement, buteurs] = await Promise.all([api.journees(), api.classement(), api.buteurs(5)])
  // Prochaine journée à jouer, sinon la dernière journée (championnat terminé)
  const journee = journees.prochaine ?? journees.journees.at(-1)
  const matchs = journee ? await api.matchs(journee) : []
  return { journee, termine: journees.prochaine == null, matchs, classement, buteurs }
}

export default function Accueil() {
  useTitre(null)
  const { donnees, chargement, erreur, recharger } = useDonnees(chargerAccueil)

  // Chiffres clés calculés depuis le classement (chaque match compte pour deux équipes)
  const chiffres = donnees && {
    matchs: donnees.classement.reduce((s, l) => s + l.j, 0) / 2,
    buts: donnees.classement.reduce((s, l) => s + l.bp, 0),
    equipes: donnees.classement.length,
  }

  return (
    <>
      <section className="hero zone-foncee" aria-labelledby="titre-accueil">
        <div className="hero__interieur">
          <div>
            <p className="hero__surtitre">
              <Icone nom="ballon" />
              Tournoi de vacances · Saison 2026
            </p>
            <h1 id="titre-accueil" className="hero__titre">
              Championnat des <span className="hero__titre-accent">quartiers</span> de Bafoussam
            </h1>
            <p className="hero__texte">
              Dix équipes de quartier, un seul titre. Suivez le calendrier, les résultats, le classement et les
              buteurs, mis à jour après chaque match.
            </p>
            <div className="hero__actions">
              <Link to="/calendrier" className="bouton bouton--accent">
                <Icone nom="calendrier" />
                Voir le calendrier
              </Link>
              <Link to="/classement" className="bouton bouton--clair">
                <Icone nom="trophee" />
                Classement
              </Link>
            </div>
          </div>

          {chiffres && (
            <dl className="hero__chiffres">
              <div>
                <dt>Équipes</dt>
                <dd className="chiffres">{chiffres.equipes}</dd>
              </div>
              <div>
                <dt>Matchs joués</dt>
                <dd className="chiffres">{chiffres.matchs}</dd>
              </div>
              <div>
                <dt>Buts marqués</dt>
                <dd className="chiffres">{chiffres.buts}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <div className="conteneur">
        {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}

        <div className="grille-accueil">
          <section className="section" aria-labelledby="titre-prochains">
            <div className="section__entete">
              <h2 id="titre-prochains" className="section__titre">
                {donnees?.termine ? 'Dernière journée' : 'Prochains matchs'}
                {donnees?.journee && <span className="pastille">Journée {donnees.journee}</span>}
              </h2>
              <Link to="/calendrier" className="lien-fleche">
                Tout le calendrier
                <Icone nom="fleche-droite" />
              </Link>
            </div>
            {chargement && !donnees ? (
              <SqueletteListe nombre={4} />
            ) : donnees?.matchs.length ? (
              <div className="liste-matchs">
                {donnees.matchs.map((m) => (
                  <CarteMatch key={m.id} match={m} />
                ))}
              </div>
            ) : (
              donnees && <EtatVide titre="Aucun match programmé" texte="Le calendrier sera publié prochainement." />
            )}
          </section>

          <section className="section" aria-labelledby="titre-tete">
            <div className="section__entete">
              <h2 id="titre-tete" className="section__titre">Classement</h2>
              <Link to="/classement" className="lien-fleche">
                Complet
                <Icone nom="fleche-droite" />
              </Link>
            </div>
            {chargement && !donnees ? (
              <SqueletteTableau lignes={5} />
            ) : (
              donnees && <TableauClassement lignes={donnees.classement.slice(0, 5)} compact legende="Cinq premières équipes" />
            )}
          </section>

          <section className="section" aria-labelledby="titre-buteurs">
            <div className="section__entete">
              <h2 id="titre-buteurs" className="section__titre">Buteurs</h2>
              <Link to="/buteurs" className="lien-fleche">
                Top 10
                <Icone nom="fleche-droite" />
              </Link>
            </div>
            {chargement && !donnees ? (
              <SqueletteListe nombre={1} />
            ) : donnees?.buteurs.length ? (
              <ol className="carte liste-buteurs">
                {donnees.buteurs.map((b, i) => (
                  <li key={b.id} className="liste-buteurs__ligne">
                    <span className="liste-buteurs__rang chiffres">{i + 1}</span>
                    <span className="liste-buteurs__joueur">
                      <strong>{b.nom}</strong>
                      <Link to={`/equipes/${b.equipe_id}`} className="equipe-nom liste-buteurs__equipe">
                        <Ecusson nom={b.equipe} couleurs={b.couleurs} taille="s" decoratif />
                        <span className="equipe-nom__texte">{b.equipe}</span>
                      </Link>
                    </span>
                    <span className="liste-buteurs__buts chiffres">
                      {b.buts} <span className="visuellement-cache">buts</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              donnees && <EtatVide titre="Aucun but marqué" />
            )}
          </section>
        </div>
      </div>
    </>
  )
}
