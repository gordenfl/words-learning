from django.urls import path
from core.views import speech_views

urlpatterns = [
    path("recognize", speech_views.recognize_file),
    path("recognize-base64", speech_views.recognize_base64),
]
