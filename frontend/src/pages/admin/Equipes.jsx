// Equipes.jsx (admin) : gestion des équipes et de leurs joueurs (ajout, modification, suppression en POST)
// Une équipe sélectionnée (?equipe=ID) affiche son effectif sous la liste des équipes.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import Bouton from '../../components/Bouton.jsx'
import ChampFormulaire from '../../components/ChampFormulaire.jsx'
import Ecusson from '../../components/Ecusson.jsx'
import { BandeauErreur, SqueletteTableau } from '../../components/Etats.jsx'
import { useToast } from '../../components/Toast.jsx'
import useDonnees from '../../hooks/useDonnees.js'
import useTitre from '../../hooks/useTitre.js'
import { POSTES } from '../Equipe.jsx'

const EQUIPE_VIDE = { nom: '', quartier: '', entraineur: '', couleurs: '', logo: '' }
const JOUEUR_VIDE = { nom: '', numero: '', poste: 'Milieu', date_naissance: '' }
const AUJOURDHUI = new Date().toISOString().slice(0, 10)

/** Vérifications JavaScript des formulaires (le serveur revérifie). */
function verifierEquipe(v) {
  const er = {}
  for (const [cle, libelle] of [['nom', 'Le nom'], ['quartier', 'Le quartier'], ['entraineur', 'L’entraîneur'], ['couleurs', 'Les couleurs']]) {
    if (!v[cle].trim()) er[cle] = `${libelle} est obligatoire.`
    else if (v[cle].trim().length > 80) er[cle] = '80 caractères maximum.'
  }
  if (v.logo.trim() && !/^[\w-]+\.(png|jpg|jpeg|svg|webp)$/.test(v.logo.trim())) er.logo = 'Nom de fichier du type « logo.png ».'
  return er
}

function verifierJoueur(v) {
  const er = {}
  if (!v.nom.trim()) er.nom = 'Le nom est obligatoire.'
  if (!/^\d+$/.test(v.numero) || Number(v.numero) < 1 || Number(v.numero) > 99) er.numero = 'Numéro entre 1 et 99.'
  if (!v.date_naissance) er.date_naissance = 'La date de naissance est obligatoire.'
  else if (v.date_naissance >= AUJOURDHUI) er.date_naissance = 'La date doit être dans le passé.'
  return er
}

/**
 * Formulaire générique (équipe ou joueur) : champs contrôlés, vérification, envoi, erreurs.
 * champs : [{ cle, label, type?, options?, aide? }]
 */
