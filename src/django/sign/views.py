import json
import logging
import traceback

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)


def _json_error(message, status):
    return JsonResponse(
        {
            'status': 'error',
            'message': message,
        },
        status=status,
    )


def _get_exception_message(exception):
    """Return a safe diagnostic message for the given exception."""
    if settings.DEBUG:
        return f'{type(exception).__name__}: {exception}'
    return 'Internal server error.'


def _read_payload(request):
    content_type = request.META.get('CONTENT_TYPE', '')
    if 'application/json' in content_type:
        try:
            return json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return None

    return request.POST


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.get_username(),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }


@csrf_exempt
@require_POST
def sign_in(request):
    try:
        return _sign_in_impl(request)
    except Exception as exc:
        logger.exception('sign_in failed')
        return _json_error(_get_exception_message(exc), 500)


def _sign_in_impl(request):
    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    username = (payload.get('username') or '').strip()
    password = payload.get('password') or ''
    remember_me = str(payload.get('rememberMe', '')).lower() in {'1', 'true', 'yes', 'on'}

    if not username or not password:
        return _json_error('Username and password are required.', 400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return _json_error('Invalid username or password.', 401)

    login(request, user)
    request.session.set_expiry(7 * 24 * 60 * 60 if remember_me else 0)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Signed in successfully.',
            'data': {
                'user': _serialize_user(user),
            },
        }
    )


@require_GET
def session_status(request):
    try:
        return _session_status_impl(request)
    except Exception as exc:
        logger.exception('session_status failed')
        return _json_error(_get_exception_message(exc), 500)


def _session_status_impl(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'authenticated': False,
                    'user': None,
                },
            }
        )

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'authenticated': True,
                'user': _serialize_user(user),
            },
        }
    )


@csrf_exempt
@require_POST
def sign_out(request):
    try:
        logout(request)
    except Exception as exc:
        logger.exception('sign_out failed')
        return _json_error(_get_exception_message(exc), 500)
    return JsonResponse(
        {
            'status': 'success',
            'message': 'Signed out successfully.',
        }
    )
