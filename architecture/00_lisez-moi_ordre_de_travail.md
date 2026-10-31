# Projet 12 — Championnat de football de quartier (Bafoussam)
## Guide A→Z : React + Vite (front) + Flask/SQLite (API)

> Objectif : coder le projet **vite**, pour une **présentation** (pas de production).
> Ces fichiers sont conçus pour être donnés à un assistant de code (Claude Code, Cursor, etc.) **dans l'ordre**.

## 1. Décision d'architecture (à lire absolument)

Le sujet impose **Python 3 + Flask + SQLite** (module `sqlite3`) et des gabarits Jinja `base.html`.
Pour utiliser React + Vite sans perdre les points « fonctionnement serveur », « sécurité » et « API » :

| Couche | Technologie | Rôle |
|---|---|---|
| Base | SQLite (`projet.db`) | Données, contraintes, export SQL |
| API | Flask + `sqlite3` | Routes JSON, sessions admin, règles métier, sécurité |
| Front | React + Vite + React Router | Pages publiques et admin, tri, fetch |
| Livraison | `npm run build` puis Flask sert `frontend/dist` | **Une seule commande** : `python app.py` |

Résultat : l'enseignant n'a **pas besoin de Node** pour tester, car le front est déjà compilé.

### Risques à connaître (soyez honnêtes avec vous-mêmes)
1. **Gabarits Jinja / `base.html` / 404 Jinja / messages flash** : ils n'existent pas dans une SPA.
   Équivalents : composant `Layout` (= `base.html`), page `NotFound` (= 404), composant `Toast` (= flash).
   À **annoncer à l'enseignant** avant le rendu : c'est un écart par rapport au sujet.
2. **Validateur W3C** : il ne voit que le `index.html` vide d'une SPA. Solution : ouvrir la page, copier le
   HTML rendu (outil de développement → « Copier outerHTML »), puis utiliser l'onglet « Validate by direct input ».
3. **Matière « HTML/CSS/JS/Flask »** : si l'enseignant veut du pur HTML/Jinja, la version React est hors-sujet.
   Si vous avez le choix, demandez une validation écrite.

## 2. Ordre des fichiers

| # | Fichier | Contenu |
|---|---|---|
| 00 | `00_lisez-moi_ordre_de_travail.md` | Ce fichier |
| 01 | `01_cahier_des_charges.md` | Exigences et règles métier condensées |
| 02 | `02_base_de_donnees.md` | Arborescence, `schema.sql`, contraintes |
| 03 | `03_backend_flask_api.md` | Routes, SQL du classement, sécurité |
| 04 | `04_frontend_react_vite.md` | Pages, composants, CSS, fetch |
| 05 | `05_donnees_de_test.md` | `donnees_test.py`, calendrier, admin |
| 06 | `06_prompts_vibe_coding.md` | Prompts à copier-coller, étape par étape |
| 07 | `07_rendu_et_presentation.md` | README, clé USB, rapport PPT, vidéo, exposé |

## 3. Méthode rapide (≈ 1 journée)
1. Créer le dossier `projet/` et y coller les fichiers 01 à 05 dans un sous-dossier `docs/` (pour que l'assistant les lise).
2. Suivre `06_prompts_vibe_coding.md` prompt par prompt, **tester après chaque étape**.
3. Faire la checklist de `07_rendu_et_presentation.md`.
4. **Chaque membre du groupe doit comprendre le code** : la note peut être ajustée individuellement.
