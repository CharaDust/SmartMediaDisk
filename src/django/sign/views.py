import json

from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def sign_in(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST is allowed.'}, status=405)

    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON payload.'}, status=400)

    username = (payload.get('username') or '').strip()
    password = payload.get('password') or ''
    remember_me = bool(payload.get('rememberMe', False))

    if not username or not password:
        return JsonResponse({'status': 'error', 'message': '用户名和密码不能为空。'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'status': 'error', 'message': '用户名或密码错误。'}, status=401)

    login(request, user)
    if remember_me:
        request.session.set_expiry(7 * 24 * 60 * 60)
    else:
        request.session.set_expiry(0)

    return JsonResponse({
        'status': 'success',
        'message': '登录成功。',
        'data': {
            'username': user.get_username(),
            'is_superuser': user.is_superuser,
        }
    })
