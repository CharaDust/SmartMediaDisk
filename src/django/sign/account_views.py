import json

from django.contrib.auth import get_user_model, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import SiteSetting
from .permission_service import is_root_user, user_has_permission
from .quota_service import get_user_storage_summary


USERNAME_UPDATE_PERMISSION = 'account.username.update'
PASSWORD_UPDATE_PERMISSION = 'account.password.update'
NAVBAR_TITLE_UPDATE_PERMISSION = 'account.navbar_title.update'
NAVBAR_TITLE_KEY = 'navbar_title'
DEFAULT_NAVBAR_TITLE = 'Media Cube'
MAX_NAVBAR_TITLE_LENGTH = 60


def _json_error(message, status):
    return JsonResponse(
        {
            'status': 'error',
            'message': message,
        },
        status=status,
    )


def _read_payload(request):
    try:
        return json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return None


def _require_authenticated(request):
    if not request.user.is_authenticated:
        return _json_error('Authentication required.', 401)

    return None


def _get_navbar_title():
    setting = SiteSetting.objects.filter(key=NAVBAR_TITLE_KEY).first()
    if not setting or not setting.value.strip():
        return DEFAULT_NAVBAR_TITLE

    return setting.value


def _set_navbar_title(title):
    setting, _ = SiteSetting.objects.update_or_create(
        key=NAVBAR_TITLE_KEY,
        defaults={
            'value': title,
        },
    )
    return setting.value


def _serialize_account(user):
    return {
        'id': user.id,
        'username': user.get_username(),
        'email': user.email,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'storage': get_user_storage_summary(user),
        'settings': {
            'navbar_title': _get_navbar_title(),
        },
        'permissions': {
            'can_update_username': (
                not is_root_user(user)
                and user_has_permission(user, USERNAME_UPDATE_PERMISSION)
            ),
            'can_update_password': user_has_permission(user, PASSWORD_UPDATE_PERMISSION),
            'can_update_navbar_title': user_has_permission(user, NAVBAR_TITLE_UPDATE_PERMISSION),
        },
    }


@require_GET
def account_detail(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'account': _serialize_account(request.user),
            },
        }
    )


@require_GET
def navbar_title(request):
    """Return the public navigation bar title setting."""
    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'navbar_title': _get_navbar_title(),
                'default_navbar_title': DEFAULT_NAVBAR_TITLE,
            },
        }
    )


@csrf_exempt
@require_POST
def update_navbar_title(request):
    """Update the navigation bar title when the user has permission."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    if not user_has_permission(request.user, NAVBAR_TITLE_UPDATE_PERMISSION):
        return _json_error('Permission denied.', 403)

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    title = (payload.get('navbarTitle') or '').strip()
    if not title:
        return _json_error('Navbar title is required.', 400)

    if len(title) > MAX_NAVBAR_TITLE_LENGTH:
        return _json_error(f'Navbar title must be at most {MAX_NAVBAR_TITLE_LENGTH} characters.', 400)

    title = _set_navbar_title(title)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Navbar title updated.',
            'data': {
                'navbar_title': title,
            },
        }
    )


@csrf_exempt
@require_POST
def update_username(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    if not user_has_permission(request.user, USERNAME_UPDATE_PERMISSION):
        return _json_error('Permission denied.', 403)

    if is_root_user(request.user):
        return _json_error('The root username is locked and cannot be changed.', 403)

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    username = (payload.get('username') or '').strip()
    if not username:
        return _json_error('Username is required.', 400)

    User = get_user_model()
    username_field = User._meta.get_field(User.USERNAME_FIELD)
    max_length = username_field.max_length
    if max_length and len(username) > max_length:
        return _json_error(f'Username must be at most {max_length} characters.', 400)

    conflict = User.objects.filter(**{User.USERNAME_FIELD: username}).exclude(pk=request.user.pk).exists()
    if conflict:
        return _json_error('Username already exists.', 409)

    setattr(request.user, User.USERNAME_FIELD, username)
    request.user.save(update_fields=[User.USERNAME_FIELD])
    logout(request)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Username updated. Please sign in again.',
        }
    )


@csrf_exempt
@require_POST
def update_password(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    if not user_has_permission(request.user, PASSWORD_UPDATE_PERMISSION):
        return _json_error('Permission denied.', 403)

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    old_password = payload.get('oldPassword') or ''
    new_password = payload.get('newPassword') or ''
    if not old_password or not new_password:
        return _json_error('Old password and new password are required.', 400)

    if not request.user.check_password(old_password):
        return _json_error('Old password is incorrect.', 400)

    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])
    logout(request)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Password updated. Please sign in again.',
        }
    )
