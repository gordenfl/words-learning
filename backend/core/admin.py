"""Register app models in Django admin (MongoDB collections: users, words, articles)."""
from django.contrib import admin

from core.models import Article, User, Word


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "authProvider", "theme", "createdAt")
    list_filter = ("authProvider", "theme")
    search_fields = ("username", "email")
    ordering = ("-createdAt",)
    # Embedded / array fields: admin widgets are unreliable; keep list/search useful.
    exclude = (
        "profile",
        "learningPlan",
        "achievements",
        "rewards",
        "followers",
        "following",
        "blocked",
    )
    def get_readonly_fields(self, request, obj=None):
        base = ("id", "createdAt")
        if obj is not None:
            return base + ("password",)
        return base


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ("id", "word", "userId", "status", "difficulty", "addedAt")
    list_filter = ("status", "difficulty")
    search_fields = ("word", "translation", "definition")
    ordering = ("-addedAt",)
    exclude = ("compounds", "examples")
    readonly_fields = ("id", "addedAt")


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "userId", "completed", "difficulty", "createdAt")
    list_filter = ("completed", "difficulty")
    search_fields = ("title", "content")
    ordering = ("-createdAt",)
    exclude = ("targetWords",)
    readonly_fields = ("id", "createdAt")
