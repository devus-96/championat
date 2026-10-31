# 06 — Prompts à copier-coller (dans l'ordre)

> Pré-requis : dossier `projet/docs/` contenant les fichiers 01 à 05.
> Règle d'or : **ne passez au prompt suivant qu'après avoir testé le précédent.**
> Ajoutez à chaque prompt : « Commente le code en français, noms de fonctions clairs. »

---

## Prompt 0 — Contexte (à coller une fois au début de la session)
```
Tu vas m'aider à coder le projet 12 "Championnat de football de quartier".
Lis d'abord docs/01_cahier_des_charges.md, docs/02_base_de_donnees.md, docs/03_backend_flask_api.md,
docs/04_frontend_react_vite.md et docs/05_donnees_de_test.md. Résume-moi en 10 lignes ce que tu as compris,
sans écrire de code. Contraintes : Flask + sqlite3 (requêtes paramétrées), React + Vite + React Router,
code commenté en français, projet destiné à une démonstration (pas de production).
```

## Prompt 1 — Base de données et données de test
```
Crée schema.sql exactement comme dans docs/02_base_de_donnees.md et donnees_test.py comme dans
docs/05_donnees_de_test.md. Crée aussi exporter.py et requirements.txt (flask). Exécute donnees_test.py,
vérifie les volumes (10 équipes, 180 joueurs, 45 matchs dont 25 joués) et lance la requête de cohérence R3
(elle doit renvoyer 0 ligne). Corrige tout problème.
```

## Prompt 2 — API publique
```
Crée app.py (squelette de docs/03_backend_flask_api.md) avec toutes les routes PUBLIQUES GET :
/api/equipes, /api/equipes/<id>, /api/journees, /api/matchs, /api/matchs/<id>, /api/classement,
/api/buteurs, /api/statistiques. Le classement doit utiliser la requête SQL du fichier 03
(Pts 3/1/0, départage différence de buts puis buts marqués). Teste chaque route avec curl et montre-moi
un extrait de /api/classement. Vérifie à la main que les points et la différence de buts sont corrects
pour une équipe.
```

## Prompt 3 — Authentification et administration
```
Ajoute la connexion admin (session, check_password_hash), le décorateur connexion_requise, et les routes
admin en POST : CRUD équipes et joueurs, et /api/admin/matchs/<id>/resultat avec TOUTES les vérifications
R3, R4, R6 décrites dans docs/03. Messages d'erreur clairs en français. Teste avec curl : une saisie valide,
puis une saisie refusée (score 3-0 avec 2 buteurs), puis un joueur d'une autre équipe, puis un appel sans connexion (401).
```

## Prompt 4 — Squelette React
```
Dans projet/, crée le front avec Vite (frontend/), installe react-router-dom, configure le proxy /api
et /static vers 127.0.0.1:5000. Crée api.js, App.jsx avec toutes les routes du plan du site (docs/04),
Layout.jsx (en-tête, navigation responsive avec menu hamburger sous 640 px, pied de page), Toast.jsx
et NotFound.jsx. CSS mobile d'abord avec au moins 2 points de rupture (640 px et 1024 px).
HTML sémantique, aucun dangerouslySetInnerHTML.
```

## Prompt 5 — Pages publiques
```
Implémente les pages publiques : Accueil, Calendrier (sélecteur de journée labellisé), Match, Classement
(tri au clic sur chaque colonne avec aria-sort, bouton Actualiser qui refait le fetch sur /api/classement),
Equipes, Equipe, Buteurs, Statistiques. Chaque image a un alt, chaque champ a un label.
Tableaux dans un conteneur à défilement horizontal sur mobile. États de chargement et d'erreur visibles.
```

## Prompt 6 — Administration côté React
```
Implémente l'admin : Connexion (vérification JS avant envoi), ProtectedRoute (appel /api/admin/moi),
Tableau de bord, liste des matchs, SaisieResultat (ajout dynamique de buteurs et cartons par équipe,
vérification JS : nombre de buteurs == score, minutes 1-120), gestion des équipes et joueurs
(modifier/supprimer en POST avec confirmation). Affiche les erreurs du serveur dans un Toast.
```

## Prompt 7 — Finitions et robustesse
```
Passe en revue : accessibilité (labels, alt, focus visible, contrastes), titres de pages (document.title),
affichage sur écran 360 px, gestion des listes vides, messages d'erreur. Ajoute des logos simples
(SVG générés, couleurs de l'équipe) dans static/images et les "alt" correspondants. Ne casse rien.
```

## Prompt 8 — Build et livraison
```
Fais npm run build, puis vérifie que python app.py sert bien le site sur http://127.0.0.1:5000, y compris
au rafraîchissement d'une page profonde comme /equipes/3. Mets debug=False. Écris README.md selon
docs/07_rendu_et_presentation.md et teste le parcours d'installation depuis un dossier vierge
(sans venv ni node_modules).
```

## Prompt 9 — Revue de sécurité (très utile pour la note)
```
Fais une revue de sécurité de app.py : cherche toute requête SQL non paramétrée, tout champ non validé,
toute route de modification en GET, toute route admin sans connexion_requise, tout usage de
dangerouslySetInnerHTML ou innerHTML côté React. Liste ce que tu trouves et corrige.
```

## Prompt 10 — Préparer l'exposé
```
Génère la liste des 15 questions qu'un enseignant pourrait poser sur ce projet (routes, SQL du classement,
règle R3, tri JS, pourquoi UNIQUE, pourquoi des requêtes paramétrées...) avec les réponses courtes,
en t'appuyant sur notre code réel (cite fichiers et fonctions).
```

---

## Astuces
- Un bug ? Donner à l'assistant **l'erreur exacte** + le fichier concerné.
- Si l'assistant réinvente une règle : « Relis docs/01, règle R2 ».
- Faire un `git init` et un commit après chaque prompt réussi pour pouvoir revenir en arrière.
