"""Article model - same schema as Node/Mongoose backend."""
from django.db import models
from django_mongodb_backend.fields import EmbeddedModelArrayField, ObjectIdField
from django_mongodb_backend.models import EmbeddedModel


class TargetWordEmbed(EmbeddedModel):
    word = ObjectIdField()  # ref Word
    wordText = models.CharField(max_length=100, blank=True)


class Article(models.Model):
    userId = ObjectIdField()
    title = models.CharField(max_length=300)
    content = models.TextField()
    englishContent = models.TextField(blank=True, default="")
    targetWords = EmbeddedModelArrayField(TargetWordEmbed, default=list, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[("beginner", "beginner"), ("intermediate", "intermediate"), ("advanced", "advanced")],
        default="intermediate",
    )
    readAt = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = "articles"
        managed = False

    def __str__(self):
        return self.title
