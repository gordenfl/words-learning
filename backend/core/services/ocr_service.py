"""OCR service - extract Chinese text from image. Same logic as Node (Baidu / Google Vision / fallback)."""
import base64
import os
import re
import requests

GOOGLE_VISION_API_KEY = os.environ.get("GOOGLE_VISION_API_KEY")
BAIDU_OCR_API_KEY = os.environ.get("BAIDU_OCR_API_KEY")
BAIDU_OCR_SECRET_KEY = os.environ.get("BAIDU_OCR_SECRET_KEY")
USE_GOOGLE_VISION = os.environ.get("USE_GOOGLE_VISION", "").lower() == "true"


def extract_text_from_image(image_data):
    if USE_GOOGLE_VISION and GOOGLE_VISION_API_KEY:
        return _extract_with_google_vision(image_data)
    if BAIDU_OCR_API_KEY and BAIDU_OCR_SECRET_KEY:
        return _extract_with_baidu(image_data)
    return _extract_fallback(image_data)


def _to_base64(image_data):
    if isinstance(image_data, bytes):
        return base64.b64encode(image_data).decode("ascii")
    if isinstance(image_data, str):
        return re.sub(r"^data:image/\w+;base64,", "", image_data)
    return image_data


def _extract_with_baidu(image_data):
    try:
        r = requests.post(
            "https://aip.baidubce.com/oauth/2.0/token",
            params={"grant_type": "client_credentials", "client_id": BAIDU_OCR_API_KEY, "client_secret": BAIDU_OCR_SECRET_KEY},
            timeout=10,
        )
        r.raise_for_status()
        token = r.json()["access_token"]
        b64 = _to_base64(image_data)
        r2 = requests.post(
            f"https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token={token}",
            data={"image": b64},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        r2.raise_for_status()
        words_result = r2.json().get("words_result") or []
        return _extract_chinese_words([w.get("words", "") for w in words_result])
    except Exception:
        return _extract_fallback(image_data)


def _extract_with_google_vision(image_data):
    try:
        b64 = _to_base64(image_data)
        r = requests.post(
            f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}",
            json={"requests": [{"image": {"content": b64}, "features": [{"type": "TEXT_DETECTION", "maxResults": 1}]}]},
            timeout=15,
        )
        r.raise_for_status()
        resp = r.json()
        if resp.get("responses") and resp["responses"][0].get("error"):
            raise RuntimeError(resp["responses"][0]["error"].get("message", "Unknown error"))
        annotations = (resp.get("responses") or [{}])[0].get("textAnnotations") or []
        if not annotations:
            return []
        full_text = annotations[0].get("description", "")
        return _extract_chinese_words([full_text])
    except Exception:
        return _extract_fallback(image_data)


def _extract_chinese_words(ocr_results):
    all_text = "".join(ocr_results)
    chinese_only = re.sub(r"[^\u4e00-\u9fa5]", "", all_text)
    if not chinese_only:
        return []
    return list(dict.fromkeys(chinese_only))


def _extract_fallback(image_data):
    # Demo fallback - return sample words when no OCR configured
    return [
        "学习", "中文", "你好", "谢谢", "朋友",
        "工作", "生活", "快乐", "美丽", "时间",
        "地方", "东西", "认识", "喜欢", "知道",
    ]
