#!/usr/bin/env bash
set -Eeuo pipefail

app_root="/opt/relationship-manager"
current_path="${app_root}/server"
releases_path="${app_root}/releases"
current="$(readlink -f "$current_path")"
previous="$({
  find "$releases_path" -mindepth 1 -maxdepth 1 -type d ! -path "$current" -printf '%T@ %p\n'
} | sort -nr | head -n 1 | cut -d' ' -f2-)"

if [[ -z "$previous" || ! -f "$previous/dist/main.js" || ! -f "$previous/.env" ]]; then
  echo "No valid previous release found" >&2
  echo "Current: $current" >&2
  find "$releases_path" -mindepth 1 -maxdepth 1 -type d -printf '%TY-%Tm-%Td %TH:%TM:%TS %p\n' | sort -r >&2
  exit 1
fi

echo "Current release:  $current"
echo "Rollback release: $previous"
ln -sfn "$previous" "$current_path"
systemctl restart relationship-manager.service

for attempt in {1..20}; do
  if curl -fsS http://127.0.0.1:3000/api/health; then
    echo
    echo "Rollback health check passed"
    exit 0
  fi
  sleep 1
done

systemctl status relationship-manager.service --no-pager -l || true
journalctl -u relationship-manager.service -n 80 --no-pager || true
echo "Rollback release did not become healthy" >&2
exit 1
