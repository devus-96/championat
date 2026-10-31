// Layout.jsx : équivalent de base.html — lien d'évitement, en-tête collant, navigation,
// <main>, pied de page. Variante « admin » : même identité, plus sobre.
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icone from './Icone.jsx'

const SAISON = 2026

const LIENS_PUBLICS = [
  { vers: '/', libelle: 'Accueil', icone: 'accueil', exact: true },
  { vers: '/calendrier', libelle: 'Calendrier', icone: 'calendrier' },
  { vers: '/classement', libelle: 'Classement', icone: 'trophee' },
  { vers: '/equipes', libelle: 'Équipes', icone: 'equipes' },
  { vers: '/buteurs', libelle: 'Buteurs', icone: 'ballon' },
  { vers: '/statistiques', libelle: 'Statistiques', icone: 'statistiques' },
]

const LIENS_ADMIN = [
  { vers: '/admin', libelle: 'Tableau de bord', icone: 'accueil', exact: true },
  { vers: '/admin/matchs', libelle: 'Résultats', icone: 'sifflet' },
  { vers: '/admin/equipes', libelle: 'Équipes et joueurs', icone: 'equipes' },
]

/** Logo du championnat (même dessin que le favicon), décoratif car le nom est écrit à côté. */
export function LogoChampionnat({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M3 3h26v13c0 7.5-6 11.8-13 14C9 27.8 3 23.5 3 16Z" fill="#0b6e4f" stroke="#f2c400" strokeWidth="2" />
      <circle cx="16" cy="15" r="7" fill="#fff" />
      <path d="m16 11.2 3.4 2.5-1.3 4h-4.2l-1.3-4Z" fill="#14201b" />
      <path d="M16 8v3.2M19.4 13.7l3.1-1M18.1 17.7l1.9 2.6M13.9 17.7 12 20.3M12.6 13.7l-3.1-1" stroke="#14201b" strokeWidth="1.2" />
    </svg>
  )
}

export default function Layout({ admin = false, pleineLargeur = false }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const boutonMenu = useRef(null)
  const { pathname } = useLocation()
  const liens = admin ? LIENS_ADMIN : LIENS_PUBLICS

  // Ferme le menu mobile et remonte en haut à chaque changement de page
  useEffect(() => {
    setMenuOuvert(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Échap ferme le menu et rend le focus au bouton hamburger
  useEffect(() => {
    if (!menuOuvert) return undefined
    const surTouche = (e) => {
      if (e.key === 'Escape') {
        setMenuOuvert(false)
        boutonMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', surTouche)
    return () => document.removeEventListener('keydown', surTouche)
  }, [menuOuvert])

  return (
    <div className={`page${admin ? ' page--admin' : ''}`}>
      <a className="lien-evitement" href="#contenu">
        Aller au contenu
      </a>

      <header className="entete zone-foncee">
        <div className="entete__interieur">
          <div className="entete__barre">
            <Link to={admin ? '/admin' : '/'} className="marque">
              <LogoChampionnat className="marque__logo" />
              <span className="marque__texte">
                <span className="marque__nom">Championnat des quartiers</span>
                <span className="marque__saison">{admin ? 'Administration' : `Bafoussam · Saison ${SAISON}`}</span>
              </span>
            </Link>
            <button
              ref={boutonMenu}
              type="button"
              className="bouton bouton--icone entete__menu"
              aria-expanded={menuOuvert}
              aria-controls="navigation-principale"
              onClick={() => setMenuOuvert((o) => !o)}
            >
              <Icone nom={menuOuvert ? 'fermer' : 'menu'} />
              <span className="visuellement-cache">{menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
            </button>
          </div>

          <nav
            id="navigation-principale"
            className={`navigation${menuOuvert ? ' navigation--ouverte' : ''}`}
            aria-label={admin ? 'Navigation administration' : 'Navigation principale'}
          >
            <ul className="navigation__liste">
              {liens.map((lien) => (
                <li key={lien.vers}>
                  <NavLink to={lien.vers} end={lien.exact} className="navigation__lien">
                    <Icone nom={lien.icone} />
                    {lien.libelle}
                  </NavLink>
                </li>
              ))}
              <li className="navigation__element--admin">
                {admin ? (
                  <Link to="/" className="navigation__lien navigation__lien--admin">
                    <Icone nom="fleche-gauche" />
                    Voir le site public
                  </Link>
                ) : (
                  <NavLink to="/admin" className="navigation__lien navigation__lien--admin">
                    <Icone nom="bouclier" />
                    Admin
                  </NavLink>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" tabIndex={-1} className={`contenu${pleineLargeur ? ' contenu--plein' : ''}`}>
        <Outlet />
      </main>

      <footer className="pied zone-foncee">
        <div className="pied__interieur">
          <div>
            <p className="pied__nom">Championnat des quartiers de Bafoussam</p>
            <p className="pied__mention">Saison {SAISON} · Projet de groupe - Technologies Web</p>
          </div>
          <nav aria-label="Liens du pied de page">
            <ul className="pied__liens">
              {LIENS_PUBLICS.slice(1).map((lien) => (
                <li key={lien.vers}>
                  <Link to={lien.vers}>{lien.libelle}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="pied__bas">
          © {SAISON} Championnat des quartiers de Bafoussam. Données de démonstration.
        </p>
      </footer>
    </div>
  )
}
