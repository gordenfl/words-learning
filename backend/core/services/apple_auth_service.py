"""Apple Sign-In identity token verification - same logic as Node."""
import os
import time
import requests
import jwt
from jwt.algorithms import RSAAlgorithm

APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_AUDIENCE = os.environ.get("APPLE_BUNDLE_ID", "com.gordenfl.wordslearning")
ALLOWED_AUDIENCES = [APPLE_AUDIENCE, "host.exp.Exponent"]

_keys_cache = None
_keys_cache_time = None
CACHE_DURATION = 3600  # 1 hour


def _get_apple_public_keys():
    global _keys_cache, _keys_cache_time
    now = time.time()
    if _keys_cache and _keys_cache_time and (now - _keys_cache_time) < CACHE_DURATION:
        return _keys_cache
    r = requests.get(APPLE_KEYS_URL, timeout=10)
    r.raise_for_status()
    _keys_cache = r.json()
    _keys_cache_time = now
    return _keys_cache


def verify_identity_token(identity_token):
    if not identity_token:
        raise ValueError("Identity token is required")
    keys_response = _get_apple_public_keys()
    keys = keys_response.get("keys", [])
    unverified_header = jwt.get_unverified_header(identity_token)
    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("Invalid token: missing kid in header")
    key_data = next((k for k in keys if k.get("kid") == kid), None)
    if not key_data:
        raise ValueError(f"Public key not found for kid: {kid}")
    public_key = RSAAlgorithm.from_jwk(key_data)
    unverified = jwt.decode(identity_token, options={"verify_signature": False})
    aud = unverified.get("aud")
    if aud not in ALLOWED_AUDIENCES:
        raise ValueError(
            f'Token audience "{aud}" does not match any allowed audience. '
            f"Expected one of: {', '.join(ALLOWED_AUDIENCES)}"
        )
    payload = jwt.decode(
        identity_token,
        public_key,
        algorithms=["RS256"],
        issuer=APPLE_ISSUER,
        audience=aud,
    )
    return {
        "userId": payload["sub"],
        "email": payload.get("email"),
        "emailVerified": payload.get("email_verified", False),
        "issuer": payload.get("iss"),
        "audience": payload.get("aud"),
        "expiration": payload.get("exp"),
        "issuedAt": payload.get("iat"),
    }
