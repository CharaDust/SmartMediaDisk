import json

from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .permission_service import is_root_user, user_has_permission


READ_PERMISSION = 'users.read'
CREATE_PERMISSION = 'users.create'
UPDATE_PERMISSION = 'users.update'
DELETE_PERMISSION = 'users.delete'
PASSWORD_RESET_PERMISSION = 'users.password.reset'
MIN_PASSWORD_LENGTH = 6


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


def _require_permission(request, node):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    if not user_has_permission(request.user, node):
        return _json_error('Permission denied.', 403)

    return None


def _get_user_or_error(user_id):
    User = get_user_model()
    try:
        return User.objects.get(pk=user_id), None
    except User.DoesNotExist:
        return None, _json_error('User not found.', 404)


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.get_username(),
        'email': user.email,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_root': is_root_user(user),
        'date_joined': user.date_joined.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
    }


def _validate_username(username, current_user=None):
    username = (username or '').strip()
    if not username:
        return None, _json_error('Username is required.', 400)

    User = get_user_model()
    username_field = User._meta.get_field(User.USERNAME_FIELD)
    max_length = username_field.max_length
    if max_length and len(username) > max_length:
        return None, _json_error(f'Username must be at most {max_length} characters.', 400)

    query = User.objects.filter(**{User.USERNAME_FIELD: username})
    if current_user is not None:
        query = query.exclude(pk=current_user.pk)

    if query.exists():
        return None, _json_error('Username already exists.', 409)

    return username, None


def _validate_password(password):
    password = password or ''
    if len(password) < MIN_PASSWORD_LENGTH:
        return _json_error(f'Password must be at least {MIN_PASSWORD_LENGTH} characters.', 400)

    return None


@require_GET
def users(request):
    """Return user list when the current user can read users."""
    permission_error = _require_permission(request, READ_PERMISSION)
    if permission_error:
        return permission_error

    User = get_user_model()
    user_list = [_serialize_user(user) for user in User.objects.order_by(User.USERNAME_FIELD)]

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'users': user_list,
            },
        }
    )


@csrf_exempt
@require_POST
def create_user(request):
    """Create a user when the current user has user creation permission."""
    permission_error = _require_permission(request, CREATE_PERMISSION)
    if permission_error:
        return permission_error

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    username, username_error = _validate_username(payload.get('username'))
    if username_error:
        return username_error

    password = payload.get('password') or ''
    password_error = _validate_password(password)
    if password_error:
        return password_error

    User = get_user_model()
    user = User(
        **{
            User.USERNAME_FIELD: username,
            'email': (payload.get('email') or '').strip(),
            'is_active': bool(payload.get('isActive', True)),
        }
    )
    user.set_password(password)
    user.save()

    return JsonResponse(
        {
            'status': 'success',
            'message': 'User created.',
            'data': {
                'user': _serialize_user(user),
            },
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['GET', 'PUT', 'DELETE'])
def user_detail(request, user_id):
    """Read, update, or delete a user according to the current user's permission."""
    permission_by_method = {
        'GET': READ_PERMISSION,
        'PUT': UPDATE_PERMISSION,
        'DELETE': DELETE_PERMISSION,
    }
    permission_error = _require_permission(request, permission_by_method[request.method])
    if permission_error:
        return permission_error

    user, user_error = _get_user_or_error(user_id)
    if user_error:
        return user_error

    if request.method == 'GET':
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'user': _serialize_user(user),
                },
            }
        )

    if request.method == 'DELETE':
        if is_root_user(user):
            return _json_error('The root user cannot be deleted.', 403)

        user.delete()
        return JsonResponse(
            {
                'status': 'success',
                'message': 'User deleted.',
            }
        )

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    username = (payload.get('username', user.get_username()) or '').strip()
    if is_root_user(user) and username != user.get_username():
        return _json_error('The root username is locked and cannot be changed.', 403)

    username, username_error = _validate_username(username, current_user=user)
    if username_error:
        return username_error

    update_fields = []
    username_field = get_user_model().USERNAME_FIELD
    if getattr(user, username_field) != username:
        setattr(user, username_field, username)
        update_fields.append(username_field)

    email = (payload.get('email') or '').strip()
    if user.email != email:
        user.email = email
        update_fields.append('email')

    if 'isActive' in payload:
        is_active = bool(payload.get('isActive'))
        if is_root_user(user) and not is_active:
            return _json_error('The root user cannot be disabled.', 403)

        if user.is_active != is_active:
            user.is_active = is_active
            update_fields.append('is_active')

    if update_fields:
        user.save(update_fields=update_fields)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'User updated.',
            'data': {
                'user': _serialize_user(user),
            },
        }
    )


@csrf_exempt
@require_POST
def reset_user_password(request, user_id):
    """Reset a user's password when the current user has password reset permission."""
    permission_error = _require_permission(request, PASSWORD_RESET_PERMISSION)
    if permission_error:
        return permission_error

    user, user_error = _get_user_or_error(user_id)
    if user_error:
        return user_error

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    new_password = payload.get('newPassword') or ''
    password_error = _validate_password(new_password)
    if password_error:
        return password_error

    user.set_password(new_password)
    user.save(update_fields=['password'])

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Password reset.',
        }
    )
