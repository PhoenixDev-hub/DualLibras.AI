#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?Configure DATABASE_URL no Render}"
: "${JWT_SECRET:?Configure JWT_SECRET no Render}"
: "${AI_INTERNAL_TOKEN:?Configure AI_INTERNAL_TOKEN no Render}"
export PORT="${PORT:-10000}"
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1024 || PORT > 65535 || PORT == 4000 || PORT == 5455 )); then
  echo 'PORT deve estar entre 1024 e 65535, exceto 4000 e 5455' >&2
  exit 1
fi
envsubst '${PORT}' < /app/deploy/nginx.conf.template > /tmp/duallibras-nginx.conf
nginx -t -c /tmp/duallibras-nginx.conf

pids=()
cleanup() {
  trap - EXIT TERM INT
  if (( ${#pids[@]} )); then
    kill "${pids[@]}" 2>/dev/null || true
    # Bound graceful shutdown if a provider or database connection hangs.
    (sleep 8; kill -KILL "${pids[@]}" 2>/dev/null || true) &
    local watchdog=$!
    wait "${pids[@]}" 2>/dev/null || true
    kill "$watchdog" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 0' TERM INT
(cd /app/auth && PORT=4000 exec node dist/server.js) &
pids+=("$!")
(cd /app/ai && PORT=5455 exec python main.py) &
pids+=("$!")
nginx -c /tmp/duallibras-nginx.conf -g 'daemon off;' &
pids+=("$!")
# Any child exit invalidates the combined service, even a successful exit.
wait -n "${pids[@]}" || true
echo 'Um dos serviços encerrou; reinicialização do container necessária.' >&2
exit 1
