from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('sign', '0002_default_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='PermissionNode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node', models.CharField(max_length=255, unique=True)),
                ('label', models.CharField(max_length=100)),
                ('category', models.CharField(max_length=60)),
                ('description', models.TextField(blank=True)),
                ('is_dangerous', models.BooleanField(default=False)),
                ('is_system_locked', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['category', 'node'],
            },
        ),
        migrations.CreateModel(
            name='UserPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node', models.CharField(max_length=255)),
                ('value', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='direct_permissions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['node'],
            },
        ),
        migrations.AddConstraint(
            model_name='userpermission',
            constraint=models.UniqueConstraint(fields=('user', 'node'), name='sign_user_permission_unique_node'),
        ),
    ]
