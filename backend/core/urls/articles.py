from django.urls import path
from core.views import articles_views

urlpatterns = [
    path("", articles_views.article_list),
    path("generate", articles_views.article_generate),
    path("<str:article_id>/read", articles_views.article_mark_read),
]
