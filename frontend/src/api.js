// api.js : toutes les fonctions fetch au même endroit

// Appel générique : renvoie le JSON ou lève une erreur avec le message du serveur
async function appeler(url, options = {}) {
  let reponse
  try {
    reponse = await fetch(url, { credentials: 'same-origin', ...options })
  } catch {
    throw new Error('Le serveur ne répond pas. Vérifiez que « python app.py » est lancé.')
  }
  const donnees = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    const erreur = new Error(donnees.erreur || `Erreur ${reponse.status}`)
    erreur.statut = reponse.status
    throw erreur
  }
  return donnees
}

// Envoi en POST (toutes les modifications passent par POST)
const envoyer = (url, corps) =>
  appeler(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps ?? {}) })

export const api = {
  // --- Public ---
  equipes: () => appeler('/api/equipes'),
  equipe: (id) => appeler(`/api/equipes/${id}`),
  journees: () => appeler('/api/journees'),
  matchs: (journee) => appeler(journee ? `/api/matchs?journee=${journee}` : '/api/matchs'),
  match: (id) => appeler(`/api/matchs/${id}`),
  classement: () => appeler('/api/classement'),
  buteurs: (limite = 10) => appeler(`/api/buteurs?limite=${limite}`),
  statistiques: () => appeler('/api/statistiques'),

  // --- Authentification ---
  connexion: (login, mot_de_passe) => envoyer('/api/admin/connexion', { login, mot_de_passe }),
  deconnexion: () => envoyer('/api/admin/deconnexion'),
  moi: () => appeler('/api/admin/moi'),

  // --- Administration ---
  ajouterEquipe: (corps) => envoyer('/api/admin/equipes/ajouter', corps),
  modifierEquipe: (id, corps) => envoyer(`/api/admin/equipes/${id}/modifier`, corps),
  supprimerEquipe: (id) => envoyer(`/api/admin/equipes/${id}/supprimer`),
  ajouterJoueur: (corps) => envoyer('/api/admin/joueurs/ajouter', corps),
  modifierJoueur: (id, corps) => envoyer(`/api/admin/joueurs/${id}/modifier`, corps),
  supprimerJoueur: (id) => envoyer(`/api/admin/joueurs/${id}/supprimer`),
  saisirResultat: (id, corps) => envoyer(`/api/admin/matchs/${id}/resultat`, corps),
}

// --- Formatage commun ---
const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const FORMAT_DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** « 2026-10-24 » → « sam. 24 oct. » (sans décalage de fuseau horaire). */
export function formaterDate(iso, longue = false) {
  const [a, m, j] = iso.split('-').map(Number)
  return (longue ? FORMAT_DATE_LONGUE : FORMAT_DATE).format(new Date(a, m - 1, j))
}
