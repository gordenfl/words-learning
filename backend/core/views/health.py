from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "message": "Words Learning API is running"})
