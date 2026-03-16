"""URL configuration - same API paths as Node backend."""
from django.urls import path, include

urlpatterns = [
    path("api/auth/", include("core.urls.auth")),
    path("api/words/", include("core.urls.words")),
    path("api/users/", include("core.urls.users")),
    path("api/articles/", include("core.urls.articles")),
    path("api/ocr/", include("core.urls.ocr")),
    path("api/speech/", include("core.urls.speech")),
    path("api/health", include("core.urls.health")),
]
