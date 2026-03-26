#!/bin/sh
set -e
cd /app
# Ensure auth, contenttypes, sessions (if used), and django_mongodb_backend tables exist
python manage.py migrate --noinput
exec "$@"