function Formulaire({ prefixe, titre, initial, champs, verifier, envoyer, onTermine, onAnnuler, libelleEnvoi }) {
  const [valeurs, setValeurs] = useState(initial)
  const [erreurs, setErreurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const { afficherToast } = useToast()

  const modifier = (cle) => (e) => {
    setValeurs((v) => ({ ...v, [cle]: e.target.value }))
    if (erreurs[cle]) setErreurs((er) => ({ ...er, [cle]: null }))
  }

  const soumettre = async (e) => {
    e.preventDefault()
    const er = verifier(valeurs)
    setErreurs(er)
    const premiere = Object.keys(er)[0]
    if (premiere) return document.getElementById(`${prefixe}-${premiere}`)?.focus()
    setEnvoi(true)
    try {
      await envoyer(valeurs)
      onTermine()
    } catch (err) {
      afficherToast(err.message, 'erreur')
      setEnvoi(false)
    }
  }

  return (
    <form className="carte formulaire-admin" onSubmit={soumettre} noValidate>
      <h3 className="carte__entete carte__titre">{titre}</h3>
      <div className="carte__corps formulaire formulaire-admin__champs">
        {champs.map((c) => (
          <ChampFormulaire
            key={c.cle}
            id={`${prefixe}-${c.cle}`}
            label={c.label}
            type={c.type}
            aide={c.aide}
            obligatoire={!c.facultatif}
            value={valeurs[c.cle]}
            onChange={modifier(c.cle)}
            erreur={erreurs[c.cle]}
            {...c.attributs}
          >
            {c.options?.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </ChampFormulaire>
        ))}
      </div>
      <div className="carte__pied formulaire__actions">
        <Bouton type="submit" chargement={envoi} libelleChargement="Enregistrement…">
          {libelleEnvoi}
        </Bouton>
        <Bouton variante="fantome" onClick={onAnnuler}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}

export default function EquipesAdmin() {
  useTitre('Équipes et joueurs')
  const [parametres, setParametres] = useSearchParams()
  const equipeId = Number(parametres.get('equipe')) || null
  const equipes = useDonnees(api.equipes)
  const effectif = useDonnees(() => (equipeId ? api.equipe(equipeId) : Promise.resolve(null)), [equipeId])
  // Formulaire ouvert : { type: 'equipe' | 'joueur', objet: null (ajout) | ligne à modifier }
  const [edition, setEdition] = useState(null)
  const { afficherToast } = useToast()

  const choisirEquipe = (id) => {
    setEdition(null)
    setParametres(id ? { equipe: String(id) } : {})
  }

  const supprimer = async (type, objet) => {
    const question =
      type === 'equipe'
        ? `Supprimer l’équipe « ${objet.nom} », ses joueurs et ses matchs non joués ?`
        : `Supprimer le joueur « ${objet.nom} » (n° ${objet.numero}) ?`
    if (!window.confirm(question)) return
    try {
      if (type === 'equipe') {
        await api.supprimerEquipe(objet.id)
        if (objet.id === equipeId) choisirEquipe(null)
        await equipes.recharger({ silencieux: true })
      } else {
        await api.supprimerJoueur(objet.id)
        await effectif.recharger({ silencieux: true })
      }
      afficherToast(`${type === 'equipe' ? 'Équipe' : 'Joueur'} « ${objet.nom} » supprimé.`)
    } catch (err) {
      afficherToast(err.message, 'erreur')
    }
  }

  const apresEquipe = async (message) => {
    setEdition(null)
    afficherToast(message)
    await equipes.recharger({ silencieux: true }).catch(() => {})
    if (equipeId) effectif.recharger({ silencieux: true }).catch(() => {})
  }

  const apresJoueur = async (message) => {
    setEdition(null)
    afficherToast(message)
    await effectif.recharger({ silencieux: true }).catch(() => {})
  }

  const equipe = effectif.donnees
  const champsEquipe = [
    { cle: 'nom', label: 'Nom de l’équipe', attributs: { maxLength: 80 } },
    { cle: 'quartier', label: 'Quartier', attributs: { maxLength: 80 } },
    { cle: 'entraineur', label: 'Entraîneur', attributs: { maxLength: 80 } },
    { cle: 'couleurs', label: 'Couleurs', aide: 'Exemple : « Vert et blanc » (sert aussi à dessiner l’écusson).', attributs: { maxLength: 80 } },
    { cle: 'logo', label: 'Fichier logo', facultatif: true, aide: 'Facultatif : image placée dans static/images.' },
  ]
  const champsJoueur = [
    { cle: 'nom', label: 'Nom du joueur', attributs: { maxLength: 80, autoComplete: 'off' } },
    { cle: 'numero', label: 'Numéro de maillot', type: 'number', attributs: { min: 1, max: 99, inputMode: 'numeric' } },
    { cle: 'poste', label: 'Poste', options: POSTES.map((p) => [p, p]) },
    { cle: 'date_naissance', label: 'Date de naissance', type: 'date', attributs: { max: AUJOURDHUI } },
    ...(edition?.objet && equipes.donnees
      ? [{ cle: 'equipe_id', label: 'Équipe', aide: 'Changer pour transférer le joueur.', options: equipes.donnees.map((e) => [String(e.id), e.nom]) }]
      : []),
  ]

  return (
    <>
      <header className="entete-page">
        <div>
          <p className="surtitre">Administration</p>
          <h1 className="entete-page__titre">Équipes et joueurs</h1>
        </div>
        <div className="entete-page__actions">
          <Bouton icone="plus" onClick={() => setEdition({ type: 'equipe', objet: null })}>
            Nouvelle équipe
          </Bouton>
        </div>
      </header>

      {edition?.type === 'equipe' && (
        <Formulaire
          key={edition.objet?.id ?? 'nouvelle'}
          prefixe="equipe"
          titre={edition.objet ? `Modifier « ${edition.objet.nom} »` : 'Nouvelle équipe'}
          initial={edition.objet ? { ...EQUIPE_VIDE, ...edition.objet, logo: edition.objet.logo ?? '' } : EQUIPE_VIDE}
          champs={champsEquipe}
          verifier={verifierEquipe}
          envoyer={(v) => (edition.objet ? api.modifierEquipe(edition.objet.id, v) : api.ajouterEquipe(v))}
          onTermine={() => apresEquipe(edition.objet ? 'Équipe modifiée.' : 'Équipe ajoutée.')}
          onAnnuler={() => setEdition(null)}
          libelleEnvoi={edition.objet ? 'Enregistrer' : 'Ajouter l’équipe'}
        />
      )}

      {equipes.erreur && <BandeauErreur message={equipes.erreur} onReessayer={() => equipes.recharger().catch(() => {})} />}

      <section className="section" aria-labelledby="titre-liste-equipes">
        <h2 id="titre-liste-equipes" className="section__titre">Équipes</h2>
        {equipes.chargement ? (
          <SqueletteTableau lignes={6} />
        ) : (
          <div className="tableau-conteneur">
            <table className="tableau">
              <caption className="visuellement-cache">Liste des équipes</caption>
              <thead>
                <tr>
                  <th scope="col" className="gauche fige">Équipe</th>
                  <th scope="col" className="gauche">Quartier</th>
                  <th scope="col" className="gauche">Entraîneur</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipes.donnees?.map((e) => (
                  <tr key={e.id} className={e.id === equipeId ? 'ligne--selectionnee' : undefined}>
                    <th scope="row" className="gauche fige">
                      <span className="equipe-nom">
                        <Ecusson nom={e.nom} couleurs={e.couleurs} logo={e.logo} taille="s" decoratif />
                        <span className="equipe-nom__texte">{e.nom}</span>
                      </span>
                    </th>
                    <td className="gauche">{e.quartier}</td>
                    <td className="gauche">{e.entraineur}</td>
                    <td>
                      <span className="actions-ligne">
                        <Bouton
                          variante={e.id === equipeId ? 'primaire' : 'secondaire'}
                          petit
                          icone="equipes"
                          aria-pressed={e.id === equipeId}
                          onClick={() => choisirEquipe(e.id === equipeId ? null : e.id)}
                        >
                          Joueurs<span className="visuellement-cache"> de {e.nom}</span>
                        </Bouton>
                        <Bouton variante="fantome" petit icone="crayon" onClick={() => setEdition({ type: 'equipe', objet: e })}>
                          Modifier<span className="visuellement-cache"> {e.nom}</span>
                        </Bouton>
                        <Bouton variante="danger" petit icone="poubelle" onClick={() => supprimer('equipe', e)}>
                          Supprimer<span className="visuellement-cache"> {e.nom}</span>
                        </Bouton>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {equipeId && (
        <section className="section" aria-labelledby="titre-effectif-admin">
          <div className="section__entete">
            <h2 id="titre-effectif-admin" className="section__titre">
              Joueurs {equipe ? `· ${equipe.nom}` : ''}
              {equipe && <span className="pastille">{equipe.joueurs.length}</span>}
            </h2>
            <Bouton variante="secondaire" icone="plus" onClick={() => setEdition({ type: 'joueur', objet: null })} disabled={!equipe}>
              Nouveau joueur
            </Bouton>
          </div>

          {edition?.type === 'joueur' && equipe && (
            <Formulaire
              key={edition.objet?.id ?? 'nouveau'}
              prefixe="joueur"
              titre={edition.objet ? `Modifier « ${edition.objet.nom} »` : `Nouveau joueur · ${equipe.nom}`}
              initial={
                edition.objet
                  ? { ...edition.objet, numero: String(edition.objet.numero), equipe_id: String(equipe.id) }
                  : { ...JOUEUR_VIDE, equipe_id: String(equipe.id) }
              }
              champs={champsJoueur}
              verifier={verifierJoueur}
              envoyer={(v) => {
                const corps = { ...v, numero: Number(v.numero), equipe_id: Number(v.equipe_id) }
                return edition.objet ? api.modifierJoueur(edition.objet.id, corps) : api.ajouterJoueur(corps)
              }}
              onTermine={() => apresJoueur(edition.objet ? 'Joueur modifié.' : 'Joueur ajouté.')}
              onAnnuler={() => setEdition(null)}
              libelleEnvoi={edition.objet ? 'Enregistrer' : 'Ajouter le joueur'}
            />
          )}

          {effectif.erreur && <BandeauErreur message={effectif.erreur} onReessayer={() => effectif.recharger().catch(() => {})} />}
          {effectif.chargement ? (
            <SqueletteTableau lignes={8} />
          ) : (
            equipe && (
              <div className="tableau-conteneur">
                <table className="tableau">
                  <caption className="visuellement-cache">Joueurs de {equipe.nom}</caption>
                  <thead>
                    <tr>
                      <th scope="col">N°</th>
                      <th scope="col" className="gauche fige">Joueur</th>
                      <th scope="col" className="gauche">Poste</th>
                      <th scope="col">Naissance</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipe.joueurs.map((j) => (
                      <tr key={j.id}>
                        <td className="fort">{j.numero}</td>
                        <th scope="row" className="gauche fige">{j.nom}</th>
                        <td className="gauche">{j.poste}</td>
                        <td>{j.date_naissance.split('-').reverse().join('/')}</td>
                        <td>
                          <span className="actions-ligne">
                            <Bouton variante="fantome" petit icone="crayon" onClick={() => setEdition({ type: 'joueur', objet: j })}>
                              Modifier<span className="visuellement-cache"> {j.nom}</span>
                            </Bouton>
                            <Bouton variante="danger" petit icone="poubelle" onClick={() => supprimer('joueur', j)}>
                              Supprimer<span className="visuellement-cache"> {j.nom}</span>
                            </Bouton>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      )}
    </>
  )
}
