import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import SiteSetting, UserPermission


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

        allowed_response = self.client.get('/api/permissions/check/?node=files.read.own')
        denied_response = self.client.get('/api/permissions/check/?node=files.delete.own')

        self.assertTrue(allowed_response.json()['data']['allowed'])
        self.assertFalse(denied_response.json()['data']['allowed'])

    def test_account_detail_reports_self_update_permissions(self):
        UserPermission.objects.create(user=self.user, node='account.username.update', value=True)
        self.client.login(username='root', password='123456')

        response = self.client.get('/api/account/')
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(payload['data']['account']['permissions']['can_update_username'])
        self.assertTrue(payload['data']['account']['permissions']['can_update_password'])
        self.assertTrue(payload['data']['account']['permissions']['can_update_navbar_title'])
        self.assertEqual(payload['data']['account']['settings']['navbar_title'], 'Media Cube')

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
