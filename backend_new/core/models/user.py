"""User model - same schema as Node/Mongoose backend."""
import bcrypt
from django.db import models
from django.contrib.auth.hashers import check_password as django_check_password
from django_mongodb_backend.fields import (
    ArrayField,
    EmbeddedModelField,
    EmbeddedModelArrayField,
    ObjectIdField,
)
from django_mongodb_backend.models import EmbeddedModel


class ProfileEmbed(EmbeddedModel):
    displayName = models.CharField(max_length=255, blank=True)
    avatar = models.CharField(max_length=500, blank=True)
    bio = models.TextField(blank=True)


class LearningPlanEmbed(EmbeddedModel):
    dailyWordGoal = models.IntegerField(default=10)
    weeklyWordGoal = models.IntegerField(default=50)
    monthlyWordGoal = models.IntegerField(default=200)
    preferredStudyTime = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[("beginner", "beginner"), ("intermediate", "intermediate"), ("advanced", "advanced")],
        default="intermediate",
    )
    startDate = models.DateTimeField(auto_now_add=True, null=True, blank=True)


class AchievementEmbed(EmbeddedModel):
    type = models.CharField(max_length=20)  # daily, weekly, monthly, yearly
    count = models.IntegerField(null=True, blank=True)
    earnedAt = models.DateTimeField(null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)


class RewardEmbed(EmbeddedModel):
    type = models.CharField(max_length=100)
    earnedAt = models.DateTimeField(null=True, blank=True)


class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255, blank=True)
    authProvider = models.CharField(
        max_length=20,
        choices=[("email", "email"), ("google", "google"), ("facebook", "facebook"), ("apple", "apple")],
        default="email",
    )
    googleId = models.CharField(max_length=255, unique=True, null=True, blank=True)
    facebookId = models.CharField(max_length=255, unique=True, null=True, blank=True)
    appleId = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile = EmbeddedModelField(ProfileEmbed, null=True, blank=True)
    theme = models.CharField(
        max_length=10,
        choices=[("pink", "pink"), ("green", "green"), ("blue", "blue")],
        default="blue",
    )
    learningPlan = EmbeddedModelField(LearningPlanEmbed, null=True, blank=True)
    followers = ArrayField(ObjectIdField(), default=list, blank=True)
    following = ArrayField(ObjectIdField(), default=list, blank=True)
    blocked = ArrayField(ObjectIdField(), default=list, blank=True)
    achievements = EmbeddedModelArrayField(AchievementEmbed, default=list, blank=True)
    rewards = EmbeddedModelArrayField(RewardEmbed, default=list, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = "users"
        managed = False

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        # Hash password before save (same logic as Node: only when modified, skip if already hash)
        # Also avoid re-hashing Django-style hashes (e.g. pbkdf2_sha256$...)
        if self.password and not self.password.startswith(("$2a$", "$2b$", "$2y$", "pbkdf2_sha256$")):
            self.password = bcrypt.hashpw(
                self.password.encode("utf-8"), bcrypt.gensalt(rounds=10)
            ).decode("utf-8")
        super().save(*args, **kwargs)

    def check_password(self, raw_password):
        if not self.password or not raw_password:
            return False
        # Support both legacy bcrypt hashes and Django PBKDF2 hashes
        if isinstance(self.password, str) and self.password.startswith("pbkdf2_sha256$"):
            return django_check_password(raw_password, self.password)
        return bcrypt.checkpw(raw_password.encode("utf-8"), self.password.encode("utf-8"))
