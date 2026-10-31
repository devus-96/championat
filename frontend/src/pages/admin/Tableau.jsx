// Tableau.jsx : tableau de bord admin — avancement de la saison et prochains résultats à saisir
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import CarteMatch from '../../components/CarteMatch.jsx'
import { BandeauErreur, EtatVide, SqueletteListe } from '../../components/Etats.jsx'
import Icone from '../../components/Icone.jsx'
import useDonnees from '../../hooks/useDonnees.js'
import useTitre from '../../hooks/useTitre.js'

async function chargerTableau() {
  const [matchs, equipes] = await Promise.all([api.matchs(), api.equipes()])
  return { matchs, equipes }
}

export default function Tableau() {
  useTitre('Tableau de bord')
  const { donnees, chargement, erreur, recharger } = useDonnees(chargerTableau)

  const joues = donnees?.matchs.filter((m) => m.joue) ?? []
  const aSaisir = donnees?.matchs.filter((m) => !m.joue) ?? []
  const avancement = donnees?.matchs.length ? Math.round((joues.length / donnees.matchs.length) * 100) : 0

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Administration</p>
          <h1 className="entete-page__titre">Tableau de bord</h1>
        </div>
        <div className="entete-page__actions">
          <Link to="/admin/matchs" className="bouton bouton--primaire">
            <Icone nom="sifflet" />
            Saisir un résultat
          </Link>
          <Link to="/admin/equipes" className="bouton bouton--secondaire">
            <Icone nom="equipes" />
            Équipes et joueurs
          </Link>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}
      {chargement && <SqueletteListe nombre={3} />}

      {donnees && !chargement && (
        <>
          <dl className="bilan section">
            <div className="carte bilan__case">
              <dt>Équipes</dt>
              <dd className="chiffres">{donnees.equipes.length}</dd>
            </div>
            <div className="carte bilan__case">
              <dt>Matchs joués</dt>
              <dd className="chiffres">
                {joues.length} / {donnees.matchs.length}
              </dd>
            </div>
            <div className="carte bilan__case">
              <dt>Résultats à saisir</dt>
              <dd className="chiffres">{aSaisir.length}</dd>
            </div>
            <div className="carte bilan__case">
              <dt>Avancement</dt>
              <dd className="chiffres">{avancement} %</dd>
            </div>
          </dl>
          <div
            className="barre-progression section"
            role="progressbar"
            aria-label="Avancement de la saison"
            aria-valuenow={avancement}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${avancement}%` }} />
          </div>

          <section className="section" aria-labelledby="titre-a-saisir">
            <div className="section__entete">
              <h2 id="titre-a-saisir" className="section__titre">Prochains résultats à saisir</h2>
              <Link to="/admin/matchs" className="lien-fleche">
                Tous les matchs
                <Icone nom="fleche-droite" />
              </Link>
            </div>
            {aSaisir.length ? (
              <div className="liste-matchs">
                {aSaisir.slice(0, 5).map((m) => (
                  <CarteMatch key={m.id} match={m} vers={`/admin/matchs/${m.id}`} afficherJournee />
                ))}
              </div>
            ) : (
              <EtatVide titre="Tous les résultats sont saisis" texte="La saison est terminée." />
            )}
          </section>
        </>
      )}
    </>
  )
}
