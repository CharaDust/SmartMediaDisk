from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FileObject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sha256', models.CharField(max_length=64, unique=True)),
                ('size', models.BigIntegerField()),
                ('mime_type', models.CharField(blank=True, max_length=255)),
                ('storage_path', models.CharField(max_length=1024)),
                ('ref_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['sha256'],
            },
        ),
        migrations.CreateModel(
            name='DirectoryEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('parent_path', models.CharField(blank=True, default='', max_length=1024)),
                ('name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'created_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='created_directories',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['parent_path', 'name'],
            },
        ),
        migrations.CreateModel(
            name='FileEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('parent_path', models.CharField(blank=True, default='', max_length=1024)),
                ('name', models.CharField(max_length=255)),
                ('serial', models.PositiveIntegerField(default=1)),
                ('original_name', models.CharField(max_length=255)),
                ('size', models.BigIntegerField()),
                ('mime_type', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'file_object',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='entries',
                        to='files.fileobject',
                    ),
                ),
                (
                    'owner',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='file_entries',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['parent_path', 'name'],
            },
        ),
        migrations.AddIndex(
            model_name='directoryentry',
            index=models.Index(fields=['parent_path'], name='files_direc_parent__c7e434_idx'),
        ),
        migrations.AddIndex(
            model_name='fileentry',
            index=models.Index(fields=['owner', 'parent_path'], name='files_filee_owner_i_89e24b_idx'),
        ),
        migrations.AddIndex(
            model_name='fileentry',
            index=models.Index(fields=['name'], name='files_filee_name_b9b0d9_idx'),
        ),
        migrations.AddIndex(
            model_name='fileentry',
            index=models.Index(fields=['created_at'], name='files_filee_created_febc67_idx'),
        ),
        migrations.AddConstraint(
            model_name='directoryentry',
            constraint=models.UniqueConstraint(
                fields=('parent_path', 'name'),
                name='files_directory_unique_parent_name',
            ),
        ),
        migrations.AddConstraint(
            model_name='fileentry',
            constraint=models.UniqueConstraint(
                fields=('parent_path', 'name'),
                name='files_entry_unique_parent_name',
            ),
        ),
        migrations.AddConstraint(
            model_name='fileentry',
            constraint=models.UniqueConstraint(
                fields=('file_object', 'serial'),
                name='files_entry_unique_object_serial',
            ),
        ),
    ]
