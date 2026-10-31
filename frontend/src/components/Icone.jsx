// Icone.jsx : jeu d'icônes SVG inline cohérent (trait 2 px, grille 24, style « lucide »)
// Les icônes sont décoratives (aria-hidden) : le texte voisin ou un libellé caché porte le sens.

const TRACES = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  fermer: <path d="M18 6 6 18M6 6l12 12" />,
  'fleche-droite': <path d="M5 12h14m-6-6 6 6-6 6" />,
  'fleche-gauche': <path d="M19 12H5m6 6-6-6 6-6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  calendrier: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  trophee: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  equipes: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  ballon: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 7 4.2 3-1.6 5H9.4l-1.6-5L12 7Z" />
      <path d="M12 2v5M16.2 10l5.3-1.7M14.6 15l3.1 4.6M9.4 15l-3.1 4.6M7.8 10 2.5 8.3" />
    </>
  ),
  statistiques: <path d="M3 3v18h18M7 16v-3M12 16V8M17 16v-6" />,
  bouclier: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  accueil: (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  rafraichir: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  alerte: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  succes: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  lieu: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  horloge: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  poubelle: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />,
  crayon: <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  deconnexion: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  sifflet: (
    <>
      <path d="M2 14a6 6 0 1 0 12 0V8h8V4H8a6 6 0 0 0-6 6Z" />
      <circle cx="8" cy="14" r="2" />
    </>
  ),
  utilisateur: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  maillot: <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />,
}

/**
 * Affiche une icône du jeu ci-dessus.
 * @param {string} nom  clé de TRACES
 * @param {string} className  classe CSS facultative (la taille vient du CSS du parent)
 */
export default function Icone({ nom, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRACES[nom]}
    </svg>
  )
}
