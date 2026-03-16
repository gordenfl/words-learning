"""WSGI config for backend_new project."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend_new.settings")
application = get_wsgi_application()
