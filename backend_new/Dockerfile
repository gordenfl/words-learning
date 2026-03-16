FROM python:3.11-slim

WORKDIR /app

# Build deps for bcrypt / cryptography (then remove to keep image smaller)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project code (backend_new as context root)
COPY . .

# Default: run gunicorn (bind all interfaces for Docker)
ENV PORT=8088
EXPOSE 8088
CMD ["sh", "-c", "gunicorn backend_new.wsgi:application -b 0.0.0.0:${PORT:-8088} -w 2 --timeout 120"]
