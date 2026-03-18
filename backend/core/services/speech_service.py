"""Speech recognition - Google / Baidu. Same logic as Node."""
import base64
import os
import requests

GOOGLE_SPEECH_API_KEY = os.environ.get("GOOGLE_SPEECH_API_KEY")
BAIDU_SPEECH_API_KEY = os.environ.get("BAIDU_SPEECH_API_KEY")
BAIDU_SPEECH_SECRET_KEY = os.environ.get("BAIDU_SPEECH_SECRET_KEY")
USE_BAIDU = os.environ.get("USE_BAIDU_SPEECH", "").lower() == "true"


def recognize_speech(audio_buffer, language_code="zh-CN"):
    if not audio_buffer or len(audio_buffer) == 0:
        raise ValueError("Audio buffer is required")
    if USE_BAIDU and BAIDU_SPEECH_API_KEY and BAIDU_SPEECH_SECRET_KEY:
        try:
            return _recognize_baidu(audio_buffer, language_code)
        except Exception:
            if GOOGLE_SPEECH_API_KEY:
                return _recognize_google(audio_buffer, language_code)
            raise
    if GOOGLE_SPEECH_API_KEY:
        return _recognize_google(audio_buffer, language_code)
    raise ValueError(
        "No speech recognition API configured. Please set GOOGLE_SPEECH_API_KEY or BAIDU_SPEECH_API_KEY in .env file."
    )


def _recognize_google(audio_buffer, language_code):
    if not GOOGLE_SPEECH_API_KEY:
        raise ValueError("Google Speech API key is not configured")
    b64 = base64.b64encode(audio_buffer).decode("ascii")
    r = requests.post(
        f"https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_SPEECH_API_KEY}",
        json={
            "config": {
                "encoding": "MP3",
                "sampleRateHertz": 44100,
                "languageCode": language_code,
                "alternativeLanguageCodes": ["zh-TW", "en-US"],
                "enableAutomaticPunctuation": True,
            },
            "audio": {"content": b64},
        },
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    if data.get("results") and len(data["results"]) > 0:
        return data["results"][0]["alternatives"][0]["transcript"]
    if data.get("error"):
        raise RuntimeError(str(data["error"]))
    return ""


def _recognize_baidu(audio_buffer, language_code):
    if not BAIDU_SPEECH_API_KEY or not BAIDU_SPEECH_SECRET_KEY:
        raise ValueError("Baidu Speech API credentials are not configured")
    r = requests.post(
        f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={BAIDU_SPEECH_API_KEY}&client_secret={BAIDU_SPEECH_SECRET_KEY}",
        json={},
        timeout=10,
    )
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        raise RuntimeError("Failed to get Baidu access token")
    b64 = base64.b64encode(audio_buffer).decode("ascii")
    r2 = requests.post(
        f"https://vop.baidubce.com/server_api?access_token={token}",
        json={
            "format": "pcm",
            "rate": 16000,
            "channel": 1,
            "cuid": "words-learning-app",
            "len": len(audio_buffer),
            "speech": b64,
            "dev_pid": 1537,
        },
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    r2.raise_for_status()
    data = r2.json()
    if data.get("err_no") == 0 and data.get("result"):
        return data["result"][0]
    raise RuntimeError(data.get("err_msg", "Baidu Speech recognition failed"))
