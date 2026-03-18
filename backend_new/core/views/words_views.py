"""Words API - same behavior as Node backend."""
import json
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from bson import ObjectId

from core.models import Word
from core.models.word import CompoundEmbed, ExampleEmbed
from core.services.ai_service import generate_word_details


def _normalize_status(s):
    """Map legacy unknown/known to new/learned for backward compatibility."""
    if s == "unknown":
        return "new"
    if s == "known":
        return "learned"
    return s


def _serialize_word(w):
    d = {
        "id": str(w.pk),
        "userId": str(w.userId),
        "word": w.word,
        "pinyin": getattr(w, "pinyin", "") or "",
        "translation": getattr(w, "translation", "") or "",
        "definition": getattr(w, "definition", "") or "",
        "compounds": [],
        "examples": [],
        "difficulty": getattr(w, "difficulty", "intermediate") or "intermediate",
        "status": _normalize_status(getattr(w, "status", "new") or "new"),
        "sourceImage": getattr(w, "sourceImage", "") or "",
        "addedAt": w.addedAt,
        "learnedAt": getattr(w, "learnedAt", None),
        "reviewCount": getattr(w, "reviewCount", 0) or 0,
        "lastReviewedAt": getattr(w, "lastReviewedAt", None),
        "nextReviewAt": getattr(w, "nextReviewAt", None),
    }
    for c in (w.compounds or []):
        d["compounds"].append({"word": getattr(c, "word", ""), "pinyin": getattr(c, "pinyin", ""), "meaning": getattr(c, "meaning", "")})
    for e in (w.examples or []):
        d["examples"].append({"chinese": getattr(e, "chinese", ""), "pinyin": getattr(e, "pinyin", ""), "english": getattr(e, "english", "")})
    return d


@csrf_exempt
def word_list_or_create(request):
    if request.method == "GET":
        return word_list(request)
    if request.method == "POST":
        return word_create(request)
    return JsonResponse({"error": "Method not allowed"}, status=405)


def word_list(request):
    try:
        user_id = request.userId
        status = request.GET.get("status")
        if status:
            status = _normalize_status(status)
        qs = Word.objects.filter(userId=user_id)
        if status:
            # Support both new/learned and legacy unknown/known in DB
            if status == "new":
                qs = qs.filter(status__in=("new", "unknown"))
            elif status == "learned":
                qs = qs.filter(status__in=("learned", "known"))
        words = list(qs.order_by("-addedAt"))
        return JsonResponse({"words": [_serialize_word(w) for w in words], "count": len(words)})
    except Exception as e:
        return JsonResponse({"error": "Failed to fetch words", "message": str(e)}, status=500)


@require_http_methods(["GET"])
def word_stats(request):
    try:
        user_id = request.userId
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        total = Word.objects.filter(userId=user_id).count()
        learned = Word.objects.filter(userId=user_id, status="learned").count()
        new_count = Word.objects.filter(userId=user_id, status="new").count()
        today_learned = Word.objects.filter(userId=user_id, status="learned", learnedAt__gte=today).count()
        return JsonResponse({"total": total, "new": new_count, "learned": learned, "todayLearned": today_learned})
    except Exception as e:
        return JsonResponse({"error": "Failed to fetch statistics", "message": str(e)}, status=500)


@csrf_exempt
def word_detail_or_delete(request, word_id):
    if request.method == "GET":
        return word_detail(request, word_id)
    if request.method == "DELETE":
        return word_delete(request, word_id)
    return JsonResponse({"error": "Method not allowed"}, status=405)


def word_detail(request, word_id):
    try:
        user_id = request.userId
        w = Word.objects.filter(pk=ObjectId(word_id), userId=user_id).first()
        if not w:
            return JsonResponse({"error": "Word not found"}, status=404)
        return JsonResponse({"word": _serialize_word(w)})
    except Exception as e:
        return JsonResponse({"error": "Failed to fetch word", "message": str(e)}, status=500)


