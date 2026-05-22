from sign.permission_service import is_root_user, user_has_permission

from .path_utils import permission_path_fragment


def can_list_directory(user, path):
    """Return whether a user can open a shared logical directory."""
    if is_root_user(user):
        return True

    if not user or not user.is_authenticated:
        return False

    return (
        user_has_permission(user, 'files.list.all')
        or user_has_permission(user, 'files.list.own')
        or user_has_permission(user, f'files.list.path.{permission_path_fragment(path)}')
    )


def can_upload_file(user, path):
    """Return whether a user can upload into a logical directory."""
    if is_root_user(user):
        return True

    if not user or not user.is_authenticated:
        return False

    if user_has_permission(user, 'files.upload.own'):
        return True

    return user_has_permission(user, f'files.upload.path.{permission_path_fragment(path)}')


def can_see_file_in_list(user, entry):
    """Return whether a file entry should appear in a directory listing."""
    return _can_access_file(user, entry, 'list')


def can_download_file(user, entry):
    """Return whether a user can download a file entry."""
    return _can_access_file(user, entry, 'download')


def can_preview_file(user, entry):
    """Return whether a user can preview a file entry."""
    return can_download_file(user, entry)


def can_rename_file(user, entry):
    """Return whether a user can rename a file entry."""
    return _can_access_file(user, entry, 'rename')


def can_move_file(user, entry, target_path):
    """Return whether a user can move a file entry."""
    return _can_access_file(user, entry, 'move') and _can_access_path(
        user,
        'move',
        target_path,
    )


def can_delete_file(user, entry):
    """Return whether a user can delete a file entry."""
    return _can_access_file(user, entry, 'delete')


def can_share_file(user, entry):
    """Return whether a user can attach a file entry to an internal share mail."""
    return _can_access_file(user, entry, 'share')


def can_manage_directory(user, path, action):
    """Return whether a user can perform a directory-management action."""
    return _can_access_path(user, action, path)


def _can_access_file(user, entry, action):
    if is_root_user(user):
        return True

    if not user or not user.is_authenticated:
        return False

    if user_has_permission(user, f'files.{action}.all'):
        return True

    if entry.owner == user and user_has_permission(user, f'files.{action}.own'):
        return True

    return user_has_permission(user, f'files.{action}.path.{permission_path_fragment(entry.parent_path)}')


def _can_access_path(user, action, path):
    if is_root_user(user):
        return True

    if not user or not user.is_authenticated:
        return False

    return (
        user_has_permission(user, f'files.{action}.all')
        or user_has_permission(user, f'files.{action}.own')
        or user_has_permission(user, f'files.{action}.path.{permission_path_fragment(path)}')
    )
