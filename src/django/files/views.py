import csv
import json
import shutil
import subprocess
import tempfile
from io import StringIO
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from sign.permission_service import is_root_user
from sign.quota_service import ensure_upload_fits_quota, get_global_storage_summary, get_user_storage_summary

from .models import DirectoryEntry, FileEntry
from .path_utils import display_path, join_path, normalize_name, normalize_path, split_path
from .permissions import (
    can_delete_file,
    can_download_file,
    can_list_directory,
    can_preview_file,
    can_see_file_in_list,
    can_manage_directory,
    can_move_file,
    can_rename_file,
    can_upload_file,
)
from .storage_service import create_file_entry, delete_file_entry, get_physical_path

TEXT_PREVIEW_MAX_BYTES = 512 * 1024
CSV_PREVIEW_MAX_ROWS = 200
TEXT_PREVIEW_EXTENSIONS = {
    '.css',
    '.csv',
    '.html',
    '.js',
    '.json',
    '.log',
    '.md',
    '.py',
    '.txt',
    '.xml',
    '.yaml',
    '.yml',
}
IMAGE_PREVIEW_MIME_TYPES = {'image/png'}
IMAGE_PREVIEW_EXTENSIONS = {'.png'}
CSV_PREVIEW_MIME_TYPES = {'text/csv', 'application/csv', 'application/vnd.ms-excel'}
CSV_PREVIEW_EXTENSIONS = {'.csv'}
AUDIO_PREVIEW_MIME_TYPES = {'audio/mpeg', 'audio/mp3'}
AUDIO_PREVIEW_EXTENSIONS = {'.mp3'}
PDF_PREVIEW_MIME_TYPES = {'application/pdf'}
PDF_PREVIEW_EXTENSIONS = {'.pdf'}
OFFICE_PREVIEW_MIME_TYPES = {
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
OFFICE_PREVIEW_EXTENSIONS = {'.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}


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


def _is_text_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type.startswith('text/')
        or mime_type in {'application/json', 'application/xml', 'application/javascript'}
        or any(name.endswith(extension) for extension in TEXT_PREVIEW_EXTENSIONS)
    )


def _is_csv_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type in CSV_PREVIEW_MIME_TYPES
        or any(name.endswith(extension) for extension in CSV_PREVIEW_EXTENSIONS)
    )


def _is_image_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type in IMAGE_PREVIEW_MIME_TYPES
        or any(name.endswith(extension) for extension in IMAGE_PREVIEW_EXTENSIONS)
    )


def _is_audio_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type in AUDIO_PREVIEW_MIME_TYPES
        or any(name.endswith(extension) for extension in AUDIO_PREVIEW_EXTENSIONS)
    )


def _is_pdf_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type in PDF_PREVIEW_MIME_TYPES
        or any(name.endswith(extension) for extension in PDF_PREVIEW_EXTENSIONS)
    )


def _is_office_preview_supported(entry):
    mime_type = (entry.mime_type or entry.file_object.mime_type or '').lower()
    name = entry.name.lower()

    return (
        mime_type in OFFICE_PREVIEW_MIME_TYPES
        or any(name.endswith(extension) for extension in OFFICE_PREVIEW_EXTENSIONS)
    )


def _is_inline_preview_content_supported(entry):
    return (
        _is_image_preview_supported(entry)
        or _is_audio_preview_supported(entry)
        or _is_pdf_preview_supported(entry)
        or _is_office_preview_supported(entry)
    )


def _preview_content_type(entry):
    if _is_audio_preview_supported(entry):
        return entry.mime_type or entry.file_object.mime_type or 'audio/mpeg'

    if _is_pdf_preview_supported(entry):
        return entry.mime_type or entry.file_object.mime_type or 'application/pdf'

    if _is_office_preview_supported(entry):
        return 'application/pdf'

    return entry.mime_type or entry.file_object.mime_type or 'image/png'


def _get_preview_cache_root():
    root = Path(settings.SMARTMEDIADISK_PREVIEW_CACHE_PATH)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _find_libreoffice_command():
    configured = getattr(settings, 'SMARTMEDIADISK_LIBREOFFICE_PATH', '')
    if configured:
        return configured

    return shutil.which('soffice') or shutil.which('libreoffice')


