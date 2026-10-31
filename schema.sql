-- Active les clés étrangères (à refaire à chaque connexion dans app.py)
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS cartons;
DROP TABLE IF EXISTS buts;
DROP TABLE IF EXISTS matchs;
DROP TABLE IF EXISTS joueurs;
DROP TABLE IF EXISTS equipes;
DROP TABLE IF EXISTS administrateurs;

CREATE TABLE administrateurs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    login     TEXT NOT NULL UNIQUE,
    empreinte TEXT NOT NULL
);

CREATE TABLE equipes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nom        TEXT NOT NULL UNIQUE,
    quartier   TEXT NOT NULL,
    entraineur TEXT NOT NULL,
    couleurs   TEXT NOT NULL,
    logo       TEXT                       -- nom de fichier dans static/images
);

CREATE TABLE joueurs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    equipe_id      INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    nom            TEXT NOT NULL,
    numero         INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 99),
    poste          TEXT NOT NULL CHECK (poste IN ('Gardien','Défenseur','Milieu','Attaquant')),
    date_naissance TEXT NOT NULL,         -- AAAA-MM-JJ
    UNIQUE (equipe_id, numero)            -- R7
);

CREATE TABLE matchs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    journee       INTEGER NOT NULL CHECK (journee >= 1),
    equipe_dom_id INTEGER NOT NULL REFERENCES equipes(id),
    equipe_ext_id INTEGER NOT NULL REFERENCES equipes(id),
    date_match    TEXT NOT NULL,          -- AAAA-MM-JJ
    stade         TEXT NOT NULL,
    score_dom     INTEGER CHECK (score_dom >= 0),
    score_ext     INTEGER CHECK (score_ext >= 0),
    joue          INTEGER NOT NULL DEFAULT 0 CHECK (joue IN (0,1)),
    CHECK (equipe_dom_id <> equipe_ext_id),             -- R5
    UNIQUE (equipe_dom_id, equipe_ext_id),              -- R5 (aller uniquement)
    CHECK ((joue = 0 AND score_dom IS NULL AND score_ext IS NULL)
        OR (joue = 1 AND score_dom IS NOT NULL AND score_ext IS NOT NULL))  -- R8
);

CREATE TABLE buts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id  INTEGER NOT NULL REFERENCES matchs(id)  ON DELETE CASCADE,
    joueur_id INTEGER NOT NULL REFERENCES joueurs(id) ON DELETE CASCADE,
    minute    INTEGER NOT NULL CHECK (minute BETWEEN 1 AND 120)
);

CREATE TABLE cartons (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id  INTEGER NOT NULL REFERENCES matchs(id)  ON DELETE CASCADE,
    joueur_id INTEGER NOT NULL REFERENCES joueurs(id) ON DELETE CASCADE,
    couleur   TEXT NOT NULL CHECK (couleur IN ('jaune','rouge')),
    minute    INTEGER NOT NULL CHECK (minute BETWEEN 1 AND 120)
);

CREATE INDEX idx_matchs_journee ON matchs(journee);
CREATE INDEX idx_buts_joueur    ON buts(joueur_id);
CREATE INDEX idx_cartons_joueur ON cartons(joueur_id);
