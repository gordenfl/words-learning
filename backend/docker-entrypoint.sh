#!/bin/sh
set -e
cd /app
# Avoid crash loop: migrate needs Mongo; DNS/network may lag right after `docker compose up`.
python scripts/wait_for_mongodb.py
python manage.py migrate --noinput
exec "$@"
