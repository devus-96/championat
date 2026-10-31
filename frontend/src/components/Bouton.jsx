// Bouton.jsx : bouton du design system avec état « envoi en cours »
// variante : primaire | secondaire | accent | fantome | danger | clair
import Icone from './Icone.jsx'

export default function Bouton({
  variante = 'primaire',
  petit = false,
  bloc = false,
  icone,
  chargement = false,
  libelleChargement = 'Envoi…',
  type = 'button',
  className = '',
  disabled,
  children,
  ...attributs
}) {
  const classes = [
    'bouton',
    `bouton--${variante}`,
    petit && 'bouton--petit',
    bloc && 'bouton--bloc',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || chargement} aria-busy={chargement || undefined} {...attributs}>
      {chargement ? <span className="bouton__chargeur" aria-hidden="true" /> : icone && <Icone nom={icone} />}
      {chargement ? libelleChargement : children}
    </button>
  )
}
