# app.py : API du championnat + service du front React compilé
import os
import re
import sqlite3
from datetime import date
from functools import wraps

from flask import Flask, jsonify, request, session, send_from_directory, g
from werkzeug.security import check_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
CHEMIN_BD = os.path.join(BASE, "projet.db")
DOSSIER_FRONT = os.path.join(BASE, "frontend", "dist")

app = Flask(__name__, static_folder=os.path.join(BASE, "static"))
app.secret_key = "cle-de-presentation-a-changer"   # suffisant pour une démonstration
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")
app.json.ensure_ascii = False                       # accents lisibles dans le JSON

POSTES = ("Gardien", "Défenseur", "Milieu", "Attaquant")
COULEURS_CARTON = ("jaune", "rouge")
COLONNES_TRI = {"pts", "j", "g", "n", "p", "bp", "bc", "diff", "nom"}   # liste blanche du tri serveur
SCORE_MAX = 30


# ---------------------------------------------------------------------------
# Outils communs
# ---------------------------------------------------------------------------

def obtenir_bd():
    """Ouvre (une fois par requête) la connexion SQLite avec les clés étrangères actives."""
    if "bd" not in g:
        g.bd = sqlite3.connect(CHEMIN_BD)
        g.bd.row_factory = sqlite3.Row
        g.bd.execute("PRAGMA foreign_keys = ON")
    return g.bd


@app.teardown_appcontext
def fermer_bd(_erreur):
    bd = g.pop("bd", None)
    if bd is not None:
        bd.close()


