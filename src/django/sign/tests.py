import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import SiteSetting, UserPermission, UserStorageQuota


class SignApiTests(TestCase):
    def setUp(self):
        self.user, _ = get_user_model().objects.get_or_create(
            username='root',
        )
        self.user.set_password('123456')
        self.user.save()

    def test_sign_in_requires_post(self):
        response = self.client.get('/api/signin/')

        self.assertEqual(response.status_code, 405)

    def test_sign_in_rejects_empty_credentials(self):
        response = self.client.post(
            '/api/signin/',
            data=json.dumps({'username': '', 'password': ''}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)

    def test_sign_in_accepts_valid_credentials(self):
        response = self.client.post(
            '/api/signin/',
            data=json.dumps({'username': 'root', 'password': '123456', 'rememberMe': True}),
            content_type='application/json',
        )
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['user']['username'], 'root')

    def test_session_status_reports_authenticated_user(self):
        self.client.login(username='root', password='123456')

        response = self.client.get('/api/signin/session/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload['data']['authenticated'])
        self.assertEqual(payload['data']['user']['username'], 'root')

    def test_sign_out_clears_session(self):
        self.client.login(username='root', password='123456')

        response = self.client.post('/api/signin/logout/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse('_auth_user_id' in self.client.session)

    def test_root_has_locked_permission_editor_access(self):
        self.client.login(username='root', password='123456')

        response = self.client.get('/api/permissions/check/?node=permissions.table.edit')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload['data']['allowed'])

    def test_user_permissions_can_store_false_values(self):
        user_model = get_user_model()
        normal_user, _ = user_model.objects.get_or_create(username='user')
        normal_user.set_password('123456')
        normal_user.save()
        self.client.login(username='root', password='123456')

        response = self.client.put(
            f'/api/permissions/users/{normal_user.id}/',
            data=json.dumps(
                {
                    'permissions': [
                        {'node': 'files.*', 'value': True},
                        {'node': 'files.delete.own', 'value': False},
                    ]
                }
            ),
            content_type='application/json',
        )
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(payload['data']['direct_permissions']), 2)

        self.client.logout()
        self.client.login(username='user', password='123456')

        allowed_response = self.client.get('/api/permissions/check/?node=files.download.own')
        denied_response = self.client.get('/api/permissions/check/?node=files.delete.own')

        self.assertTrue(allowed_response.json()['data']['allowed'])
        self.assertFalse(denied_response.json()['data']['allowed'])

    def test_account_detail_reports_self_update_permissions(self):
        UserPermission.objects.create(user=self.user, node='account.username.update', value=True)
        UserStorageQuota.objects.create(user=self.user, quota_bytes=1024)
        self.client.login(username='root', password='123456')

        response = self.client.get('/api/account/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(payload['data']['account']['permissions']['can_update_username'])
        self.assertTrue(payload['data']['account']['permissions']['can_update_password'])
        self.assertTrue(payload['data']['account']['permissions']['can_update_navbar_title'])
        self.assertEqual(payload['data']['account']['settings']['navbar_title'], 'Media Cube')
        self.assertEqual(payload['data']['account']['storage']['quota_bytes'], 1024)
        self.assertEqual(payload['data']['account']['storage']['used_bytes'], 0)

    def test_navbar_title_defaults_to_media_cube(self):
        response = self.client.get('/api/account/navbar-title/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['data']['navbar_title'], 'Media Cube')

    def test_update_navbar_title_requires_permission(self):
        user_model = get_user_model()
        normal_user, _ = user_model.objects.get_or_create(username='user')
        normal_user.set_password('123456')
        normal_user.save()
        self.client.login(username='user', password='123456')

        denied_response = self.client.post(
            '/api/account/navbar-title/update/',
            data=json.dumps({'navbarTitle': 'Denied Cube'}),
            content_type='application/json',
        )
        self.assertEqual(denied_response.status_code, 403)

        UserPermission.objects.create(user=normal_user, node='account.navbar_title.update', value=True)
        allowed_response = self.client.post(
            '/api/account/navbar-title/update/',
            data=json.dumps({'navbarTitle': 'Family Media'}),
            content_type='application/json',
        )
        payload = allowed_response.json()

        self.assertEqual(allowed_response.status_code, 200)
        self.assertEqual(payload['data']['navbar_title'], 'Family Media')
        self.assertEqual(SiteSetting.objects.get(key='navbar_title').value, 'Family Media')

    def test_root_username_is_locked(self):
        self.client.login(username='root', password='123456')

        response = self.client.post(
            '/api/account/username/',
            data=json.dumps({'username': 'admin-root'}),
            content_type='application/json',
        )
        self.user.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.user.username, 'root')

    def test_update_username_requires_permission_and_logs_out(self):
        user_model = get_user_model()
        normal_user, _ = user_model.objects.get_or_create(username='user')
        normal_user.set_password('123456')
        normal_user.save()
        UserPermission.objects.create(user=normal_user, node='account.username.update', value=True)
        self.client.login(username='user', password='123456')

        response = self.client.post(
            '/api/account/username/',
            data=json.dumps({'username': 'renamed'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse('_auth_user_id' in self.client.session)
        self.assertTrue(self.client.login(username='renamed', password='123456'))

    def test_update_password_requires_old_password_and_logs_out(self):
        user_model = get_user_model()
        normal_user, _ = user_model.objects.get_or_create(username='user')
        normal_user.set_password('123456')
        normal_user.save()
        UserPermission.objects.create(user=normal_user, node='account.password.update', value=True)
        self.client.login(username='user', password='123456')

        bad_response = self.client.post(
            '/api/account/password/',
            data=json.dumps({'oldPassword': 'wrong', 'newPassword': 'abcdef'}),
            content_type='application/json',
        )
        self.assertEqual(bad_response.status_code, 400)

        response = self.client.post(
            '/api/account/password/',
            data=json.dumps({'oldPassword': '123456', 'newPassword': 'abcdef'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse('_auth_user_id' in self.client.session)
        self.assertTrue(self.client.login(username='user', password='abcdef'))

    def test_user_list_requires_permission(self):
        user_model = get_user_model()
        normal_user, _ = user_model.objects.get_or_create(username='user')
        normal_user.set_password('123456')
        normal_user.save()
        self.client.login(username='user', password='123456')

        denied_response = self.client.get('/api/users/')
        self.assertEqual(denied_response.status_code, 403)

        UserPermission.objects.create(user=normal_user, node='users.read', value=True)
        allowed_response = self.client.get('/api/users/')
        payload = allowed_response.json()

        self.assertEqual(allowed_response.status_code, 200)
        self.assertTrue(any(user['username'] == 'root' for user in payload['data']['users']))

    def test_create_update_delete_user_management_flow(self):
        self.client.login(username='root', password='123456')

        create_response = self.client.post(
            '/api/users/create/',
            data=json.dumps(
                {
                    'username': 'managed',
                    'email': 'managed@example.com',
                    'password': 'abcdef',
                    'quotaBytes': 1048576,
                    'isActive': True,
                }
            ),
            content_type='application/json',
        )
        created_payload = create_response.json()
        created_id = created_payload['data']['user']['id']

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(created_payload['data']['user']['storage']['quota_bytes'], 1048576)
        self.assertTrue(self.client.login(username='managed', password='abcdef'))

        self.client.login(username='root', password='123456')
        update_response = self.client.put(
            f'/api/users/{created_id}/',
            data=json.dumps(
                {
                    'username': 'managed-renamed',
                    'email': 'renamed@example.com',
                    'quotaBytes': None,
                    'isActive': False,
                }
            ),
            content_type='application/json',
        )
        updated_payload = update_response.json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(updated_payload['data']['user']['username'], 'managed-renamed')
        self.assertTrue(updated_payload['data']['user']['storage']['is_unlimited'])
        self.assertFalse(updated_payload['data']['user']['is_active'])

        delete_response = self.client.delete(f'/api/users/{created_id}/')

        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(get_user_model().objects.filter(username='managed-renamed').exists())

    def test_root_user_cannot_be_renamed_or_deleted_by_user_management(self):
        self.client.login(username='root', password='123456')

        rename_response = self.client.put(
            f'/api/users/{self.user.id}/',
            data=json.dumps(
                {
                    'username': 'admin-root',
                    'email': '',
                    'isActive': True,
                }
            ),
            content_type='application/json',
        )
        delete_response = self.client.delete(f'/api/users/{self.user.id}/')
        self.user.refresh_from_db()

        self.assertEqual(rename_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        self.assertEqual(self.user.username, 'root')

    def test_reset_user_password_requires_permission(self):
        user_model = get_user_model()
        manager, _ = user_model.objects.get_or_create(username='manager')
        manager.set_password('123456')
        manager.save()
        target, _ = user_model.objects.get_or_create(username='target')
        target.set_password('123456')
        target.save()
        self.client.login(username='manager', password='123456')

        denied_response = self.client.post(
            f'/api/users/{target.id}/password/',
            data=json.dumps({'newPassword': 'abcdef'}),
            content_type='application/json',
        )
        self.assertEqual(denied_response.status_code, 403)

        UserPermission.objects.create(user=manager, node='users.password.reset', value=True)
        allowed_response = self.client.post(
            f'/api/users/{target.id}/password/',
            data=json.dumps({'newPassword': 'abcdef'}),
            content_type='application/json',
        )

        self.assertEqual(allowed_response.status_code, 200)
        self.assertTrue(self.client.login(username='target', password='abcdef'))
