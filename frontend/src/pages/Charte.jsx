// Charte.jsx : vitrine du design system (route /charte, chargée en développement uniquement)
import { useState } from 'react'
import '../styles/charte.css'
import Bouton from '../components/Bouton.jsx'
import ChampFormulaire from '../components/ChampFormulaire.jsx'
import Ecusson from '../components/Ecusson.jsx'
import { BandeauErreur, EtatVide, SqueletteListe, SqueletteTableau } from '../components/Etats.jsx'
import { useToast } from '../components/Toast.jsx'
import useTitre from '../hooks/useTitre.js'

const NUANCES = [
  ['--vert', '#0B6E4F', 'Primaire · 6,2:1 sur blanc'],
  ['--vert-fonce', '#08392B', 'En-tête, pied de page'],
  ['--jaune', '#F2C400', 'Accent (fond uniquement)'],
  ['--fond', '#F6F8F7', 'Fond de page'],
  ['--encre', '#14201B', 'Texte · 16:1'],
  ['--encre-2', '#52605A', 'Texte secondaire · 5,9:1'],
  ['--bordure', '#D5DCD8', 'Séparateurs'],
  ['--bordure-champ', '#7A8A83', 'Contour des champs · 3,6:1'],
  ['--rouge', '#D62828', 'Carton rouge · 5:1'],
  ['--rouge-texte', '#B71F1F', 'Texte d’erreur · 5,6:1'],
  ['--succes', '#1E9E6A', 'Succès (remplissage)'],
  ['--succes-texte', '#157A52', 'Texte de succès · 5,3:1'],
]

const EQUIPES = [
  ['AS Tamdja', 'Vert et blanc'],
  ['FC Banengo', 'Rouge et noir'],
  ['Racing Djeleng', 'Bleu et blanc'],
  ['Étoile Kamkop', 'Jaune et vert'],
  ['Union Tougang', 'Orange et noir'],
  ['Olympique Famla', 'Blanc et rouge'],
  ['Sporting Ndiangdam', 'Violet et blanc'],
  ['Jeunesse Lafé', 'Bleu et jaune'],
  ['Canon Tchouaket', 'Vert et jaune'],
  ['Aigles Kouogouo', 'Noir et blanc'],
]

