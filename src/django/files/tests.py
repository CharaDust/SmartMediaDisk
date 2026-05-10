import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import DirectoryEntry, FileEntry, FileObject
from .storage_service import create_file_entry


class FilesApiTests(TestCase):
    def setUp(self):
        self.storage_dir = tempfile.TemporaryDirectory()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(
            SMARTMEDIADISK_STORAGE_PATH=self.storage_dir.name,
            SMARTMEDIADISK_UPLOAD_TEMP_PATH=self.temp_dir.name,
        )
        self.settings_override.enable()

        User = get_user_model()
        self.user = User.objects.create_user(username='root', password='123456')
        self.client.force_login(self.user)

    def tearDown(self):
        self.settings_override.disable()
        self.storage_dir.cleanup()
        self.temp_dir.cleanup()

    def test_upload_deduplicates_same_content(self):
        first = SimpleUploadedFile('first.txt', b'same-content', content_type='text/plain')
        second = SimpleUploadedFile('second.txt', b'same-content', content_type='text/plain')

        first_response = self.client.post('/api/files/upload/', {'path': '/', 'file': first})
        second_response = self.client.post('/api/files/upload/', {'path': '/', 'file': second})

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 201)
        self.assertEqual(FileObject.objects.count(), 1)
        self.assertEqual(FileEntry.objects.count(), 2)
        self.assertEqual(FileObject.objects.get().ref_count, 2)

    def test_delete_collects_physical_file_after_last_reference(self):
        first = SimpleUploadedFile('first.txt', b'same-content', content_type='text/plain')
        second = SimpleUploadedFile('second.txt', b'same-content', content_type='text/plain')
        self.client.post('/api/files/upload/', {'path': '/', 'file': first})
        self.client.post('/api/files/upload/', {'path': '/', 'file': second})

        first_entry = FileEntry.objects.get(name='first.txt')
        second_entry = FileEntry.objects.get(name='second.txt')

        first_delete = self.client.delete(f'/api/files/{first_entry.id}/')
        self.assertEqual(first_delete.status_code, 200)
        self.assertEqual(FileObject.objects.get().ref_count, 1)

        second_delete = self.client.delete(f'/api/files/{second_entry.id}/')
        self.assertEqual(second_delete.status_code, 200)
        self.assertEqual(FileObject.objects.count(), 0)

    def test_directory_rename_updates_descendant_paths(self):
        create_response = self.client.post(
            '/api/files/directories/',
            data=json.dumps({'parent_path': '/', 'name': 'docs'}),
            content_type='application/json',
        )
        self.assertEqual(create_response.status_code, 201)
        directory = DirectoryEntry.objects.get(name='docs')

        upload = SimpleUploadedFile('note.txt', b'hello', content_type='text/plain')
        upload_response = self.client.post('/api/files/upload/', {'path': '/docs', 'file': upload})
        self.assertEqual(upload_response.status_code, 201)

        rename_response = self.client.post(
            f'/api/files/directories/{directory.id}/rename/',
            data=json.dumps({'name': 'archive'}),
            content_type='application/json',
        )
        self.assertEqual(rename_response.status_code, 200)
        self.assertEqual(FileEntry.objects.get(name='note.txt').parent_path, 'archive')

    def test_root_lists_files_uploaded_by_other_users_in_shared_directory(self):
        User = get_user_model()
        other_user = User.objects.create_user(username='user', password='123456')
        upload = SimpleUploadedFile('shared.txt', b'visible-to-root', content_type='text/plain')
        create_file_entry(other_user, upload, '/')

        response = self.client.get('/api/files/?path=/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['files'][0]['name'], 'shared.txt')
        self.assertEqual(payload['data']['files'][0]['owner']['username'], 'user')
