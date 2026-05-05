from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_or_update_default_user(apps, schema_editor):
    user_model_label = settings.AUTH_USER_MODEL
    app_label, model_name = user_model_label.split('.')
    User = apps.get_model(app_label, model_name)

    user, created = User.objects.get_or_create(
        username='user',
        defaults={
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
        },
    )

    if not created:
        user.is_staff = False
        user.is_superuser = False
        user.is_active = True

    user.password = make_password('123456')
    user.save()


class Migration(migrations.Migration):
    dependencies = [
        ('sign', '0001_default_root_user'),
    ]

    operations = [
        migrations.RunPython(create_or_update_default_user, migrations.RunPython.noop),
    ]
