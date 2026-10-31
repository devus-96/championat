# 03 — Backend Flask : routes, règles métier, sécurité

## Tableau des routes (à reprendre dans la diapositive 7)

### Publiques (GET, JSON)
| Adresse | Méthode | Rôle |
|---|---|---|
| `/api/equipes` | GET | Liste des équipes |
| `/api/equipes/<id>` | GET | Fiche équipe : infos, effectif, résultats |
| `/api/journees` | GET | Liste des numéros de journée |
| `/api/matchs?journee=N` | GET | Matchs d'une journée (avec noms d'équipes) |
| `/api/matchs/<id>` | GET | Détail d'un match : buts et cartons |
| `/api/classement` | GET | Classement calculé (+ `?tri=pts&ordre=desc` optionnel) |
| `/api/buteurs` | GET | Classement des buteurs (`?limite=10`) |
| `/api/statistiques` | GET | Meilleure attaque/défense, suspendus |

### Authentification
| Adresse | Méthode | Rôle |
|---|---|---|
| `/api/admin/connexion` | POST | Connexion (login + mot de passe) |
| `/api/admin/deconnexion` | POST | Déconnexion |
| `/api/admin/moi` | GET | Dit si la session est connectée |

### Administration (décorateur `connexion_requise`, **POST** uniquement pour modifier)
| Adresse | Méthode | Rôle |
|---|---|---|
| `/api/admin/equipes/ajouter` | POST | Ajouter une équipe |
| `/api/admin/equipes/<id>/modifier` | POST | Modifier une équipe |
| `/api/admin/equipes/<id>/supprimer` | POST | Supprimer une équipe (refusée si elle a des matchs joués) |
| `/api/admin/joueurs/ajouter` | POST | Ajouter un joueur |
| `/api/admin/joueurs/<id>/modifier` | POST | Modifier un joueur |
| `/api/admin/joueurs/<id>/supprimer` | POST | Supprimer un joueur |
| `/api/admin/matchs/<id>/resultat` | POST | Saisir le résultat + buteurs + cartons |

## Squelette `app.py` (point de départ)

```python
# app.py : API du championnat + service du front React compilé
import os
import sqlite3
from functools import wraps

from flask import Flask, jsonify, request, session, send_from_directory, g
from werkzeug.security import check_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
CHEMIN_BD = os.path.join(BASE, "projet.db")
DOSSIER_FRONT = os.path.join(BASE, "frontend", "dist")

app = Flask(__name__, static_folder=os.path.join(BASE, "static"))
app.secret_key = "cle-de-presentation-a-changer"   # suffisant pour une démonstration
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")


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
    return jsonify(erreur=message), code


# ... routes ici ...

# --- Service du front compilé (toutes les routes non-API renvoient index.html) ---
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
```

## Le classement (R1 + R2) — requête SQL clé

```sql
WITH lignes AS (
    SELECT equipe_dom_id AS equipe_id, score_dom AS bp, score_ext AS bc
      FROM matchs WHERE joue = 1
    UNION ALL
    SELECT equipe_ext_id,              score_ext,       score_dom
      FROM matchs WHERE joue = 1
)
SELECT e.id, e.nom, e.logo,
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
 ORDER BY pts DESC, diff DESC, bp DESC, e.nom ASC;
```

Pour le **tri au clic** côté React : trier le tableau reçu **en JavaScript** (le tri par défaut vient du SQL ci-dessus).
Si on veut un tri côté serveur, valider la colonne avec une **liste blanche** (jamais de colonne issue du client dans le SQL) :

```python
COLONNES_TRI = {"pts", "j", "g", "n", "p", "bp", "bc", "diff", "nom"}
```

## Buteurs

```sql
SELECT j.id, j.nom, e.nom AS equipe, COUNT(b.id) AS buts
  FROM buts b
  JOIN joueurs j ON j.id = b.joueur_id
  JOIN equipes e ON e.id = j.equipe_id
 GROUP BY j.id
 ORDER BY buts DESC, j.nom ASC
 LIMIT ?;
```

## Meilleure attaque / meilleure défense
Réutiliser la requête du classement : meilleure attaque = plus grand `bp`, meilleure défense = plus petit `bc` (parmi les équipes avec `j > 0`).

## Joueurs suspendus (2 jaunes ou 1 rouge)