def _converted_pdf_cache_path(entry):
    suffix = Path(entry.name).suffix.lower().lstrip('.') or 'office'
    return _get_preview_cache_root() / f'{entry.file_object.sha256}-{suffix}.pdf'


def _convert_office_to_pdf(entry):
    cache_path = _converted_pdf_cache_path(entry)
    if cache_path.exists():
        return cache_path

    command = _find_libreoffice_command()
    if not command:
        raise RuntimeError('LibreOffice executable was not found.')

    source_path = get_physical_path(entry.file_object)
    source_suffix = Path(entry.name).suffix or '.office'
    cache_root = _get_preview_cache_root()
    with tempfile.TemporaryDirectory(prefix='office-preview-', dir=cache_root) as work_dir_name:
        work_dir = Path(work_dir_name)
        profile_dir = work_dir / 'profile'
        profile_dir.mkdir(parents=True, exist_ok=True)
        temp_source = work_dir / f'source{source_suffix}'
        shutil.copy2(source_path, temp_source)

        result = subprocess.run(
            [
                command,
                '--headless',
                f'-env:UserInstallation={profile_dir.resolve().as_uri()}',
                '--convert-to',
                'pdf',
                '--outdir',
                str(work_dir),
                str(temp_source),
            ],
            capture_output=True,
            check=False,
            text=True,
            timeout=getattr(settings, 'SMARTMEDIADISK_PREVIEW_CONVERSION_TIMEOUT', 60),
        )
        converted_path = temp_source.with_suffix('.pdf')
        if not converted_path.exists():
            converted_files = list(work_dir.glob('*.pdf'))
            converted_path = converted_files[0] if converted_files else converted_path

        if result.returncode != 0 or not converted_path.exists():
            detail = (result.stderr or result.stdout or 'Unknown conversion error.').strip()
            raise RuntimeError(f'LibreOffice failed to convert the document: {detail}')

        shutil.move(str(converted_path), cache_path)

    return cache_path


def _preview_content_path(entry):
    if _is_office_preview_supported(entry):
        return _convert_office_to_pdf(entry)

    return get_physical_path(entry.file_object)


def _decode_text_preview(raw_content):
    for encoding in ('utf-8-sig', 'gb18030'):
        try:
            return raw_content.decode(encoding), encoding
        except UnicodeDecodeError:
            continue

    return raw_content.decode('utf-8', errors='replace'), 'utf-8'


def _detect_csv_dialect(text):
    sample = text[:4096]
    try:
        return csv.Sniffer().sniff(sample, delimiters=',\t;')
    except csv.Error:
        dialect = csv.excel_tab if '\t' in sample and ',' not in sample else csv.excel
        return dialect


def _build_csv_preview(text):
    dialect = _detect_csv_dialect(text)
    reader = csv.reader(StringIO(text), dialect)
    rows = []
    truncated_rows = False

    for row in reader:
        if len(rows) >= CSV_PREVIEW_MAX_ROWS:
            truncated_rows = True
            break

        rows.append(row)

    return {
        'type': 'csv',
        'rows': rows,
        'delimiter': dialect.delimiter,
        'truncated_rows': truncated_rows,
        'max_rows': CSV_PREVIEW_MAX_ROWS,
    }


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

    search = (request.GET.get('search') or '').strip()
    directories = DirectoryEntry.objects.filter(parent_path=path).select_related('created_by')
    file_queryset = FileEntry.objects.filter(parent_path=path).select_related('owner', 'file_object')
    if search:
        directories = directories.filter(name__icontains=search)
        file_queryset = file_queryset.filter(name__icontains=search)

    files = [entry for entry in file_queryset if can_see_file_in_list(request.user, entry)]

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'path': display_path(path),
                'search': search,
                'directories': [_serialize_directory(directory) for directory in directories],
                'files': [_serialize_file(entry) for entry in files],
            },
        }
    )


