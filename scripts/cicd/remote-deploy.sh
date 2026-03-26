#!/usr/bin/env bash
set -euo pipefail

echo "Deploying words-learning on $(hostname) in $(pwd)"

if [ ! -f docker-compose.yml ]; then
  echo "ERROR: docker-compose.yml not found in $(pwd)"
  exit 1
fi

if [ ! -f .env ]; then
  echo "WARNING: .env not found. Docker will use environment defaults."
fi

REQUIRED_NET="${PHOTOSHARE_NETWORK_NAME:-docker_photoshare-network}"
if ! docker network inspect "$REQUIRED_NET" >/dev/null 2>&1; then
  echo "ERROR: Docker network '$REQUIRED_NET' does not exist."
  echo "  The backend joins this network to reach Mongo (and other stacks on the same host)."
  echo "  Create it once: docker network create $REQUIRED_NET"
  echo "  Or run the photoshare / mongo compose stack that defines this network."
  exit 1
fi

COMPOSE_BIN=""
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_BIN="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_BIN="docker compose"
else
  echo "ERROR: Neither docker-compose nor docker compose is available."
  exit 1
fi

echo "Using compose: $COMPOSE_BIN"

# Pull/build and restart backend container only
$COMPOSE_BIN up -d --build backend

echo ""
echo "Containers:"
$COMPOSE_BIN ps

echo ""
echo "Health check:"
if command -v curl >/dev/null 2>&1; then
  for i in 1 2 3 4 5; do
    if out=$(curl -fsS --max-time 8 "http://127.0.0.1:8088/api/health" 2>/dev/null); then
      echo "$out"
      echo ""
      echo "OK (listening on 127.0.0.1:8088 on this host)"
      echo ""
      echo "Public access checklist:"
      echo "  - Open cloud security group / firewall: inbound TCP 8088"
      echo "  - URL must include port: http://YOUR_DOMAIN:8088/ (port 80 will not hit this service)"
      echo "  - Keep server .env out of git; deploy must not remove it (workflow uses rsync protect)"
      exit 0
    fi
    echo "  attempt $i failed, retrying..."
    sleep 2
  done
  echo "ERROR: /api/health did not return success after 5 tries."
  echo "  Run: $COMPOSE_BIN logs --tail=80 backend"
  exit 1
else
  echo "curl not installed; skipping health check"
fi

echo ""
echo "OK"

