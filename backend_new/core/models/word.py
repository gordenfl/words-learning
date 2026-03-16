"""Word model - same schema as Node/Mongoose backend."""
from django.db import models
from django_mongodb_backend.fields import EmbeddedModelArrayField, ObjectIdField
from django_mongodb_backend.models import EmbeddedModel


class CompoundEmbed(EmbeddedModel):
    word = models.CharField(max_length=100)
    pinyin = models.CharField(max_length=200, blank=True)
    meaning = models.CharField(max_length=300, blank=True)


class ExampleEmbed(EmbeddedModel):
    chinese = models.TextField()
    pinyin = models.CharField(max_length=500, blank=True)
    english = models.CharField(max_length=500, blank=True)


class Word(models.Model):
    userId = ObjectIdField()
    word = models.CharField(max_length=100)
    pinyin = models.CharField(max_length=200, blank=True)
    translation = models.CharField(max_length=500, blank=True)
    definition = models.CharField(max_length=500, blank=True)
    compounds = EmbeddedModelArrayField(CompoundEmbed, default=list, blank=True)
    examples = EmbeddedModelArrayField(ExampleEmbed, default=list, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[("beginner", "beginner"), ("intermediate", "intermediate"), ("advanced", "advanced")],
        default="intermediate",
    )
    status = models.CharField(
        max_length=20,
        choices=[("unknown", "unknown"), ("known", "known")],
        default="unknown",
    )
    sourceImage = models.CharField(max_length=500, blank=True)
    addedAt = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    learnedAt = models.DateTimeField(null=True, blank=True)
    reviewCount = models.IntegerField(default=0)
    lastReviewedAt = models.DateTimeField(null=True, blank=True)
    nextReviewAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "words"
        managed = False

    def __str__(self):
        return self.word
