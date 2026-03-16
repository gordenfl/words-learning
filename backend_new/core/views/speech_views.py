"""Speech API - same behavior as Node backend."""
import base64
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.services.speech_service import recognize_speech


@csrf_exempt
@require_http_methods(["POST"])
def recognize_file(request):
    try:
        if "audio" not in request.FILES:
            return JsonResponse({"success": False, "message": "Please upload an audio file"}, status=400)
        f = request.FILES["audio"]
        buffer = f.read()
        language_code = request.POST.get("languageCode", "zh-CN")
        transcript = recognize_speech(buffer, language_code)
        if not transcript or not transcript.strip():
            return JsonResponse({"success": False, "message": "No speech detected in the audio"}, status=400)
        return JsonResponse({"success": True, "transcript": transcript.strip(), "message": "Speech recognized successfully"})
    except Exception as e:
        return JsonResponse({"success": False, "message": "Speech recognition failed", "error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def recognize_base64(request):
    try:
        body = json.loads(request.body) if request.body else {}
        audio_base64 = body.get("audioBase64")
        language_code = body.get("languageCode", "zh-CN")
        if not audio_base64:
            return JsonResponse({"success": False, "message": "Please provide audio data"}, status=400)
        buffer = base64.b64decode(audio_base64)
        if len(buffer) == 0:
            return JsonResponse({"success": False, "message": "Invalid audio data"}, status=400)
        transcript = recognize_speech(buffer, language_code)
        if not transcript or not transcript.strip():
            return JsonResponse({"success": False, "message": "No speech detected in the audio"}, status=400)
        return JsonResponse({"success": True, "transcript": transcript.strip(), "message": "Speech recognized successfully"})
    except Exception as e:
        return JsonResponse({"success": False, "message": "Speech recognition failed", "error": str(e)}, status=500)
