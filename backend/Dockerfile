# Explicit Python 3.11 so Django 6.x is available (Django 6 requires 3.10+)
FROM python:3.11.9-slim-bookworm

WORKDIR /app

# Build deps for bcrypt / cryptography (then remove to keep image smaller)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (upgrade pip for latest package index)
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn \
    && python -m gunicorn --version

# Copy project code (build context is ./backend)
COPY . .
RUN chmod +x /app/docker-entrypoint.sh

# Admin/static assets for production (DEBUG=False)
ENV DJANGO_SETTINGS_MODULE=setting.settings
RUN python manage.py collectstatic --noinput

# Default: run gunicorn (bind all interfaces for Docker)
ENV PORT=8088
EXPOSE 8088
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "python -m gunicorn setting.wsgi:application -b 0.0.0.0:${PORT:-8088} -w 2 --timeout 120"]

