import re

from django.db import transaction

from .models import PermissionNode, UserPermission
from .permission_nodes import DEPRECATED_PERMISSION_NODES, PERMISSION_NODES


NODE_PATTERN = re.compile(r'^[a-z0-9_?*-]+(?:\.[a-z0-9_?*-]+)*$')
ROOT_USERNAME = 'root'
ROOT_PERMISSION_NODE = '*'


def is_root_user(user):
    """Return whether the user owns the locked root permission."""
    return bool(user and user.is_authenticated and user.get_username() == ROOT_USERNAME)


def ensure_permission_nodes():
    """Upsert built-in permission node metadata."""
    PermissionNode.objects.filter(node__in=DEPRECATED_PERMISSION_NODES).update(is_active=False)
    UserPermission.objects.filter(node__in=DEPRECATED_PERMISSION_NODES).delete()

    for item in PERMISSION_NODES:
        PermissionNode.objects.update_or_create(
            node=item['node'],
            defaults={
                'label': item['label'],
                'category': item['category'],
                'description': item['description'],
                'is_active': True,
            },
        )


def validate_permission_node(node):
    """Validate a permission node submitted by the editor."""
    if not isinstance(node, str):
        return False

    node = node.strip()
    if not node or node == ROOT_PERMISSION_NODE:
        return False

    return NODE_PATTERN.match(node) is not None


def get_candidate_nodes(node):
    """Return exact and wildcard candidates from most to least specific."""
    parts = node.split('.')
    candidates = [node]

    for index in range(len(parts) - 1, 0, -1):
        candidates.append('.'.join(parts[:index] + ['*']))

    candidates.append(ROOT_PERMISSION_NODE)
    return candidates


def user_has_permission(user, node):
    """Check the effective permission value for a user and node."""
    if is_root_user(user):
        return True

    if not user or not user.is_authenticated or not validate_permission_node(node):
        return False

    candidates = get_candidate_nodes(node)
    permissions = {
        permission.node: permission.value
        for permission in UserPermission.objects.filter(user=user, node__in=candidates)
    }

    for candidate in candidates:
        if candidate in permissions:
            return permissions[candidate]

    return False


DEFAULT_OWN_PERMISSION_NODES = [
    'files.list.own',
    'files.upload.own',
    'files.download.own',
    'files.rename.own',
    'files.move.own',
    'files.delete.own',
    'files.share.own',
]


def grant_default_permissions(user):
    """Grant a new user the default file self-operation permissions."""
    for node in DEFAULT_OWN_PERMISSION_NODES:
        UserPermission.objects.get_or_create(
            user=user,
            node=node,
            defaults={'value': True},
        )


def serialize_user_permission(permission):
    """Serialize a direct user permission row."""
    return {
        'node': permission.node,
        'value': permission.value,
        'source': 'user',
    }


@transaction.atomic
def replace_user_permissions(user, entries):
    """Replace a user's direct permissions with the submitted entries."""
    normalized = {}
    for entry in entries:
        node = str(entry.get('node', '')).strip()
        value = bool(entry.get('value'))
        if not validate_permission_node(node):
            raise ValueError(f'Invalid permission node: {node or "(empty)"}')

        normalized[node] = value

    UserPermission.objects.filter(user=user).exclude(node__in=normalized.keys()).delete()

    for node, value in normalized.items():
        UserPermission.objects.update_or_create(
            user=user,
            node=node,
            defaults={
                'value': value,
            },
        )

    return list(UserPermission.objects.filter(user=user))
