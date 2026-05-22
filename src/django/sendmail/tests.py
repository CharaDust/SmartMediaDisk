import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from files.models import FileEntry, FileObject
from files.storage_service import create_file_entry
from sign.models import UserPermission

from .models import MailAttachment, MailMessage


class SendmailApiTests(TestCase):
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
        self.sender = User.objects.create_user(username='root', password='123456')
        self.recipient = User.objects.create_user(username='alice', password='123456')

    def tearDown(self):
        self.settings_override.disable()
        self.storage_dir.cleanup()
        self.temp_dir.cleanup()
        self.preview_cache_dir.cleanup()

    def test_send_mail_with_attachment_to_local_user(self):
        self.client.force_login(self.sender)
        entry = create_file_entry(
            self.sender,
            SimpleUploadedFile('report.txt', b'hello-mail', content_type='text/plain'),
            '/',
        )

        response = self.client.post(
            '/api/sendmail/send/',
            data=json.dumps(
                {
                    'to': 'alice@local',
                    'subject': '内部分享',
                    'body': '请查收',
                    'attachment_ids': [entry.id],
                }
            ),
            content_type='application/json',
        )
        payload = response.json()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(payload['data']['message']['attachments'][0]['name'], 'report.txt')
        self.assertEqual(MailMessage.objects.count(), 1)
        self.assertEqual(MailAttachment.objects.count(), 1)
        self.assertEqual(FileObject.objects.get().ref_count, 2)

    def test_recipient_saves_attachment_as_own_file(self):
        self.client.force_login(self.sender)
        entry = create_file_entry(
            self.sender,
            SimpleUploadedFile('shared.txt', b'copy-me', content_type='text/plain'),
            '/',
        )
        self.client.post(
            '/api/sendmail/send/',
            data=json.dumps(
                {
                    'to': 'alice@local',
                    'subject': '保存附件',
                    'attachment_ids': [entry.id],
                }
            ),
            content_type='application/json',
        )
        attachment = MailAttachment.objects.get()
        UserPermission.objects.create(user=self.recipient, node='files.upload.own', value=True)

        self.client.force_login(self.recipient)
        response = self.client.post(
            f'/api/sendmail/attachments/{attachment.id}/save/',
            data=json.dumps({'path': '/', 'name': 'saved.txt'}),
            content_type='application/json',
        )
        payload = response.json()

        self.assertEqual(response.status_code, 201)
        saved_entry = FileEntry.objects.get(name='saved.txt')
        self.assertEqual(saved_entry.owner, self.recipient)
        self.assertEqual(saved_entry.file_object, entry.file_object)
        self.assertEqual(payload['data']['file']['owner']['username'], 'alice')
        self.assertEqual(FileObject.objects.get().ref_count, 3)

    def test_inbox_marks_message_as_read(self):
        self.client.force_login(self.sender)
        self.client.post(
            '/api/sendmail/send/',
            data=json.dumps({'to': 'alice@local', 'subject': '未读'}),
            content_type='application/json',
        )
        message = MailMessage.objects.get()

        self.client.force_login(self.recipient)
        inbox_response = self.client.get('/api/sendmail/inbox/')
        self.assertFalse(inbox_response.json()['data']['messages'][0]['is_read'])

        detail_response = self.client.get(f'/api/sendmail/messages/{message.id}/')
        inbox_response = self.client.get('/api/sendmail/inbox/')

        self.assertEqual(detail_response.status_code, 200)
        self.assertTrue(inbox_response.json()['data']['messages'][0]['is_read'])
