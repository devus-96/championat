# 01 — Cahier des charges condensé (Projet 12)

## Contexte
Tournoi de vacances entre équipes de quartiers de Bafoussam. Site officiel : calendrier, résultats, classement, buteurs.

## Utilisateurs
- **Visiteur** : consulte tout, ne modifie rien.
- **Administrateur** (connexion) : saisit les résultats, gère équipes et joueurs.

## Fonctionnalités

### Partie publique
- Calendrier et résultats **par journée**
- **Classement général** (calculé, jamais saisi)
- **Fiche d'équipe** : effectif + résultats
- **Classement des buteurs**
- Joueurs suspendus (statistique)

### Administration (connexion obligatoire)
- Saisie du résultat d'un match **avec ses buteurs et ses cartons**
- CRUD équipes et joueurs (ajout, modification, suppression, **tout en POST**)

### JavaScript / API
- Tri du classement au clic sur une colonne
- Mise à jour du classement sans rechargement (`fetch` sur `/api/classement`)
- `/api/buteurs`
- Vérification d'au moins un formulaire avant envoi (ex. formulaire de résultat, connexion)

## Statistiques attendues
1. Classement : Pts (3/1/0), J, G, N, P, BP, BC, Diff
2. 10 meilleurs buteurs
3. Meilleure attaque et meilleure défense
4. Joueurs suspendus (2 jaunes **ou** 1 rouge)

## Règles métier (le vrai cœur du projet, à tester une par une)
- R1 — Le classement est **calculé depuis les matchs** joués.
- R2 — Égalité de points : **différence de buts**, puis **buts marqués**.
- R3 — Les buts enregistrés pour une équipe **= score saisi** pour cette équipe.
- R4 — Un buteur appartient à **l'une des deux équipes** du match.
- R5 — Une équipe ne joue pas contre elle-même ; un match aller est unique par couple (dom, ext).
- R6 — Un joueur sanctionné ne peut pas recevoir un carton dans un match où il n'est pas dans l'une des deux équipes.
- R7 — Nom d'équipe **unique** ; numéro de maillot unique **dans une équipe**.
- R8 — Un match non joué n'a pas de score, ne compte pas au classement et n'a ni buts ni cartons.

## Volumes de test minimum
10 équipes, 180 joueurs, 45 matchs aller (9 journées de 5), dont 25 joués, avec buts et cartons.

## Exigences techniques communes (checklist)
- [ ] Flask + SQLite, ≥ 3 tables liées (clés étrangères) avec NOT NULL / UNIQUE / CHECK
- [ ] Mot de passe admin haché (`generate_password_hash`)
- [ ] ≥ 2 routes renvoyant du JSON (`jsonify`)
- [ ] Requêtes SQL **toujours paramétrées** (`?`)
- [ ] Modifications/suppressions **uniquement en POST**
- [ ] Toutes les données **revérifiées côté serveur**
- [ ] `debug=False` dans la version rendue
- [ ] HTML sémantique, `alt` sur chaque image, `label` sur chaque champ
- [ ] CSS mobile d'abord, ≥ 2 points de rupture
- [ ] Code commenté **en français**, fonctions aux noms clairs
