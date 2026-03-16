"""JWT auth middleware - attach request.user and request.userId for protected routes."""
import jwt
from bson import ObjectId
from django.conf import settings
from django.http import JsonResponse
from core.models import User


# Paths that do not require authentication
PUBLIC_PATHS = {
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/google",
    "/api/auth/facebook",
    "/api/auth/apple",
}
HEALTH_PATH = "/api/health"


def AuthMiddleware(get_response):
    def middleware(request):
        if request.path in PUBLIC_PATHS or request.path == HEALTH_PATH:
            return get_response(request)
        auth_header = request.headers.get("Authorization")
        token = (auth_header or "").replace("Bearer ", "").strip()
        if not token:
            return JsonResponse(
                {"error": "No authentication token provided"},
                status=401,
            )
        try:
            payload = jwt.decode(
                token,
                getattr(settings, "JWT_SECRET", "default_secret_key"),
                algorithms=["HS256"],
            )
            user_id = payload.get("userId")
            if not user_id:
                return JsonResponse({"error": "Invalid authentication token"}, status=401)
            try:
                pk = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except Exception:
                return JsonResponse({"error": "Invalid authentication token"}, status=401)
            user = User.objects.filter(pk=pk).first()
            if not user:
                return JsonResponse({"error": "User not found"}, status=401)
            request.user = user
            request.userId = user.pk
            return get_response(request)
        except jwt.InvalidTokenError as e:
            return JsonResponse(
                {"error": "Invalid authentication token", "details": str(e)},
                status=401,
            )
    return middleware
