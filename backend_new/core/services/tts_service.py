"""ChatTTS text-to-speech service. Optional - falls back to None if ChatTTS not installed."""
import base64
import io
import wave

# Voice presets: id -> (name, seed). Different seeds produce different voice characteristics.
TTS_VOICES = [
    {"id": "xiaoming", "name": "小明", "gender": "male", "seed": 1},
    {"id": "xiaoli", "name": "小李", "gender": "male", "seed": 2},
    {"id": "laowang", "name": "老王", "gender": "male", "seed": 5},
    {"id": "xiaomei", "name": "小美", "gender": "female", "seed": 3},
    {"id": "xiaofang", "name": "小芳", "gender": "female", "seed": 4},
    {"id": "xiaohong", "name": "小红", "gender": "female", "seed": 6},
    {"id": "laoli", "name": "老李", "gender": "male", "seed": 7},
    {"id": "xiaoling", "name": "小玲", "gender": "female", "seed": 8},
]

_CHAT_LOADED = False
_CHAT_INSTANCE = None


def _load_chattts():
    global _CHAT_LOADED, _CHAT_INSTANCE
    if _CHAT_LOADED:
        return _CHAT_INSTANCE
    import logging
    log = logging.getLogger(__name__)
    try:
        import torch  # noqa: F401
        torch._dynamo.config.cache_size_limit = 64
        torch._dynamo.config.suppress_errors = True
        import ChatTTS  # noqa: F401
        chat = ChatTTS.Chat()
        # ChatTTS 0.2+: use load() not load_models(); source='huggingface' auto-downloads
        if not chat.load(source="huggingface", compile=False):
            raise RuntimeError("ChatTTS model load failed")
        _CHAT_INSTANCE = chat
        _CHAT_LOADED = True
        return chat
    except Exception as e:
        log.warning("ChatTTS not available: %s. TTS will fall back to browser. Install: pip install ChatTTS torch torchaudio numpy", e)
        _CHAT_LOADED = True
        _CHAT_INSTANCE = None
        return None


def get_voice_seed(voice_id):
    """Get seed for voice_id. Default to xiaoming (seed 1) if unknown."""
    for v in TTS_VOICES:
        if v["id"] == voice_id:
            return v["seed"]
    return 1


def synthesize_speech(text, voice_id="xiaoming", lang="zh", speed=5):
    """
    Synthesize speech using ChatTTS.
    speed: 1-10, lower=slower. Default 5.
    Returns (audio_base64, sample_rate) or (None, None) if ChatTTS unavailable.
    """
    if not text or not text.strip():
        return None, None
    chat = _load_chattts()
    if chat is None:
        return None, None
    try:
        seed = get_voice_seed(voice_id)
        speed = max(1, min(10, int(speed) if speed is not None else 5))
        prompt = f"[speed_{speed}]"
        # ChatTTS 0.2+: infer(text, params_infer_code=InferCodeParams(manual_seed=...))
        try:
            import ChatTTS
            params = ChatTTS.Chat.InferCodeParams(
                manual_seed=seed,
                temperature=0.3,
                prompt=prompt,
            )
            wavs = chat.infer(text.strip(), params_infer_code=params)
        except (AttributeError, TypeError):
            wavs = chat.infer(text.strip())
        if not wavs or len(wavs) == 0:
            return None, None
        import numpy as np
        # infer returns list of wav arrays; concatenate if split
        wav = np.concatenate(wavs) if len(wavs) > 1 else wavs[0]
        sample_rate = 24000
        samples = (np.clip(wav, -1, 1) * 32767).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(samples.tobytes())
        return base64.b64encode(buf.getvalue()).decode("ascii"), sample_rate
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("ChatTTS synthesis failed: %s", e)
        return None, None
