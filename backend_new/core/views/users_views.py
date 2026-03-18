"""Users API - same behavior as Node backend."""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from bson import ObjectId

from core.models import User
from core.models.user import LearningPlanEmbed, ProfileEmbed


def _user_to_dict(user, include_password=False):
    d = {
        "_id": str(user.pk),
        "username": user.username,
        "email": user.email,
        "profile": {},
        "theme": getattr(user, "theme", None) or "blue",
    }
    if user.profile:
        d["profile"] = {
            "displayName": getattr(user.profile, "displayName", "") or "",
            "avatar": getattr(user.profile, "avatar", "") or "",
            "bio": getattr(user.profile, "bio", "") or "",
            "ttsVoice": getattr(user.profile, "ttsVoice", "") or "xiaoming",
        }
    if include_password and user.password:
        d["password"] = "[REDACTED]"
    return d


@require_http_methods(["GET"])
def user_search(request):
    try:
        q = request.GET.get("q", "").strip()
        if not q:
            return JsonResponse({"error": "Search query required"}, status=400)
        from django.db.models import Q
        users = User.objects.filter(
            Q(username__icontains=q) | Q(profile__displayName__icontains=q)
        )[:20]
        return JsonResponse({"users": [_user_to_dict(u) for u in users]})
    except Exception as e:
        return JsonResponse({"error": "Search failed", "message": str(e)}, status=500)


@csrf_exempt
def learning_plan(request):
    if request.method == "GET":
        return learning_plan_get(request)
    if request.method == "PATCH":
        return learning_plan_patch(request)
    return JsonResponse({"error": "Method not allowed"}, status=405)


def learning_plan_get(request):
    try:
        user = request.user
        if not user.learningPlan:
            user.learningPlan = LearningPlanEmbed(
                dailyWordGoal=10,
                weeklyWordGoal=50,
                monthlyWordGoal=200,
                difficulty="intermediate",
                preferredStudyTime=[],
            )
            user.save()
        lp = user.learningPlan
        return JsonResponse({
            "learningPlan": {
                "dailyWordGoal": getattr(lp, "dailyWordGoal", 10),
                "weeklyWordGoal": getattr(lp, "weeklyWordGoal", 50),
                "monthlyWordGoal": getattr(lp, "monthlyWordGoal", 200),
                "difficulty": getattr(lp, "difficulty", "intermediate"),
                "preferredStudyTime": getattr(lp, "preferredStudyTime", []) or [],
                "startDate": getattr(lp, "startDate", None),
            }
        })
    except Exception as e:
        return JsonResponse({"error": "Failed to get learning plan", "message": str(e)}, status=500)


