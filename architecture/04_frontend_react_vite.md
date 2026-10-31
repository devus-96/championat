# 04 — Front-end React + Vite

## Création

```bash
cd projet
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom
```

`vite.config.js` — proxy pour le développement (le front appelle `/api/...` sans CORS) :

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:5000', '/static': 'http://127.0.0.1:5000' } },
})
```

Développement : terminal 1 → `python app.py` ; terminal 2 → `npm run dev`.
Livraison : `npm run build` → le dossier `frontend/dist` est servi par Flask.

## Plan du site (diapositive 4)

```
/                      Accueil (prochains matchs, top 3 classement, top buteurs)
/calendrier            Calendrier et résultats (sélecteur de journée)
/matchs/:id            Détail d'un match (score, buts, cartons)
/classement            Classement (tri au clic)
/equipes               Liste des équipes
/equipes/:id           Fiche équipe (effectif + résultats)
/buteurs               Classement des buteurs
/statistiques          Meilleure attaque/défense, suspendus
/admin/connexion       Connexion
/admin                 Tableau de bord admin
/admin/matchs          Matchs à saisir / corriger
/admin/matchs/:id      Formulaire de résultat
/admin/equipes         Gestion équipes et joueurs
*                      Page 404
```

## Arborescence `src/`

```
src/
├── main.jsx
├── App.jsx                 # routes
├── api.js                  # fonctions fetch centralisées
├── styles/
│   ├── base.css            # variables, reset, mobile d'abord
│   ├── layout.css          # en-tête, pied de page, grille
│   └── composants.css      # tableaux, cartes, formulaires
├── components/
│   ├── Layout.jsx          # = base.html : en-tête, navigation, <main>, pied de page
│   ├── Toast.jsx           # = messages flash
│   ├── ProtectedRoute.jsx  # redirige vers /admin/connexion si non connecté
│   ├── TableauClassement.jsx
│   ├── CarteMatch.jsx
│   └── ChampFormulaire.jsx # <label> + <input> + message d'erreur (accessibilité)
└── pages/
    ├── Accueil.jsx  Calendrier.jsx  Match.jsx  Classement.jsx
    ├── Equipes.jsx  Equipe.jsx  Buteurs.jsx  Statistiques.jsx
    ├── admin/ Connexion.jsx  Tableau.jsx  Matchs.jsx  SaisieResultat.jsx  Equipes.jsx
    └── NotFound.jsx
```

## `api.js` (modèle)

```js
// Appel générique : renvoie le JSON ou lève une erreur avec le message du serveur
async function appeler(url, options = {}) {
  const reponse = await fetch(url, { credentials: 'same-origin', ...options })
  const donnees = await reponse.json().catch(() => ({}))
  if (!reponse.ok) throw new Error(donnees.erreur || 'Erreur réseau')
  return donnees
}

const envoyer = (url, corps) =>
  appeler(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps ?? {}) })

export const api = {
  classement: () => appeler('/api/classement'),
  buteurs: (limite = 10) => appeler(`/api/buteurs?limite=${limite}`),
  matchs: (journee) => appeler(`/api/matchs?journee=${journee}`),
  connexion: (login, mot_de_passe) => envoyer('/api/admin/connexion', { login, mot_de_passe }),
  saisirResultat: (id, corps) => envoyer(`/api/admin/matchs/${id}/resultat`, corps),
}
```

## Pages clés

### Classement (JS exigé : tri + fetch)
- Au montage : `fetch('/api/classement')` → état `lignes`.
- Colonnes cliquables : état `{colonne, ordre}` ; tri en JS ; `aria-sort` sur le `<th>` ; flèche ▲/▼.
- Bouton « Actualiser » qui **refait le fetch** sans recharger la page (+ `setInterval` de 30 s facultatif).
- Mobile : tableau dans un conteneur `overflow-x: auto`, première colonne (équipe) figée.
- Colonnes : `#`, Équipe, J, G, N, P, BP, BC, Diff, Pts.

### Calendrier
- Sélecteur `<select>` de journée (labellisé), liste de `CarteMatch` : `Équipe A  2 – 1  Équipe B`, date, stade ; « à jouer » si non joué.
- Clic → `/matchs/:id`.

### Détail d'un match
- Score, liste des buteurs avec minute (`⚽ Nom 14'`), cartons (`🟨` / `🟥`).

### Fiche équipe
- Logo (**avec `alt`**), quartier, entraîneur, couleurs ; effectif trié par poste ; résultats de l'équipe.

### Buteurs
- Tableau Rang / Joueur / Équipe / Buts (10 premiers).

### Statistiques
- Meilleure attaque, meilleure défense, joueurs suspendus (jaunes/rouges).

### Admin — `SaisieResultat.jsx` (la page à soigner)
- Deux colonnes (équipe domicile / extérieur) ; scores en `<input type="number" min="0">`.
- Pour chaque équipe : ajout dynamique de lignes de buteurs (`<select>` joueur + minute) ; ajout de cartons (joueur + couleur + minute).
- **Vérification avant envoi (JavaScript)** : nombre de buteurs de l'équipe == score ; minutes 1–120 ; joueur choisi. Messages d'erreur sous les champs.
- Le serveur **revérifie tout** ; afficher son message d'erreur en `Toast`.

### Admin — Connexion
- Formulaire login + mot de passe avec vérification JS (champs non vides), appel `api.connexion`, redirection vers `/admin`.
- `ProtectedRoute` appelle `/api/admin/moi` ; en cas de 401 → redirection.

### Admin — Équipes et joueurs
- Tableaux avec « Modifier » (formulaire en modale ou page) et « Supprimer » (confirmation) ; tout en **POST**.

## CSS — mobile d'abord

```css
:root { --vert:#0b6e4f; --fond:#f6f8f7; --texte:#14201b; --bordure:#d5dcd8; --jaune:#f2c400; --rouge:#d62828; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, sans-serif; background:var(--fond); color:var(--texte); line-height:1.5; }
main { padding: 1rem; max-width: 72rem; margin: 0 auto; }
.grille { display:grid; gap:1rem; grid-template-columns: 1fr; }          /* téléphone */
@media (min-width: 640px)  { .grille { grid-template-columns: repeat(2, 1fr); } }   /* point de rupture 1 */
@media (min-width: 1024px) { .grille { grid-template-columns: repeat(3, 1fr); } }   /* point de rupture 2 */
.tableau-conteneur { overflow-x:auto; }
```

Navigation : menu « hamburger » sous 640 px, barre horizontale au-dessus.

## Accessibilité / HTML sémantique (points du barème)
- Balises `header`, `nav`, `main`, `section`, `article`, `footer`, `h1` unique par page.
- Chaque `<img>` a un `alt` ; chaque champ a un `<label htmlFor>`.
- Contraste suffisant ; focus visible ; boutons réellement des `<button>`.
- Titre de page dynamique (`document.title`).

## Build et vérification
```bash
npm run build          # produit frontend/dist
cd .. && python app.py # tester sur http://127.0.0.1:5000
```
Tester : rafraîchir une page profonde (`/equipes/3`) → doit s'afficher (le « fallback » de Flask renvoie `index.html`).
