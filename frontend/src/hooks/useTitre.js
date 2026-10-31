// useTitre.js : titre d'onglet dynamique (document.title) et <meta name="description"> par page
import { useEffect } from 'react'

export const NOM_CHAMPIONNAT = 'Championnat des quartiers de Bafoussam'
const DESCRIPTION_PAR_DEFAUT =
  'Site officiel du championnat de football des quartiers de Bafoussam : calendrier, résultats, classement, équipes et buteurs.'

export default function useTitre(titre, description = DESCRIPTION_PAR_DEFAUT) {
  useEffect(() => {
    document.title = titre ? `${titre} · ${NOM_CHAMPIONNAT}` : NOM_CHAMPIONNAT
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }, [titre, description])
}
