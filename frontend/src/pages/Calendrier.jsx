// Calendrier.jsx : matchs et résultats d'une journée (sélecteur de journée, mémorisé dans l'URL ?journee=N)
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import Bouton from '../components/Bouton.jsx'
import CarteMatch from '../components/CarteMatch.jsx'
import ChampFormulaire from '../components/ChampFormulaire.jsx'
import { BandeauErreur, EtatVide, SqueletteListe } from '../components/Etats.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

export default function Calendrier() {
  useTitre('Calendrier et résultats')
  const [parametres, setParametres] = useSearchParams()
  const journees = useDonnees(api.journees)

  const liste = journees.donnees?.journees ?? []
  const journee = Number(parametres.get('journee')) || journees.donnees?.prochaine || liste.at(-1) || null
  const matchs = useDonnees(() => (journee ? api.matchs(journee) : Promise.resolve([])), [journee])

  // Une journée inexistante dans l'URL (?journee=99) revient à la journée par défaut
  useEffect(() => {
    if (journees.donnees && parametres.get('journee') && !liste.includes(journee)) setParametres({}, { replace: true })
  }, [journees.donnees, journee, liste, parametres, setParametres])

  const choisir = (n) => setParametres({ journee: String(n) })
  const index = liste.indexOf(journee)

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Saison 2026</p>
          <h1 className="entete-page__titre">Calendrier</h1>
          <p className="entete-page__intro">Matchs aller, journée par journée. Cliquez sur un match pour voir les buteurs.</p>
        </div>
        {liste.length > 0 && (
          <div className="entete-page__actions">
            <Bouton variante="secondaire" icone="fleche-gauche" disabled={index <= 0} onClick={() => choisir(liste[index - 1])}>
              <span className="visuellement-cache">Journée </span>Précédente
            </Bouton>
            <ChampFormulaire id="choix-journee" label="Journée" value={journee ?? ''} onChange={(e) => choisir(e.target.value)}>
              {liste.map((n) => (
                <option key={n} value={n}>
                  Journée {n}
                </option>
              ))}
            </ChampFormulaire>
            <Bouton variante="secondaire" disabled={index === -1 || index >= liste.length - 1} onClick={() => choisir(liste[index + 1])}>
              Suivante<span className="visuellement-cache"> journée</span>
            </Bouton>
          </div>
        )}
      </header>

      {journees.erreur && <BandeauErreur message={journees.erreur} onReessayer={() => journees.recharger().catch(() => {})} />}
      {matchs.erreur && <BandeauErreur message={matchs.erreur} onReessayer={() => matchs.recharger().catch(() => {})} />}

      <section aria-labelledby="titre-journee">
        <h2 id="titre-journee" className="section__titre">
          {journee ? `Journée ${journee}` : 'Matchs'}
        </h2>
        {matchs.chargement || journees.chargement ? (
          <SqueletteListe nombre={5} libelle="Chargement des matchs…" />
        ) : matchs.donnees?.length ? (
          <div className="liste-matchs">
            {matchs.donnees.map((m) => (
              <CarteMatch key={m.id} match={m} />
            ))}
          </div>
        ) : (
          !matchs.erreur && <EtatVide titre="Aucun match pour cette journée" />
        )}
      </section>
    </>
  )
}
