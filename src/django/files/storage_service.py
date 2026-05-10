import hashlib
import mimetypes
import os
import uuid
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import Max

from .models import FileEntry, FileObject
from .path_utils import normalize_name, normalize_path


def get_storage_root():
    """Return the root directory for physical file storage."""
    root = Path(settings.SMARTMEDIADISK_STORAGE_PATH)
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_upload_temp_root():
    """Return the root directory for temporary upload chunks."""
    root = Path(settings.SMARTMEDIADISK_UPLOAD_TEMP_PATH)
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_physical_path(file_object):
    """Resolve a file object's physical path."""
    return get_storage_root() / file_object.storage_path


def guess_mime_type(filename):
    """Guess MIME type from a file name."""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'


def write_upload_to_temp(uploaded_file):
    """Write an uploaded file to temp storage while calculating SHA256."""
    temp_root = get_upload_temp_root()
    temp_path = temp_root / f'{uuid.uuid4().hex}.upload'
    digest = hashlib.sha256()
    size = 0

    with temp_path.open('wb') as target:
        for chunk in uploaded_file.chunks():
            digest.update(chunk)
            size += len(chunk)
            target.write(chunk)

    return {
        'path': temp_path,
        'sha256': digest.hexdigest(),
        'size': size,
    }


def build_storage_relative_path(sha256):
    """Build a stable storage path for a SHA256 value."""
    return Path(sha256[:2]) / sha256


@transaction.atomic
def create_file_entry(owner, uploaded_file, parent_path):
    """Create a logical file entry and deduplicate the physical content."""
    parent_path = normalize_path(parent_path)
    name = normalize_name(uploaded_file.name, 'File name')
    mime_type = getattr(uploaded_file, 'content_type', '') or guess_mime_type(name)

    if FileEntry.objects.filter(parent_path=parent_path, name=name).exists():
        raise ValueError('A file with this name already exists in the target directory.')

    upload_info = write_upload_to_temp(uploaded_file)
    sha256 = upload_info['sha256']
    size = upload_info['size']
    temp_path = upload_info['path']
    storage_relative = build_storage_relative_path(sha256)
    storage_path = get_storage_root() / storage_relative

    try:
        file_object, created = FileObject.objects.select_for_update().get_or_create(
            sha256=sha256,
            defaults={
                'size': size,
                'mime_type': mime_type,
                'storage_path': storage_relative.as_posix(),
                'ref_count': 0,
            },
        )

        if created:
            storage_path.parent.mkdir(parents=True, exist_ok=True)
            os.replace(temp_path, storage_path)
        else:
            temp_path.unlink(missing_ok=True)

        max_serial = FileEntry.objects.filter(file_object=file_object).aggregate(Max('serial'))['serial__max'] or 0
        file_object.ref_count += 1
        if not file_object.mime_type and mime_type:
            file_object.mime_type = mime_type
        file_object.save(update_fields=['ref_count', 'mime_type', 'updated_at'])

        entry = FileEntry.objects.create(
            owner=owner,
            file_object=file_object,
            parent_path=parent_path,
            name=name,
            original_name=name,
            serial=max_serial + 1,
            size=size,
            mime_type=mime_type,
        )
    except Exception:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        raise

    return entry


@transaction.atomic
def delete_file_entry(entry):
    """Delete a logical file entry and collect unreferenced physical content."""
    file_object = FileObject.objects.select_for_update().get(pk=entry.file_object_id)
    entry.delete()
    file_object.ref_count = max(file_object.ref_count - 1, 0)

    if file_object.ref_count > 0 or file_object.entries.exists():
        file_object.save(update_fields=['ref_count', 'updated_at'])
        return False

    physical_path = get_physical_path(file_object)
    file_object.delete()
    physical_path.unlink(missing_ok=True)
    return True