def word_create(request):
    try:
        body = json.loads(request.body)
        user_id = request.userId
        word_text = (body.get("word") or "").strip().lower()
        if not word_text:
            return JsonResponse({"error": "Word is required"}, status=400)
        if Word.objects.filter(userId=user_id, word=word_text).exists():
            return JsonResponse({"error": "Word already exists in your list"}, status=400)
        w = Word(
            userId=user_id,
            word=word_text,
            pinyin=body.get("pinyin", ""),
            translation=body.get("translation", ""),
            definition=body.get("definition", ""),
            sourceImage=body.get("sourceImage", ""),
            status="new",
        )
        examples = body.get("examples") or []
        if examples:
            w.examples = [ExampleEmbed(chinese=e.get("chinese", ""), pinyin=e.get("pinyin", ""), english=e.get("english", "")) for e in examples]
        w.save()
        return JsonResponse({"message": "Word added successfully", "word": _serialize_word(w)}, status=201)
    except Exception as e:
        return JsonResponse({"error": "Failed to add word", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def word_batch(request):
    try:
        body = json.loads(request.body)
        user_id = request.userId
        words_list = body.get("words") or []
        source_image = body.get("sourceImage", "")
        if not isinstance(words_list, list) or len(words_list) == 0:
            return JsonResponse({"error": "Words array is required"}, status=400)
        added = []
        skipped = []
        for item in words_list:
            word_text = item if isinstance(item, str) else (item.get("word") or "").strip().lower()
            pinyin = None if isinstance(item, str) else item.get("pinyin")
            if Word.objects.filter(userId=user_id, word=word_text).exists():
                skipped.append(word_text)
                continue
            w = Word(userId=user_id, word=word_text, pinyin=pinyin or "", sourceImage=source_image, status="unknown")
            w.save()
            added.append(w)
        return JsonResponse({
            "message": f"Added {len(added)} new words",
            "added": [_serialize_word(w) for w in added],
            "skipped": skipped,
        }, status=201)
    except Exception as e:
        return JsonResponse({"error": "Failed to add words", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PATCH"])
def word_update_status(request, word_id):
    try:
        body = json.loads(request.body)
        status = body.get("status")
        # Accept legacy unknown/known for backward compatibility
        if status == "unknown":
            status = "new"
        elif status == "known":
            status = "learned"
        elif status not in ("new", "learned"):
            return JsonResponse({"error": "Invalid status"}, status=400)
        user_id = request.userId
        w = Word.objects.filter(pk=ObjectId(word_id), userId=user_id).first()
        if not w:
            return JsonResponse({"error": "Word not found"}, status=404)
        w.status = status
        if status == "learned" and not getattr(w, "learnedAt", None):
            w.learnedAt = timezone.now()
        w.save()
        return JsonResponse({"message": "Word status updated", "word": _serialize_word(w)})
    except Exception as e:
        return JsonResponse({"error": "Failed to update word", "message": str(e)}, status=500)


def word_delete(request, word_id):
    try:
        user_id = request.userId
        w = Word.objects.filter(pk=ObjectId(word_id), userId=user_id).first()
        if not w:
            return JsonResponse({"error": "Word not found"}, status=404)
        w.delete()
        return JsonResponse({"message": "Word deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to delete word", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def word_generate_details(request, word_id):
    try:
        body = json.loads(request.body) or {}
        force = body.get("force", False)
        update_type = body.get("updateType", "both")
        user_id = request.userId
        w = Word.objects.filter(pk=ObjectId(word_id), userId=user_id).first()
        if not w:
            return JsonResponse({"error": "Word not found"}, status=404)
        if not force:
            if update_type == "compounds" and (w.compounds and len(w.compounds) > 0):
                return JsonResponse({"message": "Word compounds already exist", "word": _serialize_word(w)})
            if update_type == "examples" and (w.examples and len(w.examples) > 0):
                return JsonResponse({"message": "Word examples already exist", "word": _serialize_word(w)})
            if update_type == "both" and (w.compounds and len(w.compounds) > 0 and w.examples and len(w.examples) > 0):
                return JsonResponse({"message": "Word details already exist", "word": _serialize_word(w)})
        word_text = (w.word or "").strip()
        if not word_text:
            return JsonResponse({"error": "Word text is required"}, status=400)
        try:
            details = generate_word_details(word_text, getattr(w, "pinyin", "") or "", getattr(w, "translation", "") or getattr(w, "definition", "") or "")
        except Exception as err:
            return JsonResponse({
                "error": "Failed to generate word details",
                "message": str(err) or "AI service failed. Please check AI API configuration.",
            }, status=500)
        if not details or (not details.get("compounds") and not details.get("examples")):
            return JsonResponse({"error": "Failed to generate word details", "message": "AI service returned empty result."}, status=500)
        compounds = details.get("compounds") or []
        examples = details.get("examples") or []
        if update_type == "compounds" and not compounds:
            return JsonResponse({"error": "Failed to generate compounds", "message": "AI service did not generate any compounds."}, status=500)
        if update_type == "examples" and not examples:
            return JsonResponse({"error": "Failed to generate examples", "message": "AI service did not generate any examples."}, status=500)
        if update_type == "both" and (not compounds or not examples):
            return JsonResponse({"error": "Failed to generate word details", "message": f"Compounds: {len(compounds)}, Examples: {len(examples)}"}, status=500)
        if update_type == "compounds":
            w.compounds = [CompoundEmbed(word=c.get("word", ""), pinyin=c.get("pinyin", ""), meaning=c.get("meaning", "")) for c in compounds]
        elif update_type == "examples":
            w.examples = [ExampleEmbed(chinese=e.get("chinese", ""), pinyin=e.get("pinyin", ""), english=e.get("english", "")) for e in examples]
        else:
            w.compounds = [CompoundEmbed(word=c.get("word", ""), pinyin=c.get("pinyin", ""), meaning=c.get("meaning", "")) for c in compounds]
            w.examples = [ExampleEmbed(chinese=e.get("chinese", ""), pinyin=e.get("pinyin", ""), english=e.get("english", "")) for e in examples]
        w.save()
        w.refresh_from_db()
        return JsonResponse({
            "message": "Word details updated successfully" if force else "Word details generated successfully",
            "word": _serialize_word(w),
        })
    except Exception as e:
        return JsonResponse({"error": "Failed to generate word details", "message": str(e)}, status=500)