@require_GET
def storage_summary(request):
    """Return storage quota and usage details for the current user."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    data = {
        'storage': get_user_storage_summary(request.user),
    }
    if is_root_user(request.user):
        data['global_storage'] = get_global_storage_summary()

    return JsonResponse(
        {
            'status': 'success',
            'data': data,
        }
    )


@require_GET
def random_files(request):
    """Return random files the current user can preview."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    try:
        limit = int(request.GET.get('limit') or 8)
    except ValueError:
        limit = 8

    limit = max(1, min(limit, 24))
    queryset = FileEntry.objects.select_related('owner', 'file_object').order_by('?')[:limit * 4]
    files = [
        _serialize_file(entry)
        for entry in queryset
        if can_see_file_in_list(request.user, entry) and can_preview_file(request.user, entry)
    ][:limit]

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'files': files,
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
        ensure_upload_fits_quota(request.user, uploaded_file.size)
    except ValueError as error:
        return _json_error(str(error), 413)

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


@require_GET
def preview_file(request, entry_id):
    """Return preview metadata for a file when the user has permission."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    if not can_preview_file(request.user, entry):
        return _json_error('Permission denied.', 403)

    if _is_image_preview_supported(entry):
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'file': _serialize_file(entry),
                    'preview': {
                        'type': 'image',
                        'content_url': f'/api/files/{entry.id}/preview/content/',
                    },
                },
            }
        )

    if _is_audio_preview_supported(entry):
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'file': _serialize_file(entry),
                    'preview': {
                        'type': 'audio',
                        'content_url': f'/api/files/{entry.id}/preview/content/',
                    },
                },
            }
        )

    if _is_pdf_preview_supported(entry):
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'file': _serialize_file(entry),
                    'preview': {
                        'type': 'pdf',
                        'content_url': f'/api/files/{entry.id}/preview/content/',
                    },
                },
            }
        )

    if _is_office_preview_supported(entry):
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'file': _serialize_file(entry),
                    'preview': {
                        'type': 'pdf',
                        'content_url': f'/api/files/{entry.id}/preview/content/',
                        'converted': True,
                    },
                },
            }
        )

    physical_path = get_physical_path(entry.file_object)
    with physical_path.open('rb') as source:
        raw_content = source.read(TEXT_PREVIEW_MAX_BYTES + 1)

    is_truncated = len(raw_content) > TEXT_PREVIEW_MAX_BYTES
    if is_truncated:
        raw_content = raw_content[:TEXT_PREVIEW_MAX_BYTES]

    text, encoding = _decode_text_preview(raw_content)
    if _is_csv_preview_supported(entry):
        preview = _build_csv_preview(text)
        preview['encoding'] = encoding
        preview['truncated'] = is_truncated
        preview['max_bytes'] = TEXT_PREVIEW_MAX_BYTES
        return JsonResponse(
            {
                'status': 'success',
                'data': {
                    'file': _serialize_file(entry),
                    'preview': preview,
                },
            }
        )

    if not _is_text_preview_supported(entry):
        return _json_error('This file type is not supported for preview yet.', 415)

    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'file': _serialize_file(entry),
                'preview': {
                    'type': 'text',
                    'content': text,
                    'encoding': encoding,
                    'truncated': is_truncated,
                    'max_bytes': TEXT_PREVIEW_MAX_BYTES,
                },
            },
        }
    )


@require_GET
def preview_file_content(request, entry_id):
    """Stream inline preview content when the user has permission."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    entry = _get_file_or_error(entry_id)
    if entry is None:
        return _json_error('File not found.', 404)

    if not can_preview_file(request.user, entry):
        return _json_error('Permission denied.', 403)

    if not _is_inline_preview_content_supported(entry):
        return _json_error('This file type is not supported for inline preview content.', 415)

    try:
        content_path = _preview_content_path(entry)
    except subprocess.TimeoutExpired:
        return _json_error('Document preview conversion timed out.', 504)
    except RuntimeError as error:
        return _json_error(str(error), 500)

    response_filename = f'{Path(entry.name).stem}.pdf' if _is_office_preview_supported(entry) else entry.name
    return FileResponse(
        content_path.open('rb'),
        as_attachment=False,
        filename=response_filename,
        content_type=_preview_content_type(entry),
    )


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
