// Etats.jsx : composants d'état réutilisés par toutes les pages
// - Squelettes de chargement (jamais d'écran blanc)
// - État vide avec illustration
// - Bandeau d'erreur avec bouton « Réessayer »
import Icone from './Icone.jsx'

/** Liste de blocs gris animés (cartes de match, cartes d'équipe…). */
export function SqueletteListe({ nombre = 3, hauteur = 'bloc', libelle = 'Chargement…' }) {
  return (
    <div className="squelette-liste" role="status" aria-label={libelle}>
      {Array.from({ length: nombre }, (_, i) => (
        <span key={i} className={`squelette squelette--${hauteur}`} />
      ))}
    </div>
  )
}

/** Imitation d'un tableau : une ligne d'en-tête puis des lignes. */
export function SqueletteTableau({ lignes = 6, libelle = 'Chargement du tableau…' }) {
  return (
    <div className="squelette-tableau" role="status" aria-label={libelle}>
      {Array.from({ length: lignes + 1 }, (_, i) => (
        <span key={i} className="squelette squelette--ligne" />
      ))}
    </div>
  )
}

/** Illustration simple : un ballon posé sur une ligne de terrain. Décorative. */
function IllustrationTerrain() {
  return (
    <svg className="etat-vide__illustration" viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      <rect x="4" y="8" width="88" height="48" rx="4" fill="#e3f1eb" stroke="#0b6e4f" strokeWidth="2" />
      <path d="M48 8v48" stroke="#0b6e4f" strokeWidth="2" />
      <circle cx="48" cy="32" r="10" fill="none" stroke="#0b6e4f" strokeWidth="2" />
      <rect x="4" y="22" width="10" height="20" fill="none" stroke="#0b6e4f" strokeWidth="2" />
      <rect x="82" y="22" width="10" height="20" fill="none" stroke="#0b6e4f" strokeWidth="2" />
      <circle cx="66" cy="44" r="7" fill="#fff" stroke="#14201b" strokeWidth="2" />
      <path d="m66 40 3 2-1 3h-4l-1-3Z" fill="#14201b" />
    </svg>
  )
}

/** Message utile quand une liste est vide. */
export function EtatVide({ titre, texte, children }) {
  return (
    <div className="etat-vide">
      <IllustrationTerrain />
      <p className="etat-vide__titre">{titre}</p>
      {texte && <p className="etat-vide__texte">{texte}</p>}
      {children}
    </div>
  )
}

/** Bandeau d'erreur clair avec bouton « Réessayer » (relance le fetch). */
export function BandeauErreur({ message, onReessayer }) {
  return (
    <div className="bandeau-erreur" role="alert">
      <Icone nom="alerte" className="bandeau-erreur__icone" />
      <p className="bandeau-erreur__texte">
        <strong>Impossible de charger les données.</strong> {message}
      </p>
      {onReessayer && (
        <button type="button" className="bouton bouton--secondaire bouton--petit" onClick={onReessayer}>
          <Icone nom="rafraichir" />
          Réessayer
        </button>
      )}
    </div>
  )
}
