from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_or_update_root_user(apps, schema_editor):
    user_model_label = settings.AUTH_USER_MODEL
    app_label, model_name = user_model_label.split('.')
    User = apps.get_model(app_label, model_name)

    user, created = User.objects.get_or_create(
        username='root',
        defaults={
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        },
    )

    if not created:
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True

    user.password = make_password('123456')
    user.save()


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(create_or_update_root_user, migrations.RunPython.noop),
    ]
