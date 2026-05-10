import json

from django.db import transaction
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .models import DirectoryEntry, FileEntry
from .path_utils import display_path, join_path, normalize_name, normalize_path, split_path
from .permissions import (
    can_delete_file,
    can_download_file,
    can_list_directory,
    can_see_file_in_list,
    can_manage_directory,
    can_move_file,
    can_rename_file,
    can_upload_file,
)
from .storage_service import create_file_entry, delete_file_entry, get_physical_path


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


def _serialize_owner(user):
    return {
        'id': user.id,
        'username': user.get_username(),
    }


def _serialize_file(entry):
    return {
        'id': entry.id,
        'type': 'file',
        'name': entry.name,
        'path': display_path(entry.path),
        'parent_path': display_path(entry.parent_path),
        'logical_id': entry.logical_id,
        'sha256': entry.file_object.sha256,
        'serial': entry.serial,
        'size': entry.size,
        'mime_type': entry.mime_type,
        'owner': _serialize_owner(entry.owner),
        'created_at': entry.created_at.isoformat(),
        'updated_at': entry.updated_at.isoformat(),
    }


def _serialize_directory(directory):
    return {
        'id': directory.id,
        'type': 'directory',
        'name': directory.name,
        'path': display_path(directory.path),
        'parent_path': display_path(directory.parent_path),
        'created_by': _serialize_owner(directory.created_by) if directory.created_by else None,
        'created_at': directory.created_at.isoformat(),
        'updated_at': directory.updated_at.isoformat(),
    }


def _directory_exists(path):
    path = normalize_path(path)
    if not path:
        return True

    parent_path, name = split_path(path)
    return DirectoryEntry.objects.filter(parent_path=parent_path, name=name).exists()


def _get_directory_or_error(directory_id):
    try:
        return DirectoryEntry.objects.select_related('created_by').get(pk=directory_id)
    except DirectoryEntry.DoesNotExist:
        return None


def _get_file_or_error(entry_id):
    try:
        return FileEntry.objects.select_related('owner', 'file_object').get(pk=entry_id)
    except FileEntry.DoesNotExist:
        return None


@require_GET
def list_files(request):
    """List files and directories for a logical path."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    try:
        path = normalize_path(request.GET.get('path'))
    except ValueError as error:
        return _json_error(str(error), 400)

    if not can_list_directory(request.user, path):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(path):
        return _json_error('Directory not found.', 404)

    directories = DirectoryEntry.objects.filter(parent_path=path).select_related('created_by')
    file_queryset = FileEntry.objects.filter(parent_path=path).select_related('owner', 'file_object')
    files = [entry for entry in file_queryset if can_see_file_in_list(request.user, entry)]

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'path': display_path(path),
                'directories': [_serialize_directory(directory) for directory in directories],
                'files': [_serialize_file(entry) for entry in files],
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def upload_file(request):
    """Upload a file into the current user's logical directory."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    uploaded_file = request.FILES.get('file')
    if uploaded_file is None:
        return _json_error('Upload field "file" is required.', 400)

    try:
        parent_path = normalize_path(request.POST.get('path'))
    except ValueError as error:
        return _json_error(str(error), 400)

    if not can_upload_file(request.user, parent_path):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(parent_path):
        return _json_error('Target directory not found.', 404)

    try:
        upload_name = normalize_name(uploaded_file.name, 'File name')
    except ValueError as error:
        return _json_error(str(error), 400)

    if DirectoryEntry.objects.filter(parent_path=parent_path, name=upload_name).exists():
        return _json_error('A directory with this name already exists in the target directory.', 409)

    try:
        entry = create_file_entry(request.user, uploaded_file, parent_path)
    except ValueError as error:
        return _json_error(str(error), 409)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'File uploaded.',
            'data': {
                'file': _serialize_file(entry),
            },
        },
        status=201,
    )


