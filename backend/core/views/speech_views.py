"""Speech API - same behavior as Node backend. Includes TTS (ChatTTS)."""
import base64
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.services.speech_service import recognize_speech
from core.services.tts_service import synthesize_speech, TTS_VOICES


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


@require_http_methods(["GET"])
def tts_voices(request):
    """List available TTS voices."""
    return JsonResponse({"voices": TTS_VOICES})


@csrf_exempt
@require_http_methods(["POST"])
def tts_synthesize(request):
    """Synthesize speech via ChatTTS. Returns base64 WAV."""
    try:
        body = json.loads(request.body) if request.body else {}
        text = (body.get("text") or "").strip()
        voice_id = (body.get("voiceId") or "xiaoming").strip()
        lang = (body.get("lang") or "zh").strip()
        speed = body.get("speed")  # 1-10, lower=slower. Default 5.
        if not text:
            return JsonResponse({"error": "Text is required"}, status=400)
        audio_b64, sample_rate = synthesize_speech(text, voice_id=voice_id, lang=lang, speed=speed)
        if audio_b64 is None:
            return JsonResponse({
                "error": "TTS unavailable",
                "message": "ChatTTS is not installed or failed. Install: pip install ChatTTS",
            }, status=503)
        return JsonResponse({
            "audioBase64": audio_b64,
            "sampleRate": sample_rate,
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("TTS synthesize failed")
        return JsonResponse({"error": "TTS failed", "message": str(e)}, status=500)
