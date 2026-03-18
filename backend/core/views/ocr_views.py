"""OCR API - same behavior as Node backend."""
import base64
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import Word
from core.services.ocr_service import extract_text_from_image

try:
    from pypinyin import pinyin as py_pinyin, Style
    HAS_PYPINYIN = True
except ImportError:
    HAS_PYPINYIN = False


def _get_pinyin(word):
    if not HAS_PYPINYIN:
        return ""
    try:
        return " ".join(x[0] for x in py_pinyin(word, style=Style.TONE))
    except Exception:
        return ""


@csrf_exempt
@require_http_methods(["POST"])
def extract_file(request):
    try:
        if "image" not in request.FILES:
            return JsonResponse({"message": "Please upload an image", "hasImage": False}, status=400)
        f = request.FILES["image"]
        buffer = f.read()
        extracted = extract_text_from_image(buffer)
        user_id = request.userId
        existing = set(Word.objects.filter(userId=user_id, word__in=extracted).values_list("word", flat=True))
        new_words = [w for w in extracted if w not in existing]
        return JsonResponse({
            "success": True,
            "message": f"Found {len(new_words)} new Chinese words!",
            "newWords": new_words,
            "knownWords": list(existing),
            "stats": {"totalExtracted": len(extracted), "alreadyKnown": len(existing), "newWords": len(new_words)},
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": "Could not process the image. Please try again.", "error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def extract_base64(request):
    try:
        body = json.loads(request.body) if request.body else {}
        image_base64 = body.get("imageBase64")
        if not image_base64:
            return JsonResponse({"message": "Please provide image data", "hasImage": False}, status=400)
        if isinstance(image_base64, str) and image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[-1]
        buffer = base64.b64decode(image_base64)
        extracted = extract_text_from_image(buffer)
        user_id = request.userId
        existing = set(Word.objects.filter(userId=user_id, word__in=extracted).values_list("word", flat=True))
        new_words = [w for w in extracted if w not in existing]
        new_with_pinyin = [{"word": w, "pinyin": _get_pinyin(w)} for w in new_words]
        known_with_pinyin = [{"word": w, "pinyin": _get_pinyin(w)} for w in existing]
        return JsonResponse({
            "success": True,
            "message": f"Found {len(new_words)} new Chinese words!",
            "newWords": new_with_pinyin,
            "knownWords": known_with_pinyin,
            "stats": {"totalExtracted": len(extracted), "alreadyKnown": len(existing), "newWords": len(new_words)},
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": "Could not process the image. Please try again.", "error": str(e)}, status=500)
