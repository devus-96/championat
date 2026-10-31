// SaisieResultat.jsx : formulaire de résultat d'un match (score + buteurs + cartons)
// Vérification JavaScript avant envoi : scores entiers 0–30, un buteur par but marqué (R3),
// joueur choisi, minutes 1–120. Le serveur revérifie tout ; son message s'affiche en toast.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formaterDate } from '../../api.js'
import Bouton from '../../components/Bouton.jsx'
import ChampFormulaire from '../../components/ChampFormulaire.jsx'
import Ecusson from '../../components/Ecusson.jsx'
import { BandeauErreur, SqueletteListe } from '../../components/Etats.jsx'
import Icone from '../../components/Icone.jsx'
import { useToast } from '../../components/Toast.jsx'
import useDonnees from '../../hooks/useDonnees.js'
import useTitre from '../../hooks/useTitre.js'
import NotFound from '../NotFound.jsx'

const SCORE_MAX = 30
const COTES = ['dom', 'ext']

let compteurLignes = 0
const nouvelleCle = () => ++compteurLignes

/** Match + effectifs des deux équipes (pour les listes de joueurs). */
async function chargerSaisie(id) {
  const match = await api.match(id)
  const [dom, ext] = await Promise.all([api.equipe(match.equipe_dom_id), api.equipe(match.equipe_ext_id)])
  return { match, joueurs: { dom: dom.joueurs, ext: ext.joueurs } }
}

/** État initial du formulaire : vide, ou pré-rempli avec le résultat existant (correction). */
function etatInitial(match) {
  const cote = (equipeId) => (equipeId === match.equipe_dom_id ? 'dom' : 'ext')
  return {
    scores: { dom: match.joue ? String(match.score_dom) : '', ext: match.joue ? String(match.score_ext) : '' },
    buts: match.buts.map((b) => ({ cle: nouvelleCle(), cote: cote(b.equipe_id), joueur_id: String(b.joueur_id), minute: String(b.minute) })),
    cartons: match.cartons.map((c) => ({
      cle: nouvelleCle(),
      cote: cote(c.equipe_id),
      joueur_id: String(c.joueur_id),
      couleur: c.couleur,
      minute: String(c.minute),
    })),
  }
}

/** Entier strict dans [mini, maxi] (refuse « 1.5 », « », « -2 »). */
function entierValide(texte, mini, maxi) {
  if (!/^\d+$/.test(texte)) return false
  const n = Number(texte)
  return n >= mini && n <= maxi
}

/** Vérifie le formulaire ; renvoie un objet { idDuChamp: message } (vide si tout est correct). */
function verifier(formulaire, noms) {
  const erreurs = {}
  for (const cote of COTES) {
    const score = formulaire.scores[cote]
    if (!entierValide(score, 0, SCORE_MAX)) {
      erreurs[`score-${cote}`] = `Score entier entre 0 et ${SCORE_MAX}.`
      continue
    }
    const nbButs = formulaire.buts.filter((b) => b.cote === cote).length
    if (nbButs !== Number(score)) {
      erreurs[`buteurs-${cote}`] = `${noms[cote]} a marqué ${score} but(s) : il faut ${score} buteur(s), il y en a ${nbButs}.`
    }
  }
  for (const b of formulaire.buts) {
    if (!b.joueur_id) erreurs[`but-${b.cle}-joueur`] = 'Choisissez le buteur.'
    if (!entierValide(b.minute, 1, 120)) erreurs[`but-${b.cle}-minute`] = 'Minute entre 1 et 120.'
  }
  for (const c of formulaire.cartons) {
    if (!c.joueur_id) erreurs[`carton-${c.cle}-joueur`] = 'Choisissez le joueur.'
    if (!entierValide(c.minute, 1, 120)) erreurs[`carton-${c.cle}-minute`] = 'Minute entre 1 et 120.'
  }
  // Un seul carton rouge par joueur et par match (même règle que le serveur)
  const rouges = formulaire.cartons.filter((c) => c.couleur === 'rouge' && c.joueur_id)
  rouges.forEach((c, i) => {
    if (rouges.findIndex((x) => x.joueur_id === c.joueur_id) !== i) erreurs[`carton-${c.cle}-joueur`] = 'Ce joueur a déjà un carton rouge.'
  })
  return erreurs
}

/** Options du <select> joueur : « 9 · Nom (Poste) ». */
function OptionsJoueurs({ joueurs }) {
  return (
    <>
      <option value="">— Choisir —</option>
      {joueurs.map((j) => (
        <option key={j.id} value={j.id}>
          {j.numero} · {j.nom} ({j.poste})
        </option>
      ))}
    </>
  )
}

