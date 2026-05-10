from django.contrib import admin

from .models import DirectoryEntry, FileEntry, FileObject


@admin.register(FileObject)
class FileObjectAdmin(admin.ModelAdmin):
    list_display = ('sha256', 'size', 'mime_type', 'ref_count', 'created_at')
    search_fields = ('sha256', 'mime_type')


@admin.register(FileEntry)
class FileEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'parent_path', 'size', 'mime_type', 'created_at')
    search_fields = ('name', 'owner__username', 'file_object__sha256')
    list_filter = ('mime_type',)


@admin.register(DirectoryEntry)
class DirectoryEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'parent_path', 'created_at')
    search_fields = ('name', 'created_by__username', 'parent_path')
