#!/usr/bin/env bash
set -Eeuo pipefail

archive="${1:?Usage: deploy-linux.sh <archive> [version]}"
version="${2:-1.4.0}"
app_root="/opt/relationship-manager"
current_path="${app_root}/server"
stamp="$(date +%Y%m%d-%H%M%S)"
release_path="${app_root}/releases/${version}-${stamp}"
backup_path="${app_root}/backups/${stamp}"
backup_helper="$(dirname "$0")/backup-mysql.js"
activated=0
previous_path=""

rollback() {
  local exit_code=$?
  if [[ "$activated" -eq 1 && -n "$previous_path" && -d "$previous_path" ]]; then
    echo "Deployment failed after activation; restoring ${previous_path}"
    ln -sfn "$previous_path" "$current_path"
    systemctl restart relationship-manager.service || true
  fi
  exit "$exit_code"
}
trap rollback ERR

if [[ ! -f "$archive" ]]; then
  echo "Release archive not found: $archive" >&2
  exit 2
fi
if [[ ! -f "$current_path/.env" ]]; then
  echo "Current production environment file is missing" >&2
  exit 2
fi

install -d -m 0755 "${app_root}/releases" "${app_root}/backups" "$release_path"
install -d -m 0700 "$backup_path"

echo "[1/7] Backing up production database"
node "$backup_helper" "$current_path/.env" "$backup_path/database.sql"

echo "[2/7] Extracting release ${version}"
tar -xzf "$archive" -C "$release_path"
cp -p "$current_path/.env" "$release_path/.env"

echo "[3/7] Installing dependencies"
cd "$release_path"
npm ci

echo "[4/7] Generating Prisma client and running checks"
npx prisma generate
npm run check

echo "[5/7] Applying production migrations"
npx prisma migrate deploy
npm prune --omit=dev

echo "[6/7] Activating release"
if [[ -L "$current_path" ]]; then
  previous_path="$(readlink -f "$current_path")"
else
  previous_path="${app_root}/releases/previous-${stamp}"
  mv "$current_path" "$previous_path"
fi
ln -sfn "$release_path" "$current_path"
activated=1
systemctl restart relationship-manager.service

echo "[7/7] Verifying local health"
for attempt in {1..20}; do
  if health="$(curl -fsS http://127.0.0.1:3000/api/health)"; then
    if [[ "$health" == *"\"status\":\"healthy\""* && "$health" == *"\"version\":\"${version}\""* ]]; then
      activated=0
      trap - ERR
      echo "$health"
      echo "Deployment complete"
      echo "Release: $release_path"
      echo "Database backup: $backup_path/database.sql"
      echo "Previous release: $previous_path"
      exit 0
    fi
  fi
  sleep 1
done

echo "Health check did not report version ${version}" >&2
false