/** Colonne d'une équipe : score, buteurs, cartons. */
function ColonneEquipe({ cote, nom, couleurs, joueurs, formulaire, erreurs, actions }) {
  const buts = formulaire.buts.filter((b) => b.cote === cote)
  const cartons = formulaire.cartons.filter((c) => c.cote === cote)
  const score = Number(formulaire.scores[cote]) || 0

  return (
    <fieldset className="carte saisie__colonne">
      <legend className="saisie__equipe">
        <Ecusson nom={nom} couleurs={couleurs} taille="l" decoratif />
        <span>
          <span className="surtitre">{cote === 'dom' ? 'Domicile' : 'Extérieur'}</span>
          {nom}
        </span>
      </legend>

      <ChampFormulaire
        id={`score-${cote}`}
        label={`Score de ${nom}`}
        type="number"
        inputMode="numeric"
        min="0"
        max={SCORE_MAX}
        className="saisie__score"
        value={formulaire.scores[cote]}
        onChange={(e) => actions.changerScore(cote, e.target.value)}
        erreur={erreurs[`score-${cote}`]}
        obligatoire
      />

      <div className="saisie__groupe">
        <h3 className="saisie__sous-titre">
          <Icone nom="ballon" />
          Buteurs <span className="pastille chiffres">{buts.length} / {score}</span>
        </h3>
        {erreurs[`buteurs-${cote}`] && (
          <p id={`buteurs-${cote}`} className="champ__erreur" tabIndex={-1}>
            <Icone nom="alerte" />
            {erreurs[`buteurs-${cote}`]}
          </p>
        )}
        {buts.map((b, i) => (
          <div key={b.cle} className="saisie__ligne">
            <ChampFormulaire
              id={`but-${b.cle}-joueur`}
              label={`Buteur n° ${i + 1}`}
              value={b.joueur_id}
              onChange={(e) => actions.modifierLigne('buts', b.cle, 'joueur_id', e.target.value)}
              erreur={erreurs[`but-${b.cle}-joueur`]}
            >
              <OptionsJoueurs joueurs={joueurs} />
            </ChampFormulaire>
            <ChampFormulaire
              id={`but-${b.cle}-minute`}
              label="Minute"
              type="number"
              inputMode="numeric"
              min="1"
              max="120"
              className="saisie__minute"
              value={b.minute}
              onChange={(e) => actions.modifierLigne('buts', b.cle, 'minute', e.target.value)}
              erreur={erreurs[`but-${b.cle}-minute`]}
            />
            <Bouton variante="fantome" className="bouton--icone saisie__retirer" onClick={() => actions.retirerLigne('buts', b.cle)}>
              <Icone nom="poubelle" />
              <span className="visuellement-cache">Retirer le buteur n° {i + 1}</span>
            </Bouton>
          </div>
        ))}
        <Bouton variante="secondaire" petit icone="plus" onClick={() => actions.ajouterBut(cote)}>
          Ajouter un buteur
        </Bouton>
      </div>

      <div className="saisie__groupe">
        <h3 className="saisie__sous-titre">
          <span className="carton carton--jaune" aria-hidden="true" />
          Cartons <span className="pastille chiffres">{cartons.length}</span>
        </h3>
        {cartons.map((c, i) => (
          <div key={c.cle} className="saisie__ligne saisie__ligne--carton">
            <ChampFormulaire
              id={`carton-${c.cle}-joueur`}
              label={`Joueur sanctionné n° ${i + 1}`}
              value={c.joueur_id}
              onChange={(e) => actions.modifierLigne('cartons', c.cle, 'joueur_id', e.target.value)}
              erreur={erreurs[`carton-${c.cle}-joueur`]}
            >
              <OptionsJoueurs joueurs={joueurs} />
            </ChampFormulaire>
            <ChampFormulaire
              id={`carton-${c.cle}-couleur`}
              label="Couleur"
              value={c.couleur}
              onChange={(e) => actions.modifierLigne('cartons', c.cle, 'couleur', e.target.value)}
            >
              <option value="jaune">Jaune</option>
              <option value="rouge">Rouge</option>
            </ChampFormulaire>
            <ChampFormulaire
              id={`carton-${c.cle}-minute`}
              label="Minute"
              type="number"
              inputMode="numeric"
              min="1"
              max="120"
              className="saisie__minute"
              value={c.minute}
              onChange={(e) => actions.modifierLigne('cartons', c.cle, 'minute', e.target.value)}
              erreur={erreurs[`carton-${c.cle}-minute`]}
            />
            <Bouton variante="fantome" className="bouton--icone saisie__retirer" onClick={() => actions.retirerLigne('cartons', c.cle)}>
              <Icone nom="poubelle" />
              <span className="visuellement-cache">Retirer le carton n° {i + 1}</span>
            </Bouton>
          </div>
        ))}
        <Bouton variante="secondaire" petit icone="plus" onClick={() => actions.ajouterCarton(cote)}>
          Ajouter un carton
        </Bouton>
      </div>
    </fieldset>
  )
}

