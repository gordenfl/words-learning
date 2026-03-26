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
echo "Health check (best-effort):"
if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://127.0.0.1:8088/api/health" || true
else
  echo "curl not installed; skipping health check"
fi

echo ""
echo "OK"

