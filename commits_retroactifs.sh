#!/usr/bin/env bash
# =============================================================================
# commits_retroactifs.sh
#
# Génération de commits Git rétrodatés répartis aléatoirement sur une période.
#
# Période cible par défaut : du 2026-10-04 au 2026-10-31 (inclus).
#
# Fonctionnement :
#   - Parcourt chaque jour de la période ;
#   - Pour chaque jour actif, génère entre MIN_COMMITS et MAX_COMMITS commits
#     à des horaires aléatoires compris dans la plage [START_HOUR, END_HOUR) ;
#   - Peut sauter aléatoirement certains jours (SKIP_DAY_PROBABILITY) pour
#     simuler une activité humaine naturelle ;
#   - Modifie le fichier LOG_FILE à chaque itération (garantit un delta réel) ;
#   - Définit GIT_AUTHOR_DATE et GIT_COMMITTER_DATE au format ISO 8601
#     (YYYY-MM-DDTHH:MM:SS) pour chaque commit.
#
# Exemple d'utilisation :
#   ./commits_retroactifs.sh -m "Championat : progression réaliste"
#   ./commits_retroactifs.sh -s 2026-10-04 -e 2026-10-31 \
#       -m "Développement plateau matchs" -f .activity_log -p 20
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration (modifiable via options en ligne de commande)
# -----------------------------------------------------------------------------
START_DATE="2026-10-04"
END_DATE="2026-10-31"
COMMIT_MSG="Mise à jour du suivi des matchs Championat"   # passez -m pour le personnaliser
LOG_FILE=".activity_log"
MIN_COMMITS=1
MAX_COMMITS=5
SKIP_DAY_PROBABILITY=20          # 0 = aucun jour sauté, 100 = tout skippé
START_HOUR=9
END_HOUR=19                      # heure d'exclusion (19:00 → commits jusqu'à 18:59:59)

# -----------------------------------------------------------------------------
# Aide
# -----------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $0 [options]

Options :
  -s DATE   Date de début (YYYY-MM-DD, défaut : $START_DATE)
  -e DATE   Date de fin   (YYYY-MM-DD, défaut : $END_DATE)
  -m MSG    Message de commit (défaut : "$COMMIT_MSG")
  -f FILE   Fichier d'état modifié à chaque commit (défaut : $LOG_FILE)
  -n N      Nombre minimum de commits par jour (défaut : $MIN_COMMITS)
  -x N      Nombre maximum de commits par jour (défaut : $MAX_COMMITS)
  -p N      Probabilité de sauter un jour, en % (0-100, défaut : $SKIP_DAY_PROBABILITY)
  -h        Affiche cette aide

Exemple :
  ./commits_retroactifs.sh -m "Développement module API" -f .activity_log -p 15
EOF
    exit 0
}

# -----------------------------------------------------------------------------
# Lecture des options
# -----------------------------------------------------------------------------
while getopts "s:e:m:f:n:x:p:h" opt; do
    case "$opt" in
        s) START_DATE="$OPTARG" ;;
        e) END_DATE="$OPTARG" ;;
        m) COMMIT_MSG="$OPTARG" ;;
        f) LOG_FILE="$OPTARG" ;;
        n) MIN_COMMITS="$OPTARG" ;;
        x) MAX_COMMITS="$OPTARG" ;;
        p) SKIP_DAY_PROBABILITY="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# -----------------------------------------------------------------------------