export default function Charte() {
  useTitre('Charte graphique')
  const { afficherToast } = useToast()
  const [envoi, setEnvoi] = useState(false)

  const simulerEnvoi = () => {
    setEnvoi(true)
    setTimeout(() => setEnvoi(false), 1500)
  }

  return (
    <div className="charte">
      <header className="entete-page">
        <div>
          <p className="surtitre">Design system</p>
          <h1 className="entete-page__titre">Charte graphique</h1>
          <p className="entete-page__intro">Jetons, composants de base et états. Page visible en développement uniquement.</p>
        </div>
      </header>

      <section aria-labelledby="t-couleurs">
        <h2 id="t-couleurs" className="section__titre">Couleurs</h2>
        <div className="charte__nuancier">
          {NUANCES.map(([nom, hex, role]) => (
            <div key={nom} className="carte charte__nuance">
              <div className="charte__echantillon" style={{ background: `var(${nom})` }} />
              <p>
                <strong>{hex}</strong>
                <br />
                <code>{nom}</code>
                <br />
                {role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="t-typo" className="charte__echelle">
        <h2 id="t-typo" className="section__titre">Typographie</h2>
        <p style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: 'var(--taille-3xl)' }}>48 · BARLOW CONDENSED</p>
        <p style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: 'var(--taille-2xl)' }}>32 · Titre de page</p>
        <p style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: 'var(--taille-xl)' }}>24 · Titre de section</p>
        <p style={{ fontSize: 'var(--taille-l)', fontWeight: 600 }}>20 · Inter, sous-titre</p>
        <p>16 · Inter, texte courant avec un interligne de 1,5 pour une lecture confortable.</p>
        <p style={{ fontSize: 'var(--taille-s)', color: 'var(--encre-2)' }}>14 · Texte secondaire : date, stade, aide.</p>
      </section>

      <section aria-labelledby="t-boutons">
        <h2 id="t-boutons" className="section__titre">Boutons</h2>
        <div className="charte__ligne">
          <Bouton icone="succes">Primaire</Bouton>
          <Bouton variante="secondaire">Secondaire</Bouton>
          <Bouton variante="fantome">Fantôme</Bouton>
          <Bouton variante="danger" icone="poubelle">Supprimer</Bouton>
          <Bouton chargement={envoi} onClick={simulerEnvoi} libelleChargement="Enregistrement…">
            Tester l’envoi
          </Bouton>
          <Bouton disabled>Désactivé</Bouton>
          <Bouton petit variante="secondaire" icone="rafraichir">Petit</Bouton>
        </div>
        <div className="charte__ligne charte__fonce zone-foncee">
          <Bouton variante="accent" icone="calendrier">Voir le calendrier</Bouton>
          <Bouton variante="clair">Sur fond foncé</Bouton>
        </div>
      </section>

      <section aria-labelledby="t-pastilles">
        <h2 id="t-pastilles" className="section__titre">Pastilles et cartons</h2>
        <div className="charte__ligne">
          <span className="pastille pastille--a-jouer"><span className="pastille__point" />À jouer</span>
          <span className="pastille pastille--termine"><span className="pastille__point" />Terminé</span>
          <span className="pastille">Journée 6</span>
          <span className="pastille pastille--erreur">Suspendu</span>
          <span className="pastille pastille--fonce">1er</span>
          <span className="carton carton--jaune" role="img" aria-label="Carton jaune" />
          <span className="carton carton--rouge" role="img" aria-label="Carton rouge" />
        </div>
        <div className="charte__ligne">
          {EQUIPES.map(([nom, couleurs]) => (
            <Ecusson key={nom} nom={nom} couleurs={couleurs} taille="l" />
          ))}
        </div>
      </section>

      <section aria-labelledby="t-cartes">
        <h2 id="t-cartes" className="section__titre">Carte</h2>
        <div className="grille">
          <article className="carte">
            <div className="carte__entete">
              <h3 className="carte__titre">Titre de carte</h3>
              <span className="pastille">Info</span>
            </div>
            <div className="carte__corps">Contenu de la carte, bordure fine et ombre très douce.</div>
          </article>
          <a href="#t-cartes" className="carte carte--lien carte__corps">
            Carte cliquable : bordure verte et ombre au survol comme au focus.
          </a>
        </div>
      </section>

      <section aria-labelledby="t-tableau">
        <h2 id="t-tableau" className="section__titre">Tableau</h2>
        <div className="tableau-conteneur">
          <table className="tableau">
            <caption>Exemple : en-têtes triables, podium, colonne figée</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col" className="gauche fige">Équipe</th>
                <th scope="col" aria-sort="none">
                  <button type="button" className="tableau__tri">J <span className="tableau__fleche" aria-hidden="true">▲</span></button>
                </th>
                <th scope="col" aria-sort="descending">
                  <button type="button" className="tableau__tri">Pts <span className="tableau__fleche" aria-hidden="true">▼</span></button>
                </th>
              </tr>
            </thead>
            <tbody>
              {EQUIPES.slice(0, 5).map(([nom, couleurs], i) => (
                <tr key={nom} className={i < 3 ? `ligne--tete ligne--podium-${i + 1}` : undefined}>
                  <td className="classement__rang">{i + 1}</td>
                  <th scope="row" className="gauche fige">
                    <span className="equipe-nom"><Ecusson nom={nom} couleurs={couleurs} taille="s" decoratif />{nom}</span>
                  </th>
                  <td>5</td>
                  <td className="classement__pts">{12 - i * 2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="t-champs">
        <h2 id="t-champs" className="section__titre">Champs</h2>
        <div className="grille">
          <ChampFormulaire id="c1" label="Nom d’utilisateur" aide="L’identifiant fourni par l’organisation." obligatoire />
          <ChampFormulaire id="c2" label="Score domicile" type="number" defaultValue="-1" erreur="Le score doit être un entier positif." />
          <ChampFormulaire id="c3" label="Journée" defaultValue="6">
            <option value="5">Journée 5</option>
            <option value="6">Journée 6</option>
          </ChampFormulaire>
        </div>
      </section>

      <section aria-labelledby="t-retours">
        <h2 id="t-retours" className="section__titre">Retours utilisateur</h2>
        <div className="charte__ligne">
          <Bouton variante="secondaire" onClick={() => afficherToast('Résultat enregistré : le classement est à jour.')}>Toast succès</Bouton>
          <Bouton variante="secondaire" onClick={() => afficherToast('Les buteurs (2-0) ne correspondent pas au score (3-0)', 'erreur')}>Toast erreur</Bouton>
        </div>
        <div className="grille">
          <SqueletteListe nombre={2} />
          <SqueletteTableau lignes={3} />
        </div>
        <br />
        <BandeauErreur message="Le serveur ne répond pas." onReessayer={() => {}} />
        <br />
        <EtatVide titre="Aucun match joué pour cette journée" texte="Les résultats apparaîtront ici dès leur saisie par l’organisation." />
      </section>
    </div>
  )
}
