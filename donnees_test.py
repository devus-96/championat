# donnees_test.py : crée projet.db et la remplit de données réalistes
import random
import sqlite3
from datetime import date, timedelta
from werkzeug.security import generate_password_hash

random.seed(42)  # mêmes données à chaque lancement

EQUIPES = [
    ("AS Tamdja", "Tamdja", "Paul Nkeng", "Vert et blanc"),
    ("FC Banengo", "Banengo", "Joseph Tchinda", "Rouge et noir"),
    ("Racing Djeleng", "Djeleng", "Michel Fokou", "Bleu et blanc"),
    ("Étoile Kamkop", "Kamkop", "Serge Kamga", "Jaune et vert"),
    ("Union Tougang", "Tougang", "Alain Wafo", "Orange et noir"),
    ("Olympique Famla", "Famla", "Jean Temgoua", "Blanc et rouge"),
    ("Sporting Ndiangdam", "Ndiangdam", "Roger Kenfack", "Violet et blanc"),
    ("Jeunesse Lafé", "Lafé", "Claude Tagne", "Bleu et jaune"),
    ("Canon Tchouaket", "Tchouaket", "Eric Djomou", "Vert et jaune"),
    ("Aigles Kouogouo", "Kouogouo", "David Mbouda", "Noir et blanc"),
]
NOMS = ["Fotso", "Tchinda", "Kamga", "Nkeng", "Wafo", "Temgoua", "Kenfack", "Tagne", "Djomou",
        "Mbouda", "Nana", "Talla", "Simo", "Ngueguim", "Tchamba", "Feudjio", "Kouam", "Tsafack",
        "Zangue", "Pouokam"]
PRENOMS = ["Aristide", "Brice", "Cyrille", "Désiré", "Éric", "Franck", "Gaston", "Hervé", "Ivan",
           "Jules", "Kevin", "Landry", "Martial", "Noël", "Olivier", "Patrick", "Rodrigue", "Steve"]
POSTES = ["Gardien"] * 2 + ["Défenseur"] * 6 + ["Milieu"] * 6 + ["Attaquant"] * 4   # 18 joueurs
STADES = ["Stade municipal", "Terrain de Tamdja", "Terrain de Banengo", "Stade de Djeleng"]


def calendrier_aller(ids):
    """Algorithme du cercle : renvoie une liste de journées, chaque journée = liste de (dom, ext)."""
    equipes = list(ids)
    n = len(equipes)
    journees = []
    for tour in range(n - 1):
        matchs = []
        for i in range(n // 2):
            a, b = equipes[i], equipes[n - 1 - i]
            matchs.append((a, b) if (tour + i) % 2 == 0 else (b, a))
        journees.append(matchs)
        equipes = [equipes[0]] + [equipes[-1]] + equipes[1:-1]   # rotation
    return journees


def tirer_score():
    """Score réaliste : peu de buts, plus souvent 0 à 3."""
    return random.choices([0, 1, 2, 3, 4], weights=[22, 32, 26, 14, 6])[0]


def repartir_buts(joueurs_equipe, nb):
    """Choisit des buteurs (les attaquants et milieux marquent plus souvent)."""
    poids = [{"Attaquant": 6, "Milieu": 3, "Défenseur": 1, "Gardien": 0.05}[j["poste"]] for j in joueurs_equipe]
    return random.choices(joueurs_equipe, weights=poids, k=nb)


def remplir(bd):
    bd.execute("INSERT INTO administrateurs (login, empreinte) VALUES (?, ?)",
               ("admin", generate_password_hash("Admin!2026")))

    # 1) équipes
    for nom, quartier, entraineur, couleurs in EQUIPES:
        bd.execute("INSERT INTO equipes (nom, quartier, entraineur, couleurs, logo) VALUES (?,?,?,?,?)",
                   (nom, quartier, entraineur, couleurs, None))

    # 2) joueurs : 18 par équipe, numéros uniques
    for equipe_id in range(1, 11):
        for numero, poste in enumerate(POSTES, start=1):
            annee = random.randint(1996, 2008)
            naissance = date(annee, random.randint(1, 12), random.randint(1, 28)).isoformat()
            bd.execute("INSERT INTO joueurs (equipe_id, nom, numero, poste, date_naissance) VALUES (?,?,?,?,?)",
                       (equipe_id, f"{random.choice(PRENOMS)} {random.choice(NOMS)}", numero, poste, naissance))

    # 3) calendrier : 9 journées de 5 matchs, une journée par semaine
    debut = date.today() - timedelta(days=5 * 7)          # les 5 premières journées sont dans le passé
    for num, matchs in enumerate(calendrier_aller(range(1, 11)), start=1):
        jour = (debut + timedelta(days=(num - 1) * 7)).isoformat()
        for dom, ext in matchs:
            joue = num <= 5                                # 25 matchs joués
            sd, se = (tirer_score(), tirer_score()) if joue else (None, None)
            curseur = bd.execute(
                "INSERT INTO matchs (journee, equipe_dom_id, equipe_ext_id, date_match, stade, score_dom, score_ext, joue)"
                " VALUES (?,?,?,?,?,?,?,?)",
                (num, dom, ext, jour, random.choice(STADES), sd, se, 1 if joue else 0))
            if not joue:
                continue
            match_id = curseur.lastrowid
            # 4) buts cohérents avec le score (R3, R4)
            for equipe_id, nb in ((dom, sd), (ext, se)):
                effectif = [dict(r) for r in bd.execute("SELECT id, poste FROM joueurs WHERE equipe_id = ?", (equipe_id,))]
                for buteur in repartir_buts(effectif, nb):
                    bd.execute("INSERT INTO buts (match_id, joueur_id, minute) VALUES (?,?,?)",
                               (match_id, buteur["id"], random.randint(1, 90)))
            # 5) cartons : 0 à 3 jaunes, rouge rare
            for _ in range(random.choices([0, 1, 2, 3], weights=[30, 40, 22, 8])[0]):
                equipe_id = random.choice((dom, ext))
                joueur = random.choice([r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (equipe_id,))])
                bd.execute("INSERT INTO cartons (match_id, joueur_id, couleur, minute) VALUES (?,?,?,?)",
                           (match_id, joueur, "jaune", random.randint(1, 90)))
            if random.random() < 0.08:
                equipe_id = random.choice((dom, ext))
                joueur = random.choice([r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (equipe_id,))])
                bd.execute("INSERT INTO cartons (match_id, joueur_id, couleur, minute) VALUES (?,?,?,?)",
                           (match_id, joueur, "rouge", random.randint(20, 90)))
    bd.commit()


if __name__ == "__main__":
    bd = sqlite3.connect("projet.db")
    bd.row_factory = sqlite3.Row  # accès aux colonnes par leur nom (r["id"])
    bd.execute("PRAGMA foreign_keys = ON")
    with open("schema.sql", encoding="utf-8") as f:
        bd.executescript(f.read())
    remplir(bd)
    for table in ("equipes", "joueurs", "matchs", "buts", "cartons", "administrateurs"):
        n = bd.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"{table} : {n} lignes")
    print("Matchs joués :", bd.execute("SELECT COUNT(*) FROM matchs WHERE joue = 1").fetchone()[0])
    bd.close()
