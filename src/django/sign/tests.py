import json

from django.contrib.auth import get_user_model
from django.test import TestCase


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
