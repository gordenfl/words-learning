from django.urls import path
from core.views import words_views

urlpatterns = [
    path("", words_views.word_list_or_create),
    path("stats", words_views.word_stats),
    path("batch", words_views.word_batch),
    path("generate-congrats", words_views.word_generate_congrats),
    path("<str:word_id>", words_views.word_detail_or_delete),
    path("<str:word_id>/status", words_views.word_update_status),
    path("<str:word_id>/generate-details", words_views.word_generate_details),
]