```sql
SELECT j.id, j.nom, e.nom AS equipe,
       SUM(c.couleur = 'jaune') AS jaunes,
       SUM(c.couleur = 'rouge') AS rouges
  FROM cartons c
  JOIN joueurs j ON j.id = c.joueur_id
  JOIN equipes e ON e.id = j.equipe_id
 GROUP BY j.id
HAVING jaunes >= 2 OR rouges >= 1;
```

## La route la plus importante : saisie du résultat

`POST /api/admin/matchs/<id>/resultat` — corps JSON :

```json
{
  "score_dom": 2, "score_ext": 1,
  "buts":    [ {"joueur_id": 12, "minute": 14}, {"joueur_id": 15, "minute": 60}, {"joueur_id": 88, "minute": 77} ],
  "cartons": [ {"joueur_id": 90, "couleur": "jaune", "minute": 33} ]
}
```

### Vérifications serveur (dans cet ordre, message clair à chaque échec)
1. Le match existe.
2. `score_dom` et `score_ext` sont des **entiers ≥ 0** (et raisonnables, ex. ≤ 30).
3. Chaque `joueur_id` (but ou carton) **appartient à l'équipe dom ou ext** de ce match (**R4/R6**).
4. Nombre de buts des joueurs de l'équipe domicile **== score_dom**, idem extérieur (**R3**).
5. Minutes entre 1 et 120 ; couleur dans `{'jaune','rouge'}`.
6. Un même joueur ne reçoit pas **2 rouges** dans le même match.

### Écriture atomique
```python
bd = obtenir_bd()
try:
    bd.execute("DELETE FROM buts WHERE match_id = ?", (match_id,))      # permet de corriger un résultat
    bd.execute("DELETE FROM cartons WHERE match_id = ?", (match_id,))
    bd.execute("UPDATE matchs SET score_dom=?, score_ext=?, joue=1 WHERE id=?", (sd, se, match_id))
    for b in buts:
        bd.execute("INSERT INTO buts (match_id, joueur_id, minute) VALUES (?,?,?)", (match_id, b["joueur_id"], b["minute"]))
    for c in cartons:
        bd.execute("INSERT INTO cartons (match_id, joueur_id, couleur, minute) VALUES (?,?,?,?)",
                   (match_id, c["joueur_id"], c["couleur"], c["minute"]))
    bd.commit()
except sqlite3.Error:
    bd.rollback()
    return erreur("Erreur d'enregistrement", 500)
```

### Vérification R3/R4 (idée de code)
```python
ids_dom = {r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (m["equipe_dom_id"],))}
ids_ext = {r["id"] for r in bd.execute("SELECT id FROM joueurs WHERE equipe_id = ?", (m["equipe_ext_id"],))}
buts_dom = sum(1 for b in buts if b["joueur_id"] in ids_dom)
buts_ext = sum(1 for b in buts if b["joueur_id"] in ids_ext)
if any(b["joueur_id"] not in ids_dom | ids_ext for b in buts + cartons):
    return erreur("Un joueur n'appartient à aucune des deux équipes du match")
if buts_dom != sd or buts_ext != se:
    return erreur(f"Les buteurs ({buts_dom}-{buts_ext}) ne correspondent pas au score ({sd}-{se})")
```

## Connexion

```python
@app.post("/api/admin/connexion")
def connexion():
    donnees = request.get_json(silent=True) or {}
    login = str(donnees.get("login", "")).strip()
    mdp = str(donnees.get("mot_de_passe", ""))
    ligne = obtenir_bd().execute("SELECT * FROM administrateurs WHERE login = ?", (login,)).fetchone()
    if ligne is None or not check_password_hash(ligne["empreinte"], mdp):
        return erreur("Identifiants incorrects", 401)
    session.clear()
    session["admin_id"] = ligne["id"]
    return jsonify(ok=True)
```

## Sécurité — ce qu'il faut pouvoir montrer
- Requêtes **paramétrées** partout (`?`) ; aucune concaténation de texte dans le SQL.
- Colonnes de tri : **liste blanche**.
- Mots de passe : `generate_password_hash` / `check_password_hash`.
- Routes admin : `connexion_requise`, modifications **en POST seulement**.
- Validation serveur de **chaque** champ (types, bornes, existence).
- `debug=False`.
- React échappe le contenu par défaut : **jamais** `dangerouslySetInnerHTML`.
- Démonstration de saisie refusée : essayer un score 3-0 avec seulement 2 buteurs → message d'erreur.

## Erreurs 404
- Route API inconnue : JSON `{"erreur": "Route inconnue"}` + code 404.
- Page front inconnue : composant `NotFound` de React.
