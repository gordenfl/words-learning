"""Auth API - same behavior as Node backend."""
import json
import time
import jwt
import logging
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from bson import ObjectId

from core.models import User
from core.models.user import ProfileEmbed, LearningPlanEmbed
from core.services.apple_auth_service import verify_identity_token

logger = logging.getLogger(__name__)


def _jwt_sign(user_id):
    secret = getattr(settings, "JWT_SECRET", "default_secret_key")
    expiry_days = getattr(settings, "JWT_EXPIRY_DAYS", 7)
    now = int(time.time())
    payload = {
        "userId": str(user_id),
        "iat": now,
        "exp": now + expiry_days * 86400,
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token.decode("utf-8") if isinstance(token, bytes) else token


def _user_response(user):
    theme = getattr(user, "theme", None) or "blue"
    return {
        "id": str(user.pk),
        "username": user.username,
        "email": user.email,
        "theme": theme,
    }


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    try:
        body = json.loads(request.body)
        username = (body.get("username") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        if not username or not email or not password:
            return JsonResponse({"error": "Username, email and password required"}, status=400)
        if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
            return JsonResponse({"error": "User already exists"}, status=400)
        user = User(username=username, email=email, password=password, authProvider="email")
        user.save()
        token = _jwt_sign(user.pk)
        return JsonResponse(
            {
                "message": "User registered successfully",
                "token": token,
                "user": _user_response(user),
            },
            status=201,
        )
    except Exception as e:
        return JsonResponse({"error": "Registration failed", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    try:
        body = json.loads(request.body)
        # Accept either email or username in the same field.
        # mobile (Vue app) currently sends "email", but users may type a username there.
        identifier = (body.get("email") or body.get("username") or body.get("identifier") or "").strip()
        password = body.get("password") or ""
        # Debug logging (safe): never log plaintext passwords
        if getattr(settings, "DEBUG", False) or getattr(settings, "LOG_AUTH_ATTEMPTS", False):
            ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or ""
            ua = request.META.get("HTTP_USER_AGENT") or ""
            # Use WARNING level so it shows up with Django's default console logging.
            logger.warning(
                "auth.login attempt identifier=%r ip=%s ua=%r password_provided=%s password_len=%s",
                identifier,
                ip,
                ua[:200],
                bool(password),
                len(password) if password else 0,
            )
        if "@" in identifier:
            user = User.objects.filter(email=identifier.lower()).first()
        else:
            user = User.objects.filter(username=identifier).first()
        if not user or not user.check_password(password):
            return JsonResponse({"error": "Incorrect username or password"}, status=401)
        token = _jwt_sign(user.pk)
        return JsonResponse({
            "message": "Login successful",
            "token": token,
            "user": _user_response(user),
        })
    except Exception as e:
        return JsonResponse({"error": "Login failed", "message": str(e)}, status=500)


@require_http_methods(["GET"])
def me(request):
    if not getattr(request, "user", None):
        return JsonResponse({"error": "No authentication token provided"}, status=401)
    user = request.user
    u = {
        "id": str(user.pk),
        "username": user.username,
        "email": user.email,
        "theme": getattr(user, "theme", None) or "blue",
        "profile": {},
        "learningPlan": {},
    }
    if user.profile:
        u["profile"] = {
            "displayName": getattr(user.profile, "displayName", "") or "",
            "avatar": getattr(user.profile, "avatar", "") or "",
            "bio": getattr(user.profile, "bio", "") or "",
            "ttsVoice": getattr(user.profile, "ttsVoice", "") or "xiaoming",
        }
    if user.learningPlan:
        u["learningPlan"] = {
            "dailyWordGoal": getattr(user.learningPlan, "dailyWordGoal", 10),
            "weeklyWordGoal": getattr(user.learningPlan, "weeklyWordGoal", 50),
            "monthlyWordGoal": getattr(user.learningPlan, "monthlyWordGoal", 200),
            "difficulty": getattr(user.learningPlan, "difficulty", "intermediate"),
            "preferredStudyTime": getattr(user.learningPlan, "preferredStudyTime", []) or [],
            "startDate": getattr(user.learningPlan, "startDate", None),
        }
    return JsonResponse({"user": u})


def _oauth_user_response(user):
    return {
        "id": str(user.pk),
        "username": user.username,
        "email": user.email,
        "name": getattr(user.profile, "displayName", None) if user.profile else None,
        "avatar": getattr(user.profile, "avatar", None) if user.profile else None,
        "authProvider": user.authProvider,
        "theme": getattr(user, "theme", None) or "blue",
    }


@csrf_exempt
@require_http_methods(["POST"])
def google_login(request):
    try:
        body = json.loads(request.body)
        user_info = body.get("userInfo")
        if not user_info or not user_info.get("id") or not user_info.get("email"):
            return JsonResponse({"message": "User information not provided"}, status=400)
        google_id = user_info.get("id")
        email = user_info.get("email", "").strip().lower()
        name = user_info.get("name")
        photo = user_info.get("photo")
        user = User.objects.filter(googleId=google_id).first()
        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.googleId = google_id
                user.authProvider = "google"
                if user.profile is None:
                    user.profile = ProfileEmbed()
                if not getattr(user.profile, "avatar", None):
                    user.profile.avatar = photo or ""
                if name:
                    user.profile.displayName = name
                user.save()
            else:
                temp_username = email.split("@")[0] + str(100 + (hash(email) % 900))
                user = User(
                    googleId=google_id,
                    email=email,
                    username=temp_username,
                    authProvider="google",
                    profile=ProfileEmbed(displayName=name or email.split("@")[0], avatar=photo or ""),
                )
                user.save()
        token = _jwt_sign(user.pk)
        return JsonResponse({
            "message": "Google Sign-In successful",
            "token": token,
            "user": _oauth_user_response(user),
        })
    except Exception as e:
        return JsonResponse({"error": "Google authentication failed", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def facebook_login(request):
    try:
        body = json.loads(request.body)
        user_info = body.get("userInfo")
        if not user_info or not user_info.get("id") or not user_info.get("name"):
            return JsonResponse({"message": "User information not provided"}, status=400)
        facebook_id = user_info.get("id")
        email = (user_info.get("email") or "").strip().lower()
        name = user_info.get("name")
        photo = user_info.get("photo")
        user = User.objects.filter(facebookId=facebook_id).first()
        if not user:
            if email:
                user = User.objects.filter(email=email).first()
                if user:
                    user.facebookId = facebook_id
                    user.authProvider = "facebook"
                    if user.profile is None:
                        user.profile = ProfileEmbed()
                    if not getattr(user.profile, "avatar", None):
                        user.profile.avatar = photo or ""
                    if name:
                        user.profile.displayName = name
                    user.save()
            if not user:
                temp_username = (name or "user") + str(100 + (hash(facebook_id) % 900))
                user = User(
                    facebookId=facebook_id,
                    email=email or f"{facebook_id}@facebook.com",
                    username=temp_username,
                    authProvider="facebook",
                    profile=ProfileEmbed(displayName=name or "Facebook User", avatar=photo or ""),
                )
                user.save()
        token = _jwt_sign(user.pk)
        return JsonResponse({
            "message": "Facebook Sign-In successful",
            "token": token,
            "user": _oauth_user_response(user),
        })
    except Exception as e:
        return JsonResponse({"error": "Facebook authentication failed", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def apple_login(request):
    try:
        body = json.loads(request.body)
        user_info = body.get("userInfo")
        if not user_info or not user_info.get("identityToken"):
            return JsonResponse({"message": "Identity token is required for Apple Sign-In"}, status=400)
        identity_token = user_info.get("identityToken")
        try:
            verified = verify_identity_token(identity_token)
        except Exception as verify_error:
            return JsonResponse({
                "error": "Invalid identity token",
                "message": str(verify_error),
                "details": "请确保使用最新版本的应用，并确保设备已登录 Apple ID",
            }, status=401)
        apple_id = verified["userId"]
        email = verified.get("email") or user_info.get("email")
        full_name = user_info.get("fullName")
        display_name = None
        if full_name:
            given = full_name.get("givenName") or ""
            family = full_name.get("familyName") or ""
            display_name = f"{given} {family}".strip() or given or family or (email or "").split("@")[0]
        user = User.objects.filter(appleId=apple_id).first()
        if not user:
            if email:
                user = User.objects.filter(email=email).first()
                if user:
                    user.appleId = apple_id
                    user.authProvider = "apple"
                    if display_name and (not user.profile or not getattr(user.profile, "displayName", None)):
                        if user.profile is None:
                            user.profile = ProfileEmbed()
                        user.profile.displayName = display_name
                    user.save()
            if not user:
                display_name = display_name or "Apple User"
                temp_username = (email or apple_id).split("@")[0] + str(100 + (hash(apple_id) % 900))
                user = User(
                    appleId=apple_id,
                    email=email or f"{apple_id}@privaterelay.appleid.com",
                    username=temp_username,
                    authProvider="apple",
                    profile=ProfileEmbed(displayName=display_name),
                )
                user.save()
        token = _jwt_sign(user.pk)
        return JsonResponse({
            "message": "Apple Sign-In successful",
            "token": token,
            "user": _oauth_user_response(user),
        })
    except Exception as e:
        return JsonResponse({"error": "Apple authentication failed", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def change_password(request):
    if not getattr(request, "user", None):
        return JsonResponse({"error": "No authentication token provided"}, status=401)
    try:
        body = json.loads(request.body)
        old_password = body.get("oldPassword") or body.get("old_password")
        new_password = body.get("newPassword") or body.get("new_password")
        user = request.user
        is_oauth = user.authProvider in ("google", "facebook", "apple")
        has_password = bool(user.password and (user.password or "").strip())
        if is_oauth and not has_password:
            if not old_password:
                user.password = new_password
                user.save()
                return JsonResponse({"message": "Password set successfully", "isFirstTime": True})
            return JsonResponse({
                "error": "No existing password found. You can set a password without providing the old password.",
            }, status=400)
        if not old_password:
            return JsonResponse({"error": "Current password is required"}, status=400)
        if not user.check_password(old_password):
            return JsonResponse({"error": "Current password is incorrect"}, status=400)
        user.password = new_password
        user.save()
        return JsonResponse({"message": "Password changed successfully", "isFirstTime": False})
    except Exception as e:
        return JsonResponse({"error": "Password change failed", "message": str(e)}, status=500)
