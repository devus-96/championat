// Toast.jsx : équivalent des « messages flash » de Flask.
// Usage : const { afficherToast } = useToast(); afficherToast('Résultat enregistré', 'succes')
// - succès : role="status" (annoncé poliment) ; erreur : role="alert" (annoncé immédiatement)
// - disparaît après 5 s, se met en pause au survol / au focus, fermable au clavier.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icone from './Icone.jsx'

const DUREE_TOAST = 5000
const ContexteToast = createContext(null)

let compteur = 0

export function FournisseurToast({ children }) {
  const [toasts, setToasts] = useState([])

  const fermerToast = useCallback((id) => {
    setToasts((liste) => liste.filter((t) => t.id !== id))
  }, [])

  const afficherToast = useCallback((message, type = 'succes') => {
    compteur += 1
    const id = compteur
    setToasts((liste) => [...liste.slice(-2), { id, message, type }]) // 3 toasts maximum à l'écran
  }, [])

  return (
    <ContexteToast.Provider value={{ afficherToast }}>
      {children}
      {/* Région persistante : les lecteurs d'écran l'observent dès le chargement */}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <UnToast key={t.id} toast={t} onFermer={fermerToast} />
        ))}
      </div>
    </ContexteToast.Provider>
  )
}

function UnToast({ toast, onFermer }) {
  const minuterie = useRef(null)
  const fermer = useCallback(() => onFermer(toast.id), [onFermer, toast.id])

  const demarrer = useCallback(() => {
    clearTimeout(minuterie.current)
    minuterie.current = setTimeout(fermer, DUREE_TOAST)
  }, [fermer])

  const suspendre = () => clearTimeout(minuterie.current)

  useEffect(() => {
    demarrer()
    return suspendre
  }, [demarrer])

  const erreur = toast.type === 'erreur'
  return (
    <div
      className={`toast${erreur ? ' toast--erreur' : ''}`}
      role={erreur ? 'alert' : 'status'}
      onMouseEnter={suspendre}
      onMouseLeave={demarrer}
      onFocus={suspendre}
      onBlur={demarrer}
    >
      <Icone nom={erreur ? 'alerte' : 'succes'} className="toast__icone" />
      <p className="toast__texte">{toast.message}</p>
      <button type="button" className="bouton bouton--fantome bouton--icone toast__fermer" onClick={fermer}>
        <Icone nom="fermer" />
        <span className="visuellement-cache">Fermer le message</span>
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ContexteToast)
}
