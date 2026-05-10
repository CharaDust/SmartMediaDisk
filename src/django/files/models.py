from django.conf import settings
from django.db import models


class FileObject(models.Model):
    """Physical deduplicated file stored by SHA256."""
    sha256 = models.CharField(max_length=64, unique=True)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=255, blank=True)
    storage_path = models.CharField(max_length=1024)
    ref_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sha256']

    def __str__(self):
        return self.sha256


class DirectoryEntry(models.Model):
    """Shared logical directory in the global file tree."""
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_directories',
    )
    parent_path = models.CharField(max_length=1024, blank=True, default='')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['parent_path', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['parent_path', 'name'],
                name='files_directory_unique_parent_name',
            ),
        ]
        indexes = [
            models.Index(fields=['parent_path']),
        ]

    @property
    def path(self):
        """Return the normalized logical path for this directory."""
        if not self.parent_path:
            return self.name

        return f'{self.parent_path}/{self.name}'

    def __str__(self):
        return self.path


class FileEntry(models.Model):
    """Logical file entry pointing to a physical file object."""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='file_entries')
    file_object = models.ForeignKey(FileObject, on_delete=models.PROTECT, related_name='entries')
    parent_path = models.CharField(max_length=1024, blank=True, default='')
    name = models.CharField(max_length=255)
    serial = models.PositiveIntegerField(default=1)
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['parent_path', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['parent_path', 'name'],
                name='files_entry_unique_parent_name',
            ),
            models.UniqueConstraint(
                fields=['file_object', 'serial'],
                name='files_entry_unique_object_serial',
            ),
        ]
        indexes = [
            models.Index(fields=['owner', 'parent_path']),
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]

    @property
    def logical_id(self):
        """Return the document logical identifier, sha256 + serial."""
        return f'{self.file_object.sha256}-{self.serial}'

    @property
    def path(self):
        """Return the normalized logical path for this file."""
        if not self.parent_path:
            return self.name

        return f'{self.parent_path}/{self.name}'

    def __str__(self):
        return f'{self.owner}:{self.path}'
