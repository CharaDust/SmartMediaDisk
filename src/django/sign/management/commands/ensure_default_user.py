import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Ensure the default local development accounts exist.'

    def handle(self, *args, **options):
        user_model = get_user_model()
        accounts = [
            {
                'username': os.environ.get('SMARTMEDIADISK_ROOT_USERNAME', 'root'),
                'password': os.environ.get('SMARTMEDIADISK_ROOT_PASSWORD', '123456'),
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': os.environ.get('SMARTMEDIADISK_USER_USERNAME', 'user'),
                'password': os.environ.get('SMARTMEDIADISK_USER_PASSWORD', '123456'),
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        for account in accounts:
            username = account['username']
            password = account['password']
            user, created = user_model.objects.get_or_create(
                username=username,
                defaults={
                    'is_staff': account['is_staff'],
                    'is_superuser': account['is_superuser'],
                    'is_active': True,
                },
            )

            if not created:
                user.is_staff = account['is_staff']
                user.is_superuser = account['is_superuser']
                user.is_active = True

            user.set_password(password)
            user.save()

            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{action} default account: {username}'))
