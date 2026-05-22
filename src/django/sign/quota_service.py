from django.db.models import Sum

from .models import UserStorageQuota


MAX_QUOTA_BYTES = 9223372036854775807


def normalize_quota_bytes(value):
    """Normalize a submitted quota byte value."""
    if value is None or value == '':
        return None

    if isinstance(value, bool):
        raise ValueError('Storage quota must be a non-negative integer or null.')

    try:
        quota_bytes = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError('Storage quota must be a non-negative integer or null.') from error

    if quota_bytes < 0:
        raise ValueError('Storage quota must be a non-negative integer or null.')

    if quota_bytes > MAX_QUOTA_BYTES:
        raise ValueError('Storage quota is too large.')

    return quota_bytes


def get_user_quota_bytes(user):
    """Return the user's quota in bytes, or None for unlimited."""
    quota = UserStorageQuota.objects.filter(user=user).first()
    if quota is None:
        return None

    return quota.quota_bytes


def set_user_quota_bytes(user, quota_bytes):
    """Set the user's storage quota in bytes, or None for unlimited."""
    quota_bytes = normalize_quota_bytes(quota_bytes)
    quota, _ = UserStorageQuota.objects.update_or_create(
        user=user,
        defaults={
            'quota_bytes': quota_bytes,
        },
    )
    return quota


def get_user_used_bytes(user):
    """Return total logical storage used by a user."""
    from files.models import FileEntry

    result = FileEntry.objects.filter(owner=user).aggregate(total=Sum('size'))
    return result['total'] or 0


def get_user_storage_summary(user):
    """Return storage usage and quota details for a user."""
    quota_bytes = get_user_quota_bytes(user)
    used_bytes = get_user_used_bytes(user)
    available_bytes = None if quota_bytes is None else max(quota_bytes - used_bytes, 0)

    return {
        'quota_bytes': quota_bytes,
        'used_bytes': used_bytes,
        'available_bytes': available_bytes,
        'is_unlimited': quota_bytes is None,
    }


def ensure_upload_fits_quota(user, upload_size):
    """Raise ValueError when an upload would exceed the user's quota."""
    quota_bytes = get_user_quota_bytes(user)
    if quota_bytes is None:
        return

    used_bytes = get_user_used_bytes(user)
    if used_bytes + int(upload_size or 0) > quota_bytes:
        raise ValueError('Storage quota exceeded.')


def get_global_storage_summary():
    """Return logical and deduplicated physical storage totals."""
    from files.models import FileEntry, FileObject

    logical_result = FileEntry.objects.aggregate(total=Sum('size'))
    physical_result = FileObject.objects.aggregate(total=Sum('size'))
    logical_bytes = logical_result['total'] or 0
    physical_bytes = physical_result['total'] or 0

    return {
        'logical_bytes': logical_bytes,
        'physical_bytes': physical_bytes,
        'deduplicated_saved_bytes': max(logical_bytes - physical_bytes, 0),
    }