@require_GET
def download_file(request, entry_id):
    """Download a file when the user has permission."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    if not can_download_file(request.user, entry):
        return _json_error('Permission denied.', 403)

    response = FileResponse(
        get_physical_path(entry.file_object).open('rb'),
        as_attachment=True,
        filename=entry.name,
        content_type=entry.mime_type or entry.file_object.mime_type or 'application/octet-stream',
    )
    return response


@csrf_exempt
@require_http_methods(['DELETE'])
def delete_file(request, entry_id):
    """Delete a logical file entry and collect unused content."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    if not can_delete_file(request.user, entry):
        return _json_error('Permission denied.', 403)

    collected = delete_file_entry(entry)
    return JsonResponse(
        {
            'status': 'success',
            'message': 'File deleted.',
            'data': {
                'physical_file_collected': collected,
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def rename_file(request, entry_id):
    """Rename a logical file entry."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    if not can_rename_file(request.user, entry):
        return _json_error('Permission denied.', 403)

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        name = normalize_name(payload.get('name'), 'File name')
    except ValueError as error:
        return _json_error(str(error), 400)

    conflict = FileEntry.objects.filter(
        parent_path=entry.parent_path,
        name=name,
    ).exclude(pk=entry.pk).exists()
    directory_conflict = DirectoryEntry.objects.filter(
        parent_path=entry.parent_path,
        name=name,
    ).exists()
    if conflict or directory_conflict:
        return _json_error('A file with this name already exists in the target directory.', 409)

    entry.name = name
    entry.save(update_fields=['name', 'updated_at'])
    return JsonResponse(
        {
            'status': 'success',
            'message': 'File renamed.',
            'data': {
                'file': _serialize_file(entry),
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def move_file(request, entry_id):
    """Move a logical file entry to another directory."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        target_path = normalize_path(payload.get('path'))
    except ValueError as error:
        return _json_error(str(error), 400)

    if not can_move_file(request.user, entry, target_path):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(target_path):
        return _json_error('Target directory not found.', 404)

    conflict = FileEntry.objects.filter(
        parent_path=target_path,
        name=entry.name,
    ).exclude(pk=entry.pk).exists()
    directory_conflict = DirectoryEntry.objects.filter(
        parent_path=target_path,
        name=entry.name,
    ).exists()
    if conflict or directory_conflict:
        return _json_error('A file with this name already exists in the target directory.', 409)

    entry.parent_path = target_path
    entry.save(update_fields=['parent_path', 'updated_at'])
    return JsonResponse(
        {
            'status': 'success',
            'message': 'File moved.',
            'data': {
                'file': _serialize_file(entry),
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def create_directory(request):
    """Create a logical directory."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        parent_path = normalize_path(payload.get('parent_path') or payload.get('path'))
        name = normalize_name(payload.get('name'), 'Directory name')
        directory_path = join_path(parent_path, name)
    except ValueError as error:
        return _json_error(str(error), 400)

    if not can_upload_file(request.user, parent_path):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(parent_path):
        return _json_error('Parent directory not found.', 404)

    if DirectoryEntry.objects.filter(parent_path=parent_path, name=name).exists():
        return _json_error('A directory with this name already exists in the target directory.', 409)
    if FileEntry.objects.filter(parent_path=parent_path, name=name).exists():
        return _json_error('A file with this name already exists in the target directory.', 409)

    directory = DirectoryEntry.objects.create(created_by=request.user, parent_path=parent_path, name=name)
    return JsonResponse(
        {
            'status': 'success',
            'message': 'Directory created.',
            'data': {
                'directory': _serialize_directory(directory),
                'path': display_path(directory_path),
            },
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['POST'])
def rename_directory(request, directory_id):
    """Rename a logical directory and all descendants."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    directory = _get_directory_or_error(directory_id)
    if directory is None:
        return _json_error('Directory not found.', 404)

    if not can_manage_directory(request.user, directory.parent_path, 'rename'):
        return _json_error('Permission denied.', 403)

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        name = normalize_name(payload.get('name'), 'Directory name')
    except ValueError as error:
        return _json_error(str(error), 400)

    conflict = DirectoryEntry.objects.filter(
        parent_path=directory.parent_path,
        name=name,
    ).exclude(pk=directory.pk).exists()
    file_conflict = FileEntry.objects.filter(
        parent_path=directory.parent_path,
        name=name,
    ).exists()
    if conflict or file_conflict:
        return _json_error('A directory with this name already exists in the target directory.', 409)

    old_path = directory.path
    new_path = join_path(directory.parent_path, name)
    _rename_directory_tree(directory, old_path, new_path, name)
    directory.refresh_from_db()

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Directory renamed.',
            'data': {
                'directory': _serialize_directory(directory),
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def move_directory(request, directory_id):
    """Move a logical directory and all descendants."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    directory = _get_directory_or_error(directory_id)
    if directory is None:
        return _json_error('Directory not found.', 404)

    payload = _read_json_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        target_parent = normalize_path(payload.get('path'))
    except ValueError as error:
        return _json_error(str(error), 400)

    if not can_manage_directory(request.user, directory.parent_path, 'move'):
        return _json_error('Permission denied.', 403)

    if not can_manage_directory(request.user, target_parent, 'move'):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(target_parent):
        return _json_error('Target directory not found.', 404)

    old_path = directory.path
    if target_parent == old_path or target_parent.startswith(f'{old_path}/'):
        return _json_error('A directory cannot be moved into itself.', 400)

    conflict = DirectoryEntry.objects.filter(
        parent_path=target_parent,
        name=directory.name,
    ).exclude(pk=directory.pk).exists()
    file_conflict = FileEntry.objects.filter(
        parent_path=target_parent,
        name=directory.name,
    ).exists()
    if conflict or file_conflict:
        return _json_error('A directory with this name already exists in the target directory.', 409)

    new_path = join_path(target_parent, directory.name)
    _move_directory_tree(directory, old_path, new_path, target_parent)
    directory.refresh_from_db()

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Directory moved.',
            'data': {
                'directory': _serialize_directory(directory),
            },
        }
    )


@csrf_exempt
@require_http_methods(['DELETE'])
def delete_directory(request, directory_id):
    """Delete an empty logical directory."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    directory = _get_directory_or_error(directory_id)
    if directory is None:
        return _json_error('Directory not found.', 404)

    if not can_manage_directory(request.user, directory.parent_path, 'delete'):
        return _json_error('Permission denied.', 403)

    path = directory.path
    has_directories = DirectoryEntry.objects.filter(parent_path=path).exists()
    has_files = FileEntry.objects.filter(parent_path=path).exists()
    if has_directories or has_files:
        return _json_error('Directory must be empty before deletion.', 409)

    directory.delete()
    return JsonResponse(
        {
            'status': 'success',
            'message': 'Directory deleted.',
        }
    )


@transaction.atomic
def _rename_directory_tree(directory, old_path, new_path, name):
    directory.name = name
    directory.save(update_fields=['name', 'updated_at'])
    _replace_descendant_paths(old_path, new_path)


@transaction.atomic
def _move_directory_tree(directory, old_path, new_path, target_parent):
    directory.parent_path = target_parent
    directory.save(update_fields=['parent_path', 'updated_at'])
    _replace_descendant_paths(old_path, new_path)


def _replace_descendant_paths(old_path, new_path):
    descendant_directories = DirectoryEntry.objects.filter(parent_path__startswith=f'{old_path}/')
    descendant_files = FileEntry.objects.filter(parent_path__startswith=f'{old_path}/')
    direct_directories = DirectoryEntry.objects.filter(parent_path=old_path)
    direct_files = FileEntry.objects.filter(parent_path=old_path)

    for directory in list(direct_directories) + list(descendant_directories):
        suffix = directory.parent_path[len(old_path):].lstrip('/')
        directory.parent_path = f'{new_path}/{suffix}' if suffix else new_path
        directory.save(update_fields=['parent_path', 'updated_at'])

    for entry in list(direct_files) + list(descendant_files):
        suffix = entry.parent_path[len(old_path):].lstrip('/')
        entry.parent_path = f'{new_path}/{suffix}' if suffix else new_path
        entry.save(update_fields=['parent_path', 'updated_at'])
