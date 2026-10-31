// Matchs.jsx (admin) : liste des matchs à saisir ou à corriger, filtrée par état et par journée
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import CarteMatch from '../../components/CarteMatch.jsx'
import ChampFormulaire from '../../components/ChampFormulaire.jsx'
import { BandeauErreur, EtatVide, SqueletteListe } from '../../components/Etats.jsx'
import useDonnees from '../../hooks/useDonnees.js'
import useTitre from '../../hooks/useTitre.js'

const FILTRES = { a_saisir: 'À saisir', joues: 'Joués (à corriger)', tous: 'Tous' }

export default function Matchs() {
  useTitre('Résultats à saisir')
  const [parametres, setParametres] = useSearchParams()
  const filtre = FILTRES[parametres.get('etat')] ? parametres.get('etat') : 'a_saisir'
  const { donnees, chargement, erreur, recharger } = useDonnees(api.matchs)

  const changerFiltre = (e) => setParametres({ etat: e.target.value }, { replace: true })

  const matchs = (donnees ?? []).filter((m) => (filtre === 'tous' ? true : filtre === 'joues' ? m.joue : !m.joue))
  // Regroupement par journée : { 1: [...], 2: [...] }
  const parJournee = matchs.reduce((groupes, m) => {
    ;(groupes[m.journee] ??= []).push(m)
    return groupes
  }, {})

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Administration</p>
          <h1 className="entete-page__titre">Résultats</h1>
          <p className="entete-page__intro">Choisissez un match pour saisir ou corriger son score, ses buteurs et ses cartons.</p>
        </div>
        <div className="entete-page__actions">
          <ChampFormulaire id="filtre-etat" label="Afficher" value={filtre} onChange={changerFiltre}>
            {Object.entries(FILTRES).map(([cle, libelle]) => (
              <option key={cle} value={cle}>
                {libelle}
              </option>
            ))}
          </ChampFormulaire>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}

      {chargement ? (
        <SqueletteListe nombre={5} />
      ) : matchs.length ? (
        Object.entries(parJournee).map(([journee, liste]) => (
          <section key={journee} className="section" aria-labelledby={`j-${journee}`}>
            <h2 id={`j-${journee}`} className="section__titre">Journée {journee}</h2>
            <div className="liste-matchs">
              {liste.map((m) => (
                <CarteMatch key={m.id} match={m} vers={`/admin/matchs/${m.id}`} />
              ))}
            </div>
          </section>
        ))
      ) : (
        !erreur && <EtatVide titre="Aucun match dans cette catégorie" />
      )}
    </>
  )
}
