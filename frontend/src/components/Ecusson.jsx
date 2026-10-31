// Ecusson.jsx : logo d'équipe. Si l'équipe a un fichier logo (static/images), on l'affiche ;
// sinon on génère un écusson SVG à ses couleurs (champ « couleurs », ex. « Vert et blanc »).
// Rendu dans une vraie balise <img> pour porter un attribut alt.

// Teintes associées aux noms de couleurs utilisés dans la base
const TEINTES = {
  vert: '#1b7a3e',
  blanc: '#ffffff',
  rouge: '#c62828',
  noir: '#1a1a1a',
  bleu: '#1f4fa3',
  jaune: '#f2c400',
  orange: '#e8731a',
  violet: '#6a3fa0',
  gris: '#8a9590',
  marron: '#7a4a24',
}

/** « Vert et blanc » → ['#1b7a3e', '#ffffff'] (gris par défaut si la couleur est inconnue). */
function lireCouleurs(texte = '') {
  const mots = texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter((mot) => TEINTES[mot])
  const premiere = TEINTES[mots[0]] || TEINTES.gris
  const seconde = TEINTES[mots[1]] || (premiere === TEINTES.blanc ? TEINTES.vert : TEINTES.blanc)
  return [premiere, seconde]
}

/** Luminance relative WCAG d'une couleur #rrggbb. */
function luminance(hex) {
  const canaux = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canaux.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (claire + 0.05) / (sombre + 0.05)
}

/** Initiales du club : « Étoile Kamkop » → « ÉK ». */
function initiales(nom = '') {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('')
}

/** Construit le code SVG de l'écusson et le renvoie sous forme d'URL data:. */
function genererEcusson(nom, couleurs) {
  const [fond, bande] = lireCouleurs(couleurs)
  // Texte : seconde couleur si elle contraste assez avec le fond, sinon blanc ou encre
  const texte = contraste(fond, bande) >= 3 ? bande : contraste(fond, '#ffffff') >= 3 ? '#ffffff' : '#14201b'
  const lettres = initiales(nom).replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48">
<defs><clipPath id="c"><path d="M2 2h36v20c0 12-9 20-18 24C11 42 2 34 2 22Z"/></clipPath></defs>
<g clip-path="url(#c)">
<rect width="40" height="48" fill="${fond}"/>
<path d="M40 0v10L0 50V40Z" fill="${bande}" opacity=".9"/>
</g>
<path d="M2 2h36v20c0 12-9 20-18 24C11 42 2 34 2 22Z" fill="none" stroke="#08392b" stroke-opacity=".35" stroke-width="1.5"/>
<text x="20" y="28" text-anchor="middle" font-family="'Arial Narrow',Arial,sans-serif" font-weight="700" font-size="14" fill="${texte}" stroke="${fond}" stroke-width="3" paint-order="stroke" letter-spacing=".5">${lettres}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * @param {object} equipe  { nom, couleurs, logo }
 * @param {'s'|'m'|'l'|'xl'} taille
 * @param {boolean} decoratif  true quand le nom de l'équipe est déjà écrit à côté (alt="")
 */
export default function Ecusson({ nom, couleurs, logo, taille = 'm', decoratif = false }) {
  const source = logo ? `/static/images/${logo}` : genererEcusson(nom, couleurs)
  const classe = taille === 'm' ? 'ecusson' : `ecusson ecusson--${taille}`
  return (
    <img
      className={classe}
      src={source}
      alt={decoratif ? '' : `Écusson de ${nom}`}
      width="40"
      height="48"
      loading="lazy"
      decoding="async"
    />
  )
}
