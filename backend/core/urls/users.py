from django.urls import path
from core.views import users_views

urlpatterns = [
    path("search/query", users_views.user_search),
    path("learning-plan", users_views.learning_plan),
    path("theme", users_views.theme_patch),
    path("profile", users_views.profile_patch),
    path("account", users_views.account_delete),
    path("<str:user_id>", users_views.user_profile),
    path("<str:user_id>/follow", users_views.follow_or_unfollow),
]
