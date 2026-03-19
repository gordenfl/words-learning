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
        # Use learned words for article (学过的字组成的文章)
        learned_qs = Word.objects.filter(userId=user_id, status="learned", difficulty=difficulty).order_by("-addedAt")
        target_list = list(learned_qs[: word_count + 50])  # get more, then sample
        if len(target_list) < 3:
            learned_qs = Word.objects.filter(userId=user_id, status="learned").order_by("-addedAt")
            target_list = list(learned_qs[: word_count + 50])
        if len(target_list) < 3:
            # Also try "known" for legacy backend compatibility
            learned_qs = Word.objects.filter(userId=user_id, status__in=("learned", "known")).order_by("-addedAt")
            target_list = list(learned_qs[: word_count + 50])
        if len(target_list) > word_count:
            target_list = random.sample(target_list, word_count)
        if not target_list:
            return JsonResponse({
                "message": "No words to read yet",
                "suggestion": "Learn some words first (complete Writing practice and mark them as Learned), then generate an article.",
                "needMoreWords": True,
            })
        # Use all learned words as context for AI
        all_learned = list(Word.objects.filter(userId=user_id, status__in=("learned", "known")).order_by("-addedAt")[:50])
        learned_texts = [w.word for w in all_learned]
        target_texts = [w.word for w in target_list]
        content = generate_chinese_story(target_texts, learned_texts, difficulty)
        article = Article(
            userId=user_id,
            title="Reading",
            content=content,
            targetWords=[TargetWordEmbed(word=w.pk, wordText=w.word) for w in target_list],
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
