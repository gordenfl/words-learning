"""
Django settings for setting (Words Learning API).
Uses Django MongoDB Backend - same logic as Node backend, Python implementation.
"""
import os
from pathlib import Path

# Load .env from project root (words-learning) or setting
try:
    from dotenv import load_dotenv
    for _path in [Path(__file__).resolve().parent.parent.parent / ".env", Path(__file__).resolve().parent.parent / ".env"]:
        if _path.exists():
            load_dotenv(_path)
            break
except ImportError:
    pass

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from project root (words-learning) or setting
def _env(key, default=None):
    return os.environ.get(key, default)

# SECURITY
SECRET_KEY = _env("DJANGO_SECRET_KEY", _env("JWT_SECRET", "default_secret_key"))
DEBUG = True
ALLOWED_HOSTS = _env("ALLOWED_HOSTS", "*").split(",")

# Application definition
INSTALLED_APPS = [
    "setting.apps.MongoContentTypesConfig",  # contenttypes with ObjectIdAutoField for MongoDB
    "setting.apps.MongoAuthConfig",         # auth for admin
    "setting.apps.MongoAdminConfig",         # admin
    "django.contrib.sessions",              # admin 登录需要
    "django.contrib.messages",              # admin 消息
    "django.contrib.staticfiles",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.auth_middleware.AuthMiddleware",
]

ROOT_URLCONF = "setting.urls"
WSGI_APPLICATION = "setting.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Django MongoDB Backend
DEFAULT_AUTO_FIELD = "django_mongodb_backend.fields.ObjectIdAutoField"

MONGODB_URI = _env("MONGODB_URI", "mongodb://localhost:27017/words-learning")
# 本地运行时若 URI 里是 Docker 主机名 mongodb，改为 localhost（配合 SSH 隧道）
if not os.path.exists("/.dockerenv"):
    if "//mongodb:" in MONGODB_URI or "@mongodb:" in MONGODB_URI:
        MONGODB_URI = MONGODB_URI.replace("//mongodb:", "//localhost:").replace("@mongodb:", "@localhost:")

DATABASES = {
    "default": {
        "ENGINE": "django_mongodb_backend",
        "NAME": "words-learning-python",
        "HOST": MONGODB_URI,
    }
}

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"

# CORS - allow all for API
CORS_ALLOW_ALL_ORIGINS = True

# Request body size (50MB for large images)
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024

# JWT
JWT_SECRET = _env("JWT_SECRET", "default_secret_key")
JWT_EXPIRY_DAYS = 7
