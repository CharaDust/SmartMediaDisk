import json

from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .models import PermissionNode, UserPermission
from .permission_service import (
    ROOT_PERMISSION_NODE,
    ensure_permission_nodes,
    is_root_user,
    replace_user_permissions,
    serialize_user_permission,
    user_has_permission,
    validate_permission_node,
)


EDIT_PERMISSION_NODE = 'permissions.table.edit'


def _json_error(message, status):
    return JsonResponse(
        {
            'status': 'error',
            'message': message,
        },
        status=status,
    )


def _read_json_payload(request):
    try:
        return json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return None


def _require_authenticated(request):
    if not request.user.is_authenticated:
        return _json_error('Authentication required.', 401)

    return None


def _require_permission_editor(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    if not user_has_permission(request.user, EDIT_PERMISSION_NODE):
        return _json_error('Permission denied.', 403)

    return None


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.get_username(),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_root': is_root_user(user),
    }


def _serialize_node(node):
    return {
        'node': node.node,
        'label': node.label,
        'category': node.category,
        'description': node.description,
        'is_dangerous': node.is_dangerous,
        'is_system_locked': node.is_system_locked,
    }


def _serialize_user_detail(user):
    direct_permissions = [
        serialize_user_permission(permission)
        for permission in UserPermission.objects.filter(user=user)
    ]
    locked_permissions = []

    if is_root_user(user):
        locked_permissions.append(
            {
                'node': ROOT_PERMISSION_NODE,
                'value': True,
                'source': 'system',
                'locked': True,
            }
        )

    return {
        'user': _serialize_user(user),
        'direct_permissions': direct_permissions,
        'locked_permissions': locked_permissions,
        'effective_permissions': locked_permissions + direct_permissions,
    }


@require_GET
def check_permission(request):
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    node = (request.GET.get('node') or '').strip()
    if node != ROOT_PERMISSION_NODE and not validate_permission_node(node):
        return _json_error('Invalid permission node.', 400)

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'node': node,
                'allowed': user_has_permission(request.user, node),
            },
        }
    )


@require_GET
def permission_nodes(request):
    editor_error = _require_permission_editor(request)
    if editor_error:
        return editor_error

    ensure_permission_nodes()
    nodes = [_serialize_node(node) for node in PermissionNode.objects.filter(is_active=True)]

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'nodes': nodes,
            },
        }
    )


@require_GET
def permission_users(request):
    editor_error = _require_permission_editor(request)
    if editor_error:
        return editor_error

    User = get_user_model()
    users = []

    for user in User.objects.order_by('username'):
        direct_count = UserPermission.objects.filter(user=user).count()
        users.append(
            {
                **_serialize_user(user),
                'direct_permission_count': direct_count,
                'locked_permission_count': 1 if is_root_user(user) else 0,
            }
        )

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'users': users,
            },
        }
    )


@csrf_exempt
@require_http_methods(['GET', 'PUT'])
def user_permissions(request, user_id):
    editor_error = _require_permission_editor(request)
    if editor_error:
        return editor_error

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return _json_error('User not found.', 404)

    if request.method == 'GET':
        return JsonResponse(
            {
                'status': 'success',
                'data': _serialize_user_detail(user),
            }
        )

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    entries = payload.get('permissions')
    if not isinstance(entries, list):
        return _json_error('Permissions must be a list.', 400)

    try:
        replace_user_permissions(user, entries)
    except ValueError as error:
        return _json_error(str(error), 400)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Permissions saved.',
            'data': _serialize_user_detail(user),
        }
    )