def connexion_requise(fonction):
    """Refuse l'accès (401) si l'administrateur n'est pas connecté."""
    @wraps(fonction)
    def enveloppe(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify(erreur="Connexion requise"), 401
        return fonction(*args, **kwargs)
    return enveloppe


def erreur(message, code=400):
    """Réponse d'erreur JSON uniforme : {"erreur": "..."}."""
    return jsonify(erreur=message), code


def en_dicts(lignes):
    """Convertit une liste de sqlite3.Row en liste de dictionnaires (sérialisables en JSON)."""
    return [dict(l) for l in lignes]


def lire_entier(valeur, mini=None, maxi=None):
    """Convertit une valeur en entier borné ; renvoie None si invalide (les booléens sont refusés)."""
    if isinstance(valeur, bool):
        return None
    try:
        nombre = int(valeur)
    except (TypeError, ValueError):
        return None
    if isinstance(valeur, float) and valeur != nombre:
        return None
    if (mini is not None and nombre < mini) or (maxi is not None and nombre > maxi):
        return None
    return nombre


def lire_texte(donnees, cle, longueur_max=80):
    """Lit un champ texte obligatoire (espaces retirés) ; renvoie None s'il est vide ou trop long."""
    texte = str(donnees.get(cle, "") or "").strip()
    if not texte or len(texte) > longueur_max:
        return None
    return texte


# Requête du classement (R1 + R2) : calculé depuis les matchs joués, jamais saisi
SQL_CLASSEMENT = """
WITH lignes AS (
    SELECT equipe_dom_id AS equipe_id, score_dom AS bp, score_ext AS bc
      FROM matchs WHERE joue = 1
    UNION ALL
    SELECT equipe_ext_id,              score_ext,       score_dom
      FROM matchs WHERE joue = 1
)
SELECT e.id, e.nom, e.logo, e.couleurs,
       COUNT(l.equipe_id)                                              AS j,
       COALESCE(SUM(l.bp > l.bc), 0)                                   AS g,
       COALESCE(SUM(l.bp = l.bc), 0)                                   AS n,
       COALESCE(SUM(l.bp < l.bc), 0)                                   AS p,
       COALESCE(SUM(l.bp), 0)                                          AS bp,
       COALESCE(SUM(l.bc), 0)                                          AS bc,
       COALESCE(SUM(l.bp) - SUM(l.bc), 0)                              AS diff,
       COALESCE(SUM(CASE WHEN l.bp > l.bc THEN 3
                         WHEN l.bp = l.bc THEN 1 ELSE 0 END), 0)       AS pts
  FROM equipes e
  LEFT JOIN lignes l ON l.equipe_id = e.id
 GROUP BY e.id
 ORDER BY pts DESC, diff DESC, bp DESC, e.nom ASC
"""

# Matchs avec les noms et couleurs des deux équipes (filtre ajouté par chaque route)
SQL_MATCHS = """
SELECT m.id, m.journee, m.date_match, m.stade, m.score_dom, m.score_ext, m.joue,
       m.equipe_dom_id, d.nom AS equipe_dom, d.couleurs AS couleurs_dom,
       m.equipe_ext_id, x.nom AS equipe_ext, x.couleurs AS couleurs_ext
  FROM matchs m
  JOIN equipes d ON d.id = m.equipe_dom_id
  JOIN equipes x ON x.id = m.equipe_ext_id
"""


def calculer_classement():
    """Renvoie le classement avec le rang (1 = premier) ajouté à chaque ligne."""
    lignes = en_dicts(obtenir_bd().execute(SQL_CLASSEMENT))
    for rang, ligne in enumerate(lignes, start=1):
        ligne["rang"] = rang
    return lignes


# ---------------------------------------------------------------------------
# Routes publiques (GET, JSON)
# ---------------------------------------------------------------------------

@app.get("/api/equipes")
def liste_equipes():
    """Liste des équipes, triées par nom."""
    lignes = obtenir_bd().execute(
        "SELECT id, nom, quartier, entraineur, couleurs, logo FROM equipes ORDER BY nom")
    return jsonify(en_dicts(lignes))


@app.get("/api/equipes/<int:equipe_id>")
def fiche_equipe(equipe_id):
    """Fiche équipe : informations, statistiques du classement, effectif et résultats."""
    bd = obtenir_bd()
    equipe = bd.execute("SELECT id, nom, quartier, entraineur, couleurs, logo FROM equipes WHERE id = ?",
                        (equipe_id,)).fetchone()
    if equipe is None:
        return erreur("Équipe introuvable", 404)
    fiche = dict(equipe)
    fiche["stats"] = next((l for l in calculer_classement() if l["id"] == equipe_id), None)
    fiche["joueurs"] = en_dicts(bd.execute(
        "SELECT id, nom, numero, poste, date_naissance FROM joueurs WHERE equipe_id = ? ORDER BY numero",
        (equipe_id,)))
    fiche["matchs"] = en_dicts(bd.execute(
        SQL_MATCHS + " WHERE m.equipe_dom_id = ? OR m.equipe_ext_id = ? ORDER BY m.journee",
        (equipe_id, equipe_id)))
    return jsonify(fiche)


@app.get("/api/journees")
def liste_journees():
    """Numéros de journée existants et prochaine journée à jouer (None si tout est joué)."""
    bd = obtenir_bd()
    journees = [l["journee"] for l in bd.execute("SELECT DISTINCT journee FROM matchs ORDER BY journee")]
    prochaine = bd.execute("SELECT MIN(journee) FROM matchs WHERE joue = 0").fetchone()[0]
    return jsonify(journees=journees, prochaine=prochaine)


@app.get("/api/matchs")
def liste_matchs():
    """Matchs d'une journée (?journee=N) ou tous les matchs si le paramètre est absent."""
    bd = obtenir_bd()
    texte = request.args.get("journee")
    if texte is None:
        lignes = bd.execute(SQL_MATCHS + " ORDER BY m.journee, m.id")
    else:
        journee = lire_entier(texte, mini=1)
        if journee is None:
            return erreur("Numéro de journée invalide")
        lignes = bd.execute(SQL_MATCHS + " WHERE m.journee = ? ORDER BY m.id", (journee,))
    return jsonify(en_dicts(lignes))


@app.get("/api/matchs/<int:match_id>")
def detail_match(match_id):
    """Détail d'un match : équipes, score, buts et cartons (avec nom du joueur et équipe)."""
    bd = obtenir_bd()
    match = bd.execute(SQL_MATCHS + " WHERE m.id = ?", (match_id,)).fetchone()
    if match is None:
        return erreur("Match introuvable", 404)
    detail = dict(match)
    detail["buts"] = en_dicts(bd.execute(
        "SELECT b.id, b.minute, b.joueur_id, j.nom AS joueur, j.numero, j.equipe_id"
        "  FROM buts b JOIN joueurs j ON j.id = b.joueur_id"
        " WHERE b.match_id = ? ORDER BY b.minute", (match_id,)))
    detail["cartons"] = en_dicts(bd.execute(
        "SELECT c.id, c.minute, c.couleur, c.joueur_id, j.nom AS joueur, j.numero, j.equipe_id"
        "  FROM cartons c JOIN joueurs j ON j.id = c.joueur_id"
        " WHERE c.match_id = ? ORDER BY c.minute", (match_id,)))
    return jsonify(detail)


@app.get("/api/classement")
def classement():
    """Classement calculé ; tri serveur optionnel ?tri=pts&ordre=desc (colonne en liste blanche)."""
    lignes = calculer_classement()
    tri = request.args.get("tri")
    if tri is not None:
        if tri not in COLONNES_TRI:
            return erreur("Colonne de tri inconnue")
        inverse = request.args.get("ordre", "desc") != "asc"
        lignes.sort(key=lambda l: l[tri], reverse=inverse)
    return jsonify(lignes)


@app.get("/api/buteurs")
def buteurs():
    """Classement des buteurs (?limite=10 par défaut, entre 1 et 100)."""
    limite = lire_entier(request.args.get("limite", 10), mini=1, maxi=100)
    if limite is None:
        return erreur("Limite invalide (1 à 100)")
    lignes = obtenir_bd().execute(
        "SELECT j.id, j.nom, e.id AS equipe_id, e.nom AS equipe, e.couleurs, COUNT(b.id) AS buts"
        "  FROM buts b"
        "  JOIN joueurs j ON j.id = b.joueur_id"
        "  JOIN equipes e ON e.id = j.equipe_id"
        " GROUP BY j.id"
        " ORDER BY buts DESC, j.nom ASC"
        " LIMIT ?", (limite,))
    return jsonify(en_dicts(lignes))


@app.get("/api/statistiques")
def statistiques():
    """Meilleure attaque (plus de BP), meilleure défense (moins de BC) et joueurs suspendus."""
    jouees = [l for l in calculer_classement() if l["j"] > 0]
    attaque = max(jouees, key=lambda l: (l["bp"], l["diff"]), default=None)
    defense = min(jouees, key=lambda l: (l["bc"], -l["diff"]), default=None)
    suspendus = en_dicts(obtenir_bd().execute(
        "SELECT j.id, j.nom, j.numero, e.id AS equipe_id, e.nom AS equipe, e.couleurs,"
        "       SUM(c.couleur = 'jaune') AS jaunes,"
        "       SUM(c.couleur = 'rouge') AS rouges"
        "  FROM cartons c"
        "  JOIN joueurs j ON j.id = c.joueur_id"
        "  JOIN equipes e ON e.id = j.equipe_id"
        " GROUP BY j.id"
        " HAVING jaunes >= 2 OR rouges >= 1"
        " ORDER BY rouges DESC, jaunes DESC, j.nom"))
    return jsonify(meilleure_attaque=attaque, meilleure_defense=defense, suspendus=suspendus)


# ---------------------------------------------------------------------------
# Authentification
# ---------------------------------------------------------------------------

@app.post("/api/admin/connexion")
def connexion():
    """Ouvre la session si le login et le mot de passe (haché en base) sont corrects."""
    donnees = request.get_json(silent=True) or {}
    login = str(donnees.get("login", "")).strip()
    mdp = str(donnees.get("mot_de_passe", ""))
    if not login or not mdp:
        return erreur("Login et mot de passe obligatoires")
    ligne = obtenir_bd().execute("SELECT * FROM administrateurs WHERE login = ?", (login,)).fetchone()
    if ligne is None or not check_password_hash(ligne["empreinte"], mdp):
        return erreur("Identifiants incorrects", 401)
    session.clear()
    session["admin_id"] = ligne["id"]
    session["login"] = ligne["login"]
    return jsonify(ok=True, login=ligne["login"])


@app.post("/api/admin/deconnexion")
def deconnexion():
    """Ferme la session."""
    session.clear()
    return jsonify(ok=True)


@app.get("/api/admin/moi")
def moi():
    """Indique si la session est connectée (401 sinon)."""
    if not session.get("admin_id"):
        return erreur("Connexion requise", 401)
    return jsonify(connecte=True, login=session.get("login"))


# ---------------------------------------------------------------------------
# Administration : équipes
# ---------------------------------------------------------------------------

def valider_equipe(donnees):
    """Vérifie les champs d'une équipe ; renvoie (valeurs, message_erreur)."""
    valeurs = {cle: lire_texte(donnees, cle) for cle in ("nom", "quartier", "entraineur", "couleurs")}
    manquants = [cle for cle, v in valeurs.items() if v is None]
    if manquants:
        return None, "Champs obligatoires manquants ou trop longs : " + ", ".join(manquants)
    logo = str(donnees.get("logo", "") or "").strip()
    if logo and not re.fullmatch(r"[\w-]+\.(png|jpg|jpeg|svg|webp)", logo):
        return None, "Nom de fichier de logo invalide"
    valeurs["logo"] = logo or None
    return valeurs, None


@app.post("/api/admin/equipes/ajouter")
@connexion_requise
def ajouter_equipe():
    valeurs, message = valider_equipe(request.get_json(silent=True) or {})
    if message:
        return erreur(message)
    bd = obtenir_bd()
    try:
        curseur = bd.execute(
            "INSERT INTO equipes (nom, quartier, entraineur, couleurs, logo) VALUES (?,?,?,?,?)",
            (valeurs["nom"], valeurs["quartier"], valeurs["entraineur"], valeurs["couleurs"], valeurs["logo"]))
        bd.commit()
    except sqlite3.IntegrityError:
        return erreur("Ce nom d'équipe existe déjà")      # R7
    return jsonify(ok=True, id=curseur.lastrowid), 201


@app.post("/api/admin/equipes/<int:equipe_id>/modifier")
@connexion_requise
def modifier_equipe(equipe_id):
    valeurs, message = valider_equipe(request.get_json(silent=True) or {})
    if message:
        return erreur(message)
    bd = obtenir_bd()
    try:
        curseur = bd.execute(
            "UPDATE equipes SET nom=?, quartier=?, entraineur=?, couleurs=?, logo=? WHERE id=?",
            (valeurs["nom"], valeurs["quartier"], valeurs["entraineur"], valeurs["couleurs"], valeurs["logo"],
             equipe_id))
        bd.commit()
    except sqlite3.IntegrityError:
        return erreur("Ce nom d'équipe existe déjà")      # R7
    if curseur.rowcount == 0:
        return erreur("Équipe introuvable", 404)
    return jsonify(ok=True)


@app.post("/api/admin/equipes/<int:equipe_id>/supprimer")
@connexion_requise
def supprimer_equipe(equipe_id):
    """Supprime une équipe ; refusé si elle a déjà joué (le classement en dépend)."""
    bd = obtenir_bd()
    if bd.execute("SELECT 1 FROM equipes WHERE id = ?", (equipe_id,)).fetchone() is None:
        return erreur("Équipe introuvable", 404)
    joues = bd.execute("SELECT COUNT(*) FROM matchs WHERE joue = 1 AND (equipe_dom_id = ? OR equipe_ext_id = ?)",
                       (equipe_id, equipe_id)).fetchone()[0]
    if joues:
        return erreur(f"Suppression refusée : l'équipe a déjà joué {joues} match(s)")
    try:
        # Les matchs non joués de l'équipe disparaissent avec elle ; les joueurs partent en cascade
        bd.execute("DELETE FROM matchs WHERE equipe_dom_id = ? OR equipe_ext_id = ?", (equipe_id, equipe_id))
        bd.execute("DELETE FROM equipes WHERE id = ?", (equipe_id,))
        bd.commit()
    except sqlite3.Error:
        bd.rollback()
        return erreur("Erreur de suppression", 500)
    return jsonify(ok=True)


# ---------------------------------------------------------------------------
# Administration : joueurs
# ---------------------------------------------------------------------------

def valider_joueur(donnees):
    """Vérifie les champs d'un joueur ; renvoie (valeurs, message_erreur)."""
    nom = lire_texte(donnees, "nom")
    if nom is None:
        return None, "Nom du joueur obligatoire"
    equipe_id = lire_entier(donnees.get("equipe_id"), mini=1)
    if equipe_id is None or obtenir_bd().execute("SELECT 1 FROM equipes WHERE id = ?", (equipe_id,)).fetchone() is None:
        return None, "Équipe inconnue"
    numero = lire_entier(donnees.get("numero"), mini=1, maxi=99)
    if numero is None:
        return None, "Numéro de maillot entre 1 et 99"
    poste = donnees.get("poste")
    if poste not in POSTES:
        return None, "Poste invalide (Gardien, Défenseur, Milieu ou Attaquant)"
    naissance = str(donnees.get("date_naissance", "")).strip()
    try:
        if date.fromisoformat(naissance) >= date.today():
            return None, "La date de naissance doit être dans le passé"
    except ValueError:
        return None, "Date de naissance invalide (AAAA-MM-JJ)"
    return dict(nom=nom, equipe_id=equipe_id, numero=numero, poste=poste, date_naissance=naissance), None


@app.post("/api/admin/joueurs/ajouter")
@connexion_requise
def ajouter_joueur():
    valeurs, message = valider_joueur(request.get_json(silent=True) or {})
    if message:
        return erreur(message)
    bd = obtenir_bd()
    try:
        curseur = bd.execute(
            "INSERT INTO joueurs (equipe_id, nom, numero, poste, date_naissance) VALUES (?,?,?,?,?)",
            (valeurs["equipe_id"], valeurs["nom"], valeurs["numero"], valeurs["poste"], valeurs["date_naissance"]))
        bd.commit()
    except sqlite3.IntegrityError:
        return erreur("Ce numéro de maillot est déjà pris dans cette équipe")   # R7
    return jsonify(ok=True, id=curseur.lastrowid), 201


@app.post("/api/admin/joueurs/<int:joueur_id>/modifier")
@connexion_requise
def modifier_joueur(joueur_id):
    valeurs, message = valider_joueur(request.get_json(silent=True) or {})
    if message:
        return erreur(message)
    bd = obtenir_bd()
    try:
        curseur = bd.execute(
            "UPDATE joueurs SET equipe_id=?, nom=?, numero=?, poste=?, date_naissance=? WHERE id=?",
            (valeurs["equipe_id"], valeurs["nom"], valeurs["numero"], valeurs["poste"], valeurs["date_naissance"],
             joueur_id))
        bd.commit()
    except sqlite3.IntegrityError:
        return erreur("Ce numéro de maillot est déjà pris dans cette équipe")   # R7
    if curseur.rowcount == 0:
        return erreur("Joueur introuvable", 404)
    return jsonify(ok=True)


@app.post("/api/admin/joueurs/<int:joueur_id>/supprimer")
@connexion_requise
def supprimer_joueur(joueur_id):
    """Supprime un joueur ; refusé s'il a marqué (sinon le score ne correspondrait plus aux buts, R3)."""
    bd = obtenir_bd()
    if bd.execute("SELECT 1 FROM joueurs WHERE id = ?", (joueur_id,)).fetchone() is None:
        return erreur("Joueur introuvable", 404)
    if bd.execute("SELECT 1 FROM buts WHERE joueur_id = ?", (joueur_id,)).fetchone():
        return erreur("Suppression refusée : ce joueur a marqué (les scores ne correspondraient plus)")
    bd.execute("DELETE FROM joueurs WHERE id = ?", (joueur_id,))
    bd.commit()
    return jsonify(ok=True)


# ---------------------------------------------------------------------------
# Administration : saisie d'un résultat (R3, R4, R6, R8)
# ---------------------------------------------------------------------------

@app.post("/api/admin/matchs/<int:match_id>/resultat")
@connexion_requise
def saisir_resultat(match_id):
    """Enregistre score + buteurs + cartons après vérification complète, de façon atomique."""
    bd = obtenir_bd()
    donnees = request.get_json(silent=True) or {}

    # 1. Le match existe
    m = bd.execute("SELECT * FROM matchs WHERE id = ?", (match_id,)).fetchone()
    if m is None:
        return erreur("Match introuvable", 404)

    # 2. Scores entiers entre 0 et SCORE_MAX
    sd = lire_entier(donnees.get("score_dom"), mini=0, maxi=SCORE_MAX)
    se = lire_entier(donnees.get("score_ext"), mini=0, maxi=SCORE_MAX)
    if sd is None or se is None:
        return erreur(f"Les scores doivent être des entiers entre 0 et {SCORE_MAX}")

    buts = donnees.get("buts", [])
    cartons = donnees.get("cartons", [])
    if not isinstance(buts, list) or not isinstance(cartons, list):
        return erreur("Format des buts ou des cartons invalide")

    # 5. Minutes 1-120, couleur jaune/rouge, identifiants entiers (vérifié avant R3/R4 pour fiabiliser les calculs)
    propres_buts, propres_cartons = [], []
    for b in buts:
        if not isinstance(b, dict):
            return erreur("Format d'un but invalide")
        joueur_id = lire_entier(b.get("joueur_id"), mini=1)
        minute = lire_entier(b.get("minute"), mini=1, maxi=120)
        if joueur_id is None:
            return erreur("Chaque but doit avoir un buteur")
        if minute is None:
            return erreur("La minute d'un but doit être comprise entre 1 et 120")
        propres_buts.append({"joueur_id": joueur_id, "minute": minute})
    for c in cartons:
        if not isinstance(c, dict):
            return erreur("Format d'un carton invalide")
        joueur_id = lire_entier(c.get("joueur_id"), mini=1)
        minute = lire_entier(c.get("minute"), mini=1, maxi=120)
        if joueur_id is None:
            return erreur("Chaque carton doit avoir un joueur")
        if c.get("couleur") not in COULEURS_CARTON:
            return erreur("Couleur de carton invalide (jaune ou rouge)")
        if minute is None:
            return erreur("La minute d'un carton doit être comprise entre 1 et 120")
        propres_cartons.append({"joueur_id": joueur_id, "couleur": c["couleur"], "minute": minute})

    # 3. Chaque joueur appartient à l'équipe dom ou ext de ce match (R4 / R6)
    ids_dom = {r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (m["equipe_dom_id"],))}
    ids_ext = {r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (m["equipe_ext_id"],))}
    if any(x["joueur_id"] not in ids_dom | ids_ext for x in propres_buts + propres_cartons):
        return erreur("Un joueur n'appartient à aucune des deux équipes du match")

    # 4. Nombre de buts par équipe == score saisi (R3)
    buts_dom = sum(1 for b in propres_buts if b["joueur_id"] in ids_dom)
    buts_ext = sum(1 for b in propres_buts if b["joueur_id"] in ids_ext)
    if buts_dom != sd or buts_ext != se:
        return erreur(f"Les buteurs ({buts_dom}-{buts_ext}) ne correspondent pas au score ({sd}-{se})")

    # 6. Pas deux cartons rouges pour le même joueur dans le même match
    rouges = [c["joueur_id"] for c in propres_cartons if c["couleur"] == "rouge"]
    if len(rouges) != len(set(rouges)):
        return erreur("Un joueur ne peut pas recevoir deux cartons rouges dans le même match")

    # Écriture atomique : on remplace l'ancien résultat (permet de corriger)
    try:
        bd.execute("DELETE FROM buts WHERE match_id = ?", (match_id,))
        bd.execute("DELETE FROM cartons WHERE match_id = ?", (match_id,))
        bd.execute("UPDATE matchs SET score_dom=?, score_ext=?, joue=1 WHERE id=?", (sd, se, match_id))
        for b in propres_buts:
            bd.execute("INSERT INTO buts (match_id, joueur_id, minute) VALUES (?,?,?)",
                       (match_id, b["joueur_id"], b["minute"]))
        for c in propres_cartons:
            bd.execute("INSERT INTO cartons (match_id, joueur_id, couleur, minute) VALUES (?,?,?,?)",
                       (match_id, c["joueur_id"], c["couleur"], c["minute"]))
        bd.commit()
    except sqlite3.Error:
        bd.rollback()
        return erreur("Erreur d'enregistrement", 500)
    return jsonify(ok=True)


# ---------------------------------------------------------------------------
# Service du front compilé (toutes les routes non-API renvoient index.html)
# ---------------------------------------------------------------------------

@app.route("/", defaults={"chemin": ""})
@app.route("/<path:chemin>")
def front(chemin):
    if chemin.startswith("api/"):
        return erreur("Route inconnue", 404)
    fichier = os.path.join(DOSSIER_FRONT, chemin)
    if chemin and os.path.isfile(fichier):
        return send_from_directory(DOSSIER_FRONT, chemin)
    return send_from_directory(DOSSIER_FRONT, "index.html")


if __name__ == "__main__":
    app.run(debug=False)   # debug=False exigé dans la version rendue