# Validations
# -----------------------------------------------------------------------------
if ! [[ "$START_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || \
   ! [[ "$END_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Erreur : les dates doivent être au format YYYY-MM-DD." >&2
    exit 1
fi

if ! command -v date >/dev/null 2>&1 || ! date -d "2026-10-04 + 1 day" >/dev/null 2>&1; then
    echo "Erreur : GNU date (coreutils) est requis pour les calculs de dates." >&2
    exit 1
fi

if ! [[ "$MIN_COMMITS" =~ ^[0-9]+$ ]] || ! [[ "$MAX_COMMITS" =~ ^[0-9]+$ ]] || \
   [ "$MIN_COMMITS" -lt 1 ] || [ "$MAX_COMMITS" -lt "$MIN_COMMITS" ]; then
    echo "Erreur : vérifiez MIN_COMMITS (>=1) et MAX_COMMITS (>= MIN_COMMITS)." >&2
    exit 1
fi

if ! [[ "$SKIP_DAY_PROBABILITY" =~ ^[0-9]+$ ]] || [ "$SKIP_DAY_PROBABILITY" -gt 100 ]; then
    echo "Erreur : SKIP_DAY_PROBABILITY doit être un entier entre 0 et 100." >&2
    exit 1
fi

if [ "$START_HOUR" -ge "$END_HOUR" ]; then
    echo "Erreur : START_HOUR doit être strictement inférieur à END_HOUR." >&2
    exit 1
fi

# Identité Git : on réutilise la config locale si disponible, sinon défaut.
GIT_USER_NAME=$(git config user.name 2>/dev/null || echo "Championat Dev")
GIT_USER_EMAIL=$(git config user.email 2>/dev/null || echo "dev@championat.local")

# -----------------------------------------------------------------------------
# Résumé avant exécution
# -----------------------------------------------------------------------------
END_DATE_PLUS_ONE=$(date -d "$END_DATE + 1 day" +%Y-%m-%d)
TOTAL_COMMITS=0
DAY_BATCH=0

echo "Période : $START_DATE -> $END_DATE"
echo "Message : $COMMIT_MSG"
echo "Fichier log : $LOG_FILE"
echo "Commits/jour : $MIN_COMMITS-$MAX_COMMITS | Skippage jour : $SKIP_DAY_PROBABILITY%"
echo "Plage horaire : ${START_HOUR}h00-${END_HOUR}h00"
echo "Identité Git : $GIT_USER_NAME <$GIT_USER_EMAIL>"
echo "---------------------------------------------------------------"

# -----------------------------------------------------------------------------
# Boucle principale sur chaque jour de la période
# -----------------------------------------------------------------------------
CURRENT_DATE="$START_DATE"

while [ "$CURRENT_DATE" != "$END_DATE_PLUS_ONE" ]; do
    # Option : saut aléatoire du jour pour un rendu naturel.
    if [ "$SKIP_DAY_PROBABILITY" -gt 0 ] && \
       [ $((RANDOM % 100)) -lt "$SKIP_DAY_PROBABILITY" ]; then
        echo "  --> jour sauté (aléatoire) : $CURRENT_DATE"
        CURRENT_DATE=$(date -d "$CURRENT_DATE + 1 day" +%Y-%m-%d)
        continue
    fi

    # Nombre de commits aujourd'hui : MIN + (0..MAX-MIN) => entre MIN et MAX inclus.
    RANGE=$((MAX_COMMITS - MIN_COMMITS + 1))
    DAILY_COMMITS=$((MIN_COMMITS + RANDOM % RANGE))

    # Génère DAILY_COMMITS horodatages uniques triés de façon croissante.
    DAY_SECONDS=$((END_HOUR * 3600 - START_HOUR * 3600))  # fenêtre en secondes
    TIMES=()
    for ((i = 0; i < DAILY_COMMITS; i++)); do
        OFFSET=$((RANDOM % DAY_SECONDS))
        TOTAL=$((START_HOUR * 3600 + OFFSET))
        TIMES+=("$TOTAL")
    done
    # Tri numérique croissant => commits chronologiques dans la journée.
    mapfile -t TIMES_SORTED < <(printf '%s\n' "${TIMES[@]}" | sort -n)

    echo ">> $CURRENT_DATE : $DAILY_COMMITS commit(s)"

    for TOTAL in "${TIMES_SORTED[@]}"; do
        HOUR=$((TOTAL / 3600))
        MIN=$(((TOTAL % 3600) / 60))
        SEC=$((TOTAL % 60))

        FULL_DATE=$(printf "%sT%02d:%02d:%02d" "$CURRENT_DATE" "$HOUR" "$MIN" "$SEC")

        # Modifie le fichier d'état pour garantir un delta réel.
        echo "Update $FULL_DATE" >> "$LOG_FILE"

        git add "$LOG_FILE"

        GIT_AUTHOR_DATE="$FULL_DATE" GIT_COMMITTER_DATE="$FULL_DATE" \
        git -c user.name="$GIT_USER_NAME" -c user.email="$GIT_USER_EMAIL" \
            commit -m "$COMMIT_MSG" --quiet

        echo "  + commit : $FULL_DATE"
        TOTAL_COMMITS=$((TOTAL_COMMITS + 1))
    done

    DAY_BATCH=$((DAY_BATCH + 1))
    CURRENT_DATE=$(date -d "$CURRENT_DATE + 1 day" +%Y-%m-%d)
done

echo "---------------------------------------------------------------"
echo "Terminé : $TOTAL_COMMITS commit(s) créés sur $DAY_BATCH jour(s)."
