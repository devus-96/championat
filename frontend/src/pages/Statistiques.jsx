// Statistiques.jsx : meilleure attaque, meilleure défense et joueurs suspendus (2 jaunes ou 1 rouge)
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, EtatVide, SqueletteListe } from '../components/Etats.jsx'
import Icone from '../components/Icone.jsx'
import useDonnees from '../hooks/useDonnees.js'
import useTitre from '../hooks/useTitre.js'

/** Carte « record » : une équipe et son chiffre clé. */
function CarteRecord({ titre, icone, equipe, valeur, unite }) {
  return (
    <article className="carte carte-record">
      <h2 className="carte-record__titre">
        <Icone nom={icone} />
        {titre}
      </h2>
      {equipe ? (
        <>
          <Link to={`/equipes/${equipe.id}`} className="equipe-nom carte-record__equipe">
            <Ecusson nom={equipe.nom} couleurs={equipe.couleurs} logo={equipe.logo} taille="l" decoratif />
            <span className="equipe-nom__texte">{equipe.nom}</span>
          </Link>
          <p className="carte-record__valeur chiffres">
            {valeur} <span>{unite}</span>
          </p>
          <p className="carte-record__detail">en {equipe.j} matchs</p>
        </>
      ) : (
        <p className="carte-record__detail">Aucun match joué</p>
      )}
    </article>
  )
}

export default function Statistiques() {
  useTitre('Statistiques')
  const { donnees, chargement, erreur, recharger } = useDonnees(api.statistiques)

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Saison 2026</p>
          <h1 className="entete-page__titre">Statistiques</h1>
          <p className="entete-page__intro">Records d’équipe et discipline.</p>
        </div>
      </header>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}
      {chargement && <SqueletteListe nombre={2} />}

      {donnees && !chargement && (
        <>
          <div className="grille section">
            <CarteRecord titre="Meilleure attaque" icone="ballon" equipe={donnees.meilleure_attaque} valeur={donnees.meilleure_attaque?.bp} unite="buts marqués" />
            <CarteRecord titre="Meilleure défense" icone="bouclier" equipe={donnees.meilleure_defense} valeur={donnees.meilleure_defense?.bc} unite="buts encaissés" />
          </div>

          <section className="section" aria-labelledby="titre-suspendus">
            <h2 id="titre-suspendus" className="section__titre">
              Joueurs suspendus <span className="pastille pastille--erreur">{donnees.suspendus.length}</span>
            </h2>
            <p className="entete-page__intro">Un joueur est suspendu après 2 cartons jaunes ou 1 carton rouge.</p>
            {donnees.suspendus.length ? (
              <div className="tableau-conteneur">
                <table className="tableau">
                  <caption className="visuellement-cache">Joueurs suspendus</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="gauche fige">Joueur</th>
                      <th scope="col" className="gauche">Équipe</th>
                      <th scope="col"><span className="carton carton--jaune" role="img" aria-label="Cartons jaunes" /></th>
                      <th scope="col"><span className="carton carton--rouge" role="img" aria-label="Cartons rouges" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {donnees.suspendus.map((j) => (
                      <tr key={j.id}>
                        <th scope="row" className="gauche fige">
                          {j.nom} <span className="texte-discret">n° {j.numero}</span>
                        </th>
                        <td className="gauche">
                          <Link to={`/equipes/${j.equipe_id}`} className="equipe-nom">
                            <Ecusson nom={j.equipe} couleurs={j.couleurs} taille="s" decoratif />
                            <span className="equipe-nom__texte">{j.equipe}</span>
                          </Link>
                        </td>
                        <td className="fort">{j.jaunes}</td>
                        <td className="fort">{j.rouges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EtatVide titre="Aucun joueur suspendu" />
            )}
          </section>
        </>
      )}
    </>
  )
}