def learning_plan_patch(request):
    try:
        body = json.loads(request.body)
        user = request.user
        if not user.learningPlan:
            user.learningPlan = LearningPlanEmbed(dailyWordGoal=10, weeklyWordGoal=50, monthlyWordGoal=200, difficulty="intermediate", preferredStudyTime=[])
        lp = user.learningPlan
        if "dailyWordGoal" in body:
            lp.dailyWordGoal = body["dailyWordGoal"]
        if "weeklyWordGoal" in body:
            lp.weeklyWordGoal = body["weeklyWordGoal"]
        if "monthlyWordGoal" in body:
            lp.monthlyWordGoal = body["monthlyWordGoal"]
        if "difficulty" in body:
            lp.difficulty = body["difficulty"]
        if "preferredStudyTime" in body:
            lp.preferredStudyTime = body["preferredStudyTime"]
        user.save()
        return JsonResponse({
            "message": "Learning plan updated successfully",
            "learningPlan": {
                "dailyWordGoal": lp.dailyWordGoal,
                "weeklyWordGoal": lp.weeklyWordGoal,
                "monthlyWordGoal": lp.monthlyWordGoal,
                "difficulty": lp.difficulty,
                "preferredStudyTime": lp.preferredStudyTime or [],
                "startDate": getattr(lp, "startDate", None),
            }
        })
    except Exception as e:
        return JsonResponse({"error": "Failed to update learning plan", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PATCH"])
def theme_patch(request):
    try:
        body = json.loads(request.body)
        theme = (body.get("theme") or "").strip()
        if theme not in ("pink", "green", "blue"):
            return JsonResponse({"error": "Invalid theme. Must be pink, green, or blue"}, status=400)
        user = request.user
        user.theme = theme
        user.save()
        return JsonResponse({"message": "Theme updated successfully", "theme": user.theme})
    except Exception as e:
        return JsonResponse({"error": "Failed to update theme", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PATCH"])
def profile_patch(request):
    try:
        body = json.loads(request.body)
        user = request.user
        if user.profile is None:
            user.profile = ProfileEmbed()
        if "displayName" in body:
            user.profile.displayName = body["displayName"]
        if "bio" in body:
            user.profile.bio = body["bio"]
        if "avatar" in body:
            user.profile.avatar = body["avatar"]
        if "ttsVoice" in body:
            user.profile.ttsVoice = (body["ttsVoice"] or "xiaoming").strip() or "xiaoming"
        user.save()
        return JsonResponse({
            "message": "Profile updated successfully",
            "user": {
                "_id": str(user.pk),
                "username": user.username,
                "email": user.email,
                "profile": {
                    "displayName": getattr(user.profile, "displayName", ""),
                    "avatar": getattr(user.profile, "avatar", ""),
                    "bio": getattr(user.profile, "bio", ""),
                    "ttsVoice": getattr(user.profile, "ttsVoice", "") or "xiaoming",
                },
            },
        })
    except Exception as e:
        return JsonResponse({"error": "Failed to update profile", "message": str(e)}, status=500)


@require_http_methods(["DELETE"])
def account_delete(request):
    try:
        request.user.delete()
        return JsonResponse({"message": "Account deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to delete account", "message": str(e)}, status=500)


@require_http_methods(["GET"])
def user_profile(request, user_id):
    try:
        u = User.objects.filter(pk=ObjectId(user_id)).first()
        if not u:
            return JsonResponse({"error": "User not found"}, status=404)
        return JsonResponse({"user": _user_to_dict(u)})
    except Exception as e:
        return JsonResponse({"error": "Failed to fetch user", "message": str(e)}, status=500)


@csrf_exempt
def follow_or_unfollow(request, user_id):
    if request.method == "POST":
        return follow(request, user_id)
    if request.method == "DELETE":
        return unfollow(request, user_id)
    return JsonResponse({"error": "Method not allowed"}, status=405)


def follow(request, user_id):
    try:
        target_id = ObjectId(user_id)
        me_id = request.userId
        if target_id == me_id:
            return JsonResponse({"error": "Cannot follow yourself"}, status=400)
        user = request.user
        target = User.objects.filter(pk=target_id).first()
        if not target:
            return JsonResponse({"error": "User not found"}, status=404)
        following = list(user.following) if user.following else []
        if target_id in following:
            return JsonResponse({"error": "Already following this user"}, status=400)
        following.append(target_id)
        user.following = following
        followers = list(target.followers) if target.followers else []
        followers.append(me_id)
        target.followers = followers
        user.save()
        target.save()
        return JsonResponse({"message": "Successfully followed user"})
    except Exception as e:
        return JsonResponse({"error": "Failed to follow user", "message": str(e)}, status=500)


def unfollow(request, user_id):
    try:
        target_id = ObjectId(user_id)
        me_id = request.userId
        user = request.user
        target = User.objects.filter(pk=target_id).first()
        if not target:
            return JsonResponse({"error": "User not found"}, status=404)
        user.following = [x for x in (user.following or []) if x != target_id]
        target.followers = [x for x in (target.followers or []) if x != me_id]
        user.save()
        target.save()
        return JsonResponse({"message": "Successfully unfollowed user"})
    except Exception as e:
        return JsonResponse({"error": "Failed to unfollow user", "message": str(e)}, status=500)
