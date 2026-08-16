#!/usr/bin/env bash
set -Eeuo pipefail

app_root="/opt/relationship-manager"
current_path="${app_root}/server"
target="${1:-${app_root}/releases/1.4.3-20260816-200936}"
version="${2:-1.4.3}"
template_id="TNDeCEq2sRHrJrbw_ZloWQfqlRNOyjXBfuwsWEySDp8"
previous="$(readlink -f "$current_path")"
stamp="$(date +%Y%m%d-%H%M%S)"
activated=0

rollback() {
  local exit_code=$?
  if [[ "$activated" -eq 1 ]]; then
    echo "Activation failed; restoring ${previous}" >&2
    ln -sfn "$previous" "$current_path"
    systemctl restart relationship-manager.service || true
  fi
  exit "$exit_code"
}
trap rollback ERR

for release in "$previous" "$target"; do
  if [[ ! -f "$release/.env" || ! -f "$release/dist/main.js" ]]; then
    echo "Invalid release: $release" >&2
    exit 1
  fi
  cp -p "$release/.env" "$release/.env.backup-$stamp"
  sed -i '/^WECHAT_REMINDER_TEMPLATE_ID=/d' "$release/.env"
  printf '\nWECHAT_REMINDER_TEMPLATE_ID="%s"\n' "$template_id" >> "$release/.env"
done

ln -sfn "$target" "$current_path"
activated=1
systemctl restart relationship-manager.service

for attempt in {1..30}; do
  if health="$(curl -fsS http://127.0.0.1:3000/api/health)"; then
    if [[ "$health" == *'"status":"healthy"'* && "$health" == *"\"version\":\"${version}\""* ]]; then
      activated=0
      trap - ERR
      echo "$health"
      echo "Activation complete: $target"
      exit 0
    fi
  fi
  sleep 1
done

journalctl -u relationship-manager.service -n 100 --no-pager || true
echo "Health check failed for ${target}" >&2
false
