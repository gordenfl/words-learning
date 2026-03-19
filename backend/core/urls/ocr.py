from django.urls import path
from core.views import ocr_views

urlpatterns = [
    path("extract", ocr_views.extract_file),
    path("extract-base64", ocr_views.extract_base64),
]
