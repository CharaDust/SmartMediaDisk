import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import DirectoryEntry, FileEntry, FileObject
from .storage_service import create_file_entry


class FilesApiTests(TestCase):
    def setUp(self):
        self.storage_dir = tempfile.TemporaryDirectory()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.preview_cache_dir = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(
            SMARTMEDIADISK_STORAGE_PATH=self.storage_dir.name,
            SMARTMEDIADISK_UPLOAD_TEMP_PATH=self.temp_dir.name,
            SMARTMEDIADISK_PREVIEW_CACHE_PATH=self.preview_cache_dir.name,
        )
        self.settings_override.enable()

        User = get_user_model()
        self.user = User.objects.create_user(username='root', password='123456')
        self.client.force_login(self.user)

    def tearDown(self):
        self.settings_override.disable()
        self.storage_dir.cleanup()
        self.temp_dir.cleanup()
        self.preview_cache_dir.cleanup()

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

    def test_preview_text_file_returns_content(self):
        upload = SimpleUploadedFile('note.txt', '你好，预览'.encode('utf-8'), content_type='text/plain')
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='note.txt')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'text')
        self.assertEqual(payload['data']['preview']['content'], '你好，预览')
        self.assertFalse(payload['data']['preview']['truncated'])

    def test_preview_comma_csv_file_returns_rows(self):
        upload = SimpleUploadedFile(
            'ImaCommaTable.csv',
            b'name,lang\nPomni,en_us\nDoll,ru_ru\nXue,lzh\n',
            content_type='text/csv',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='ImaCommaTable.csv')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'csv')
        self.assertEqual(payload['data']['preview']['delimiter'], ',')
        self.assertEqual(
            payload['data']['preview']['rows'],
            [
                ['name', 'lang'],
                ['Pomni', 'en_us'],
                ['Doll', 'ru_ru'],
                ['Xue', 'lzh'],
            ],
        )

    def test_preview_tab_csv_file_returns_rows(self):
        upload = SimpleUploadedFile(
            'ImaTabTable.csv',
            b'name\tlang\nJax\ten_us\nfebilly\tlol_us\n',
            content_type='text/csv',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='ImaTabTable.csv')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'csv')
        self.assertEqual(payload['data']['preview']['delimiter'], '\t')
        self.assertEqual(
            payload['data']['preview']['rows'],
            [
                ['name', 'lang'],
                ['Jax', 'en_us'],
                ['febilly', 'lol_us'],
            ],
        )

    def test_preview_png_file_returns_inline_content_url(self):
        png_content = b'\x89PNG\r\n\x1a\npreview-image'
        upload = SimpleUploadedFile('picture.png', png_content, content_type='image/png')
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='picture.png')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'image')
        self.assertEqual(payload['data']['preview']['content_url'], f'/api/files/{entry.id}/preview/content/')

        content_response = self.client.get(payload['data']['preview']['content_url'])
        self.assertEqual(content_response.status_code, 200)
        self.assertEqual(content_response['Content-Type'], 'image/png')
        self.assertEqual(b''.join(content_response.streaming_content), png_content)

    def test_preview_mp3_file_returns_inline_content_url(self):
        mp3_content = b'ID3\x04\x00\x00\x00\x00\x00\x00preview-audio'
        upload = SimpleUploadedFile('song.mp3', mp3_content, content_type='audio/mpeg')
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='song.mp3')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'audio')
        self.assertEqual(payload['data']['preview']['content_url'], f'/api/files/{entry.id}/preview/content/')

        content_response = self.client.get(payload['data']['preview']['content_url'])
        self.assertEqual(content_response.status_code, 200)
        self.assertEqual(content_response['Content-Type'], 'audio/mpeg')
        self.assertEqual(b''.join(content_response.streaming_content), mp3_content)

    def test_preview_pdf_file_returns_inline_content_url(self):
        pdf_content = b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'
        upload = SimpleUploadedFile('MyPost.pdf', pdf_content, content_type='application/pdf')
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='MyPost.pdf')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'pdf')
        self.assertEqual(payload['data']['preview']['content_url'], f'/api/files/{entry.id}/preview/content/')

        content_response = self.client.get(payload['data']['preview']['content_url'])
        self.assertEqual(content_response.status_code, 200)
        self.assertEqual(content_response['Content-Type'], 'application/pdf')
        self.assertEqual(b''.join(content_response.streaming_content), pdf_content)

    def test_preview_docx_file_returns_converted_pdf_content_url(self):
        office_content = b'fake-docx-content'
        pdf_content = b'%PDF-1.4\nconverted\n%%EOF'
        upload = SimpleUploadedFile(
            'PressTest.docx',
            office_content,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='PressTest.docx')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'pdf')
        self.assertTrue(payload['data']['preview']['converted'])
        self.assertEqual(payload['data']['preview']['content_url'], f'/api/files/{entry.id}/preview/content/')

        with patch('files.views._convert_office_to_pdf') as convert:
            converted_path = Path(self.preview_cache_dir.name) / 'converted.pdf'
            converted_path.write_bytes(pdf_content)
            convert.return_value = converted_path
            content_response = self.client.get(payload['data']['preview']['content_url'])

        self.assertEqual(content_response.status_code, 200)
        self.assertEqual(content_response['Content-Type'], 'application/pdf')
        self.assertEqual(b''.join(content_response.streaming_content), pdf_content)

    def test_preview_xlsx_file_returns_converted_pdf_content_url(self):
        upload = SimpleUploadedFile(
            'Spreader.xlsx',
            b'fake-xlsx-content',
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='Spreader.xlsx')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'pdf')
        self.assertTrue(payload['data']['preview']['converted'])

    def test_preview_pptx_file_returns_converted_pdf_content_url(self):
        upload = SimpleUploadedFile(
            'Slides.pptx',
            b'fake-pptx-content',
            content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='Slides.pptx')

        response = self.client.get(f'/api/files/{entry.id}/preview/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['preview']['type'], 'pdf')
        self.assertTrue(payload['data']['preview']['converted'])

    def test_preview_rejects_unsupported_file_type(self):
        upload = SimpleUploadedFile(
            'archive.zip',
            b'not-real-zip',
            content_type='application/zip',
        )
        self.client.post('/api/files/upload/', {'path': '/', 'file': upload})
        entry = FileEntry.objects.get(name='archive.zip')

        response = self.client.get(f'/api/files/{entry.id}/preview/')

        self.assertEqual(response.status_code, 415)
