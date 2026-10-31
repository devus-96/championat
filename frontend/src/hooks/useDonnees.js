// useDonnees.js : charge des données via une fonction de api.js et expose
// { donnees, chargement, erreur, recharger } pour afficher squelette / erreur / contenu.
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useDonnees(charger, dependances = []) {
  const [etat, setEtat] = useState({ donnees: null, chargement: true, erreur: null })
  const requete = useRef(0) // ignore les réponses d'un ancien appel (changement de journée rapide)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recharger = useCallback(async ({ silencieux = false } = {}) => {
    const numero = ++requete.current
    if (!silencieux) setEtat((e) => ({ ...e, chargement: true, erreur: null }))
    try {
      const donnees = await charger()
      if (numero === requete.current) setEtat({ donnees, chargement: false, erreur: null })
      return donnees
    } catch (e) {
      if (numero === requete.current) setEtat((ancien) => ({ ...ancien, chargement: false, erreur: e.message }))
      throw e
    }
  }, dependances)

  useEffect(() => {
    recharger().catch(() => {}) // l'erreur est déjà dans l'état
  }, [recharger])

  return { ...etat, recharger }
}
