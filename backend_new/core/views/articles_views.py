"""Articles API - same behavior as Node backend."""
import json
import random
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from bson import ObjectId

from core.models import Word, Article, User
from core.models.article import TargetWordEmbed
from core.services.ai_service import generate_chinese_story


def _serialize_article(a):
    tw = []
    for t in (a.targetWords or []):
        word_id = getattr(t, "word", None)
        word_text = getattr(t, "wordText", "") or ""
        tw.append({"word": str(word_id) if word_id else None, "wordText": word_text})
    return {
        "id": str(a.pk),
        "userId": str(a.userId),
        "title": a.title,
        "content": a.content,
        "englishContent": getattr(a, "englishContent", "") or "",
        "targetWords": tw,
        "difficulty": getattr(a, "difficulty", "intermediate") or "intermediate",
        "readAt": getattr(a, "readAt", None),
        "completed": getattr(a, "completed", False),
        "createdAt": a.createdAt,
    }


@require_http_methods(["GET"])
def article_list(request):
    try:
        user_id = request.userId
        articles = list(Article.objects.filter(userId=user_id).order_by("-createdAt"))
        return JsonResponse({"articles": [_serialize_article(a) for a in articles], "count": len(articles)})
    except Exception as e:
        return JsonResponse({"error": "Failed to fetch articles", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def article_generate(request):
    try:
        body = json.loads(request.body) or {}
        user_id = request.userId
        user = User.objects.filter(pk=user_id).first()
        difficulty = "intermediate"
        daily_goal = 10
        if user and user.learningPlan:
            difficulty = getattr(user.learningPlan, "difficulty", "intermediate") or "intermediate"
            daily_goal = getattr(user.learningPlan, "dailyWordGoal", 10) or 10
        word_count = body.get("wordCount", daily_goal)
        # Unknown words by difficulty (aggregate $match + $sample not in ORM; use filter + random sample)
        unknown_qs = Word.objects.filter(userId=user_id, status="unknown", difficulty=difficulty)
        unknown_list = list(unknown_qs)
        if len(unknown_list) < 3:
            unknown_qs = Word.objects.filter(userId=user_id, status="unknown")
            unknown_list = list(unknown_qs)
        if len(unknown_list) > word_count:
            unknown_list = random.sample(unknown_list, word_count)
        if not unknown_list:
            return JsonResponse({
                "message": "Great job! You've learned all your words! 🎉",
                "suggestion": "Add some new Chinese words to continue your learning journey.",
                "needMoreWords": True,
            })
        known_words = list(Word.objects.filter(userId=user_id, status="known").order_by("-addedAt")[:30])
        known_texts = [w.word for w in known_words]
        target_texts = [w.word for w in unknown_list]
        content = generate_chinese_story(target_texts, known_texts, difficulty)
        article = Article(
            userId=user_id,
            title="Reading",
            content=content,
            targetWords=[TargetWordEmbed(word=w.pk, wordText=w.word) for w in unknown_list],
            difficulty=difficulty,
        )
        article.save()
        return JsonResponse({
            "message": "Article generated successfully",
            "article": _serialize_article(article),
            "difficulty": difficulty,
        }, status=201)
    except Exception as e:
        return JsonResponse({"error": "Failed to generate article", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PATCH"])
def article_mark_read(request, article_id):
    try:
        user_id = request.userId
        a = Article.objects.filter(pk=ObjectId(article_id), userId=user_id).first()
        if not a:
            return JsonResponse({"error": "Article not found"}, status=404)
        a.readAt = timezone.now()
        a.completed = True
        a.save()
        return JsonResponse({"message": "Article marked as read", "article": _serialize_article(a)})
    except Exception as e:
        return JsonResponse({"error": "Failed to update article", "message": str(e)}, status=500)
