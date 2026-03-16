from django.urls import path
from core.views import auth_views

urlpatterns = [
    path("register", auth_views.register),
    path("login", auth_views.login),
    path("me", auth_views.me),
    path("google", auth_views.google_login),
    path("facebook", auth_views.facebook_login),
    path("apple", auth_views.apple_login),
    path("change-password", auth_views.change_password),
]
