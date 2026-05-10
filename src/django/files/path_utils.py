import re


NAME_MAX_LENGTH = 255
PATH_MAX_LENGTH = 1024
INVALID_NAME_PATTERN = re.compile(r'[\\/\x00-\x1f\x7f]')
PATH_PERMISSION_PATTERN = re.compile(r'[^a-z0-9_-]+')


def normalize_path(value):
    """Normalize a user-submitted logical directory path."""
    value = (value or '').replace('\\', '/').strip()
    if value in {'', '/'}:
        return ''

    parts = [part.strip() for part in value.split('/') if part.strip()]
    if any(part in {'.', '..'} for part in parts):
        raise ValueError('Path cannot contain "." or "..".')

    path = '/'.join(parts)
    if len(path) > PATH_MAX_LENGTH:
        raise ValueError(f'Path must be at most {PATH_MAX_LENGTH} characters.')

    return path


def normalize_name(value, item_label='Name'):
    """Normalize a file or directory name."""
    name = (value or '').strip()
    if not name:
        raise ValueError(f'{item_label} is required.')

    if name in {'.', '..'} or INVALID_NAME_PATTERN.search(name):
        raise ValueError(f'{item_label} contains invalid characters.')

    if len(name) > NAME_MAX_LENGTH:
        raise ValueError(f'{item_label} must be at most {NAME_MAX_LENGTH} characters.')

    return name


def join_path(parent_path, name):
    """Join a normalized parent path and item name."""
    parent_path = normalize_path(parent_path)
    name = normalize_name(name)
    if not parent_path:
        return name

    path = f'{parent_path}/{name}'
    if len(path) > PATH_MAX_LENGTH:
        raise ValueError(f'Path must be at most {PATH_MAX_LENGTH} characters.')

    return path


def split_path(path):
    """Split a normalized path into parent path and final name."""
    path = normalize_path(path)
    if not path:
        return '', ''

    if '/' not in path:
        return '', path

    parent, name = path.rsplit('/', 1)
    return parent, name


def display_path(path):
    """Return a slash-prefixed path for API responses."""
    path = normalize_path(path)
    return f'/{path}' if path else '/'


def permission_path_fragment(path):
    """Encode a logical path into a permission-node-safe fragment."""
    path = normalize_path(path).lower()
    if not path:
        return 'root'

    return PATH_PERMISSION_PATTERN.sub('-', path).strip('-') or 'root'

