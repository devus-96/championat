// Classement.jsx : classement général trié au clic, actualisé sans rechargement de la page
// (bouton « Actualiser » + actualisation automatique toutes les 30 s)
import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Bouton from '../components/Bouton.jsx'
import { BandeauErreur, SqueletteTableau } from '../components/Etats.jsx'
import TableauClassement from '../components/TableauClassement.jsx'
import { useToast } from '../components/Toast.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

const INTERVALLE_ACTUALISATION = 30000
const FORMAT_HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function Classement() {
  useTitre('Classement')
  const { donnees, chargement, erreur, recharger } = useDonnees(api.classement)
  const [miseAJour, setMiseAJour] = useState(null)
  const [actualisation, setActualisation] = useState(false)
  const { afficherToast } = useToast()

  useEffect(() => {
    if (donnees) setMiseAJour(new Date())
  }, [donnees])

  // Actualisation automatique silencieuse (pas de squelette, le tableau reste affiché)
  useEffect(() => {
    const minuterie = setInterval(() => recharger({ silencieux: true }).catch(() => {}), INTERVALLE_ACTUALISATION)
    return () => clearInterval(minuterie)
  }, [recharger])

  const actualiser = async () => {
    setActualisation(true)
    try {
      await recharger({ silencieux: true })
      afficherToast('Classement actualisé.')
    } catch (e) {
      afficherToast(e.message, 'erreur')
    } finally {
      setActualisation(false)
    }
  }

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Saison 2026</p>
          <h1 className="entete-page__titre">Classement</h1>
          <p className="entete-page__intro">
            Calculé à partir des matchs joués : victoire 3 pts, nul 1 pt, défaite 0. Égalité : différence de buts, puis
            buts marqués.
          </p>
        </div>
        <div className="entete-page__actions">
          {miseAJour && (
            <p className="mise-a-jour" aria-live="polite">
              Mis à jour à {FORMAT_HEURE.format(miseAJour)}
            </p>
          )}
          <Bouton variante="secondaire" icone="rafraichir" chargement={actualisation} libelleChargement="Actualisation…" onClick={actualiser}>
            Actualiser
          </Bouton>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}

      {chargement && !donnees ? (
        <SqueletteTableau lignes={10} />
      ) : (
        donnees && (
          <>
            <TableauClassement lignes={donnees} />
            <ul className="legende" aria-label="Légende">
              <li className="legende__element">
                <span className="legende__marque" style={{ background: 'var(--podium-or)' }} />
                1er
              </li>
              <li className="legende__element">
                <span className="legende__marque" style={{ background: 'var(--podium-argent)' }} />
                2e
              </li>
              <li className="legende__element">
                <span className="legende__marque" style={{ background: 'var(--podium-bronze)' }} />
                3e
              </li>
              <li className="legende__element">J : joués · G : gagnés · N : nuls · P : perdus · BP / BC : buts pour / contre</li>
            </ul>
          </>
        )
      )}
    </>
  )
}