export default function SaisieResultat() {
  const { id } = useParams()
  const { donnees, chargement, erreur, recharger } = useDonnees(() => chargerSaisie(id), [id])
  const [formulaire, setFormulaire] = useState(null)
  const [erreurs, setErreurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const naviguer = useNavigate()
  const { afficherToast } = useToast()
  const m = donnees?.match
  useTitre(m ? `Résultat : ${m.equipe_dom} – ${m.equipe_ext}` : 'Saisie de résultat')

  useEffect(() => {
    if (m) setFormulaire(etatInitial(m))
  }, [m])

  if (erreur === 'Match introuvable') return <NotFound />

  // Toute modification efface l'erreur du champ concerné (et le contrôle buteurs/score de l'équipe)
  const effacer = (...ids) => setErreurs((er) => (ids.some((x) => er[x]) ? { ...er, ...Object.fromEntries(ids.map((x) => [x, null])) } : er))

  const actions = {
    changerScore: (cote, valeur) => {
      setFormulaire((f) => ({ ...f, scores: { ...f.scores, [cote]: valeur } }))
      effacer(`score-${cote}`, `buteurs-${cote}`)
    },
    ajouterBut: (cote) => {
      setFormulaire((f) => ({ ...f, buts: [...f.buts, { cle: nouvelleCle(), cote, joueur_id: '', minute: '' }] }))
      effacer(`buteurs-${cote}`)
    },
    ajouterCarton: (cote) =>
      setFormulaire((f) => ({ ...f, cartons: [...f.cartons, { cle: nouvelleCle(), cote, joueur_id: '', couleur: 'jaune', minute: '' }] })),
    modifierLigne: (liste, cle, champ, valeur) => {
      setFormulaire((f) => ({ ...f, [liste]: f[liste].map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)) }))
      effacer(`${liste === 'buts' ? 'but' : 'carton'}-${cle}-${champ === 'joueur_id' ? 'joueur' : champ}`)
    },
    retirerLigne: (liste, cle) => {
      const cote = formulaire[liste].find((l) => l.cle === cle)?.cote
      setFormulaire((f) => ({ ...f, [liste]: f[liste].filter((l) => l.cle !== cle) }))
      if (liste === 'buts') effacer(`buteurs-${cote}`)
    },
  }

  const soumettre = async (e) => {
    e.preventDefault()
    const trouvees = verifier(formulaire, { dom: m.equipe_dom, ext: m.equipe_ext })
    setErreurs(trouvees)
    const premiere = Object.keys(trouvees)[0]
    if (premiere) {
      afficherToast('Le formulaire contient des erreurs : corrigez les champs signalés.', 'erreur')
      // Le focus va sur le premier champ en erreur (après le rendu des messages)
      setTimeout(() => document.getElementById(premiere)?.focus(), 0)
      return
    }

    setEnvoi(true)
    try {
      await api.saisirResultat(m.id, {
        score_dom: Number(formulaire.scores.dom),
        score_ext: Number(formulaire.scores.ext),
        buts: formulaire.buts.map((b) => ({ joueur_id: Number(b.joueur_id), minute: Number(b.minute) })),
        cartons: formulaire.cartons.map((c) => ({ joueur_id: Number(c.joueur_id), couleur: c.couleur, minute: Number(c.minute) })),
      })
      afficherToast(`Résultat enregistré : ${m.equipe_dom} ${formulaire.scores.dom} – ${formulaire.scores.ext} ${m.equipe_ext}. Le classement est à jour.`)
      naviguer('/admin/matchs')
    } catch (err) {
      afficherToast(err.message, 'erreur') // message du serveur (ex. R3, R4)
      setEnvoi(false)
    }
  }

  return (
    <>
      <Link to="/admin/matchs" className="retour">
        <Icone nom="fleche-gauche" />
        Retour aux matchs
      </Link>

      {erreur && <BandeauErreur message={erreur} onReessayer={() => recharger().catch(() => {})} />}
      {(chargement || (m && !formulaire)) && <SqueletteListe nombre={2} libelle="Chargement du match…" />}

      {m && formulaire && !chargement && (
        <>
          <header className="entete-page">
            <div>
              <p className="surtitre">
                Journée {m.journee} · {formaterDate(m.date_match, true)} · {m.stade}
              </p>
              <h1 className="entete-page__titre">
                {m.equipe_dom} – {m.equipe_ext}
              </h1>
              <p className="entete-page__intro">
                {m.joue
                  ? 'Ce match a déjà un résultat : l’enregistrement remplacera le score, les buteurs et les cartons.'
                  : 'Saisissez le score, puis un buteur pour chaque but marqué.'}
              </p>
            </div>
            {m.joue ? <span className="pastille pastille--termine"><span className="pastille__point" />Déjà saisi</span> : null}
          </header>

          <form onSubmit={soumettre} noValidate>
            <div className="saisie">
              {COTES.map((cote) => (
                <ColonneEquipe
                  key={cote}
                  cote={cote}
                  nom={m[`equipe_${cote}`]}
                  couleurs={m[`couleurs_${cote}`]}
                  joueurs={donnees.joueurs[cote]}
                  formulaire={formulaire}
                  erreurs={erreurs}
                  actions={actions}
                />
              ))}
            </div>
            <div className="formulaire__actions saisie__actions">
              <Bouton type="submit" icone="succes" chargement={envoi} libelleChargement="Enregistrement…">
                Enregistrer le résultat
              </Bouton>
              <Link to="/admin/matchs" className="bouton bouton--fantome">
                Annuler
              </Link>
            </div>
          </form>
        </>
      )}
    </>
  )
}
