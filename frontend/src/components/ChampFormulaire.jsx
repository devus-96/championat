// ChampFormulaire.jsx : <label> + contrôle + aide + message d'erreur, reliés pour l'accessibilité
// (htmlFor, aria-describedby, aria-invalid). Le contrôle est un <input> par défaut,
// ou un <select> si des « options » sont fournies (enfants <option>).
import { forwardRef } from 'react'
import Icone from './Icone.jsx'

const ChampFormulaire = forwardRef(function ChampFormulaire(
  { id, label, aide, erreur, obligatoire = false, children, className = '', labelCache = false, ...attributs },
  ref,
) {
  const idAide = aide ? `${id}-aide` : null
  const idErreur = erreur ? `${id}-erreur` : null
  const decritPar = [idErreur, idAide].filter(Boolean).join(' ') || undefined

  const proprietes = {
    id,
    ref,
    className: 'champ__controle',
    'aria-invalid': erreur ? 'true' : undefined,
    'aria-describedby': decritPar,
    required: obligatoire || undefined,
    ...attributs,
  }

  return (
    <div className={`champ ${className}`.trim()}>
      <label htmlFor={id} className={labelCache ? 'visuellement-cache' : 'champ__label'}>
        {label}
        {obligatoire && (
          <span className="champ__obligatoire" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children ? <select {...proprietes}>{children}</select> : <input {...proprietes} />}
      {erreur && (
        <p id={idErreur} className="champ__erreur">
          <Icone nom="alerte" />
          {erreur}
        </p>
      )}
      {aide && (
        <p id={idAide} className="champ__aide">
          {aide}
        </p>
      )}
    </div>
  )
})

export default ChampFormulaire
