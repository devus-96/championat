// TableauClassement.jsx : tableau du classement, trié en JavaScript au clic sur un en-tête
// (aria-sort sur le <th>, flèche ▲/▼). Variante « compacte » pour l'accueil (# / Équipe / J / Diff / Pts).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Ecusson from './Ecusson.jsx'

const COLONNES = [
  { cle: 'j', libelle: 'J', titre: 'Matchs joués' },
  { cle: 'g', libelle: 'G', titre: 'Gagnés' },
  { cle: 'n', libelle: 'N', titre: 'Nuls' },
  { cle: 'p', libelle: 'P', titre: 'Perdus' },
  { cle: 'bp', libelle: 'BP', titre: 'Buts pour' },
  { cle: 'bc', libelle: 'BC', titre: 'Buts contre' },
  { cle: 'diff', libelle: 'Diff', titre: 'Différence de buts' },
  { cle: 'pts', libelle: 'Pts', titre: 'Points' },
]
const COLONNES_COMPACTES = ['j', 'diff', 'pts']

/** Compare deux lignes sur une colonne ; le rang officiel départage les égalités. */
function comparer(a, b, colonne, ordre) {
  const sens = ordre === 'asc' ? 1 : -1
  let ecart
  if (colonne === 'nom') ecart = a.nom.localeCompare(b.nom, 'fr')
  else if (colonne === 'rang') ecart = a.rang - b.rang
  else ecart = a[colonne] - b[colonne]
  return ecart * sens || a.rang - b.rang
}

function signe(diff) {
  return diff > 0 ? `+${diff}` : String(diff)
}

export default function TableauClassement({ lignes, compact = false, legende = 'Classement général' }) {
  const [tri, setTri] = useState({ colonne: 'rang', ordre: 'asc' })

  const lignesTriees = useMemo(
    () => [...lignes].sort((a, b) => comparer(a, b, tri.colonne, tri.ordre)),
    [lignes, tri],
  )

  // Premier clic : ordre « naturel » de la colonne (décroissant pour les chiffres) ; second clic : inverse
  const trierPar = (colonne) => {
    setTri((actuel) => {
      if (actuel.colonne === colonne) return { colonne, ordre: actuel.ordre === 'asc' ? 'desc' : 'asc' }
      return { colonne, ordre: colonne === 'nom' || colonne === 'rang' || colonne === 'bc' ? 'asc' : 'desc' }
    })
  }

  const colonnes = compact ? COLONNES.filter((c) => COLONNES_COMPACTES.includes(c.cle)) : COLONNES

  // En-tête triable (bouton dans le <th>) ; en compact, en-têtes simples
  const entete = (cle, libelle, titre, className) => {
    if (compact) {
      return (
        <th key={cle} scope="col" className={className}>
          <abbr title={titre}>{libelle}</abbr>
        </th>
      )
    }
    const actif = tri.colonne === cle
    const ariaSort = actif ? (tri.ordre === 'asc' ? 'ascending' : 'descending') : 'none'
    return (
      <th key={cle} scope="col" className={className} aria-sort={ariaSort}>
        <button type="button" className="tableau__tri" onClick={() => trierPar(cle)} title={`Trier par ${titre.toLowerCase()}`}>
          {libelle}
          <span className="tableau__fleche" aria-hidden="true">
            {actif && tri.ordre === 'asc' ? '▲' : '▼'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div className="tableau-conteneur">
      <table className="tableau">
        <caption className={compact ? 'visuellement-cache' : undefined}>
          {legende}
          {!compact && ' : cliquez sur un en-tête pour trier'}
        </caption>
        <thead>
          <tr>
            {entete('rang', '#', 'Rang')}
            {entete('nom', 'Équipe', 'Nom', 'gauche fige')}
            {colonnes.map((c) => entete(c.cle, c.libelle, c.titre))}
          </tr>
        </thead>
        <tbody>
          {lignesTriees.map((l) => (
            <tr key={l.id} className={l.rang <= 3 ? `ligne--tete ligne--podium-${l.rang}` : undefined}>
              <td className="classement__rang">{l.rang}</td>
              <th scope="row" className="gauche fige">
                <Link to={`/equipes/${l.id}`} className="equipe-nom">
                  <Ecusson nom={l.nom} couleurs={l.couleurs} logo={l.logo} taille="s" decoratif />
                  <span className="equipe-nom__texte">{l.nom}</span>
                </Link>
              </th>
              {colonnes.map((c) => {
                if (c.cle === 'pts') return <td key="pts" className="classement__pts">{l.pts}</td>
                if (c.cle === 'diff') {
                  const classe = l.diff > 0 ? 'diff--positive' : l.diff < 0 ? 'diff--negative' : undefined
                  return <td key="diff" className={classe}>{signe(l.diff)}</td>
                }
                return <td key={c.cle}>{l[c.cle]}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
