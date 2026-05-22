from django.db import migrations


DEPRECATED_PERMISSION_NODES = [
    'files.read.own',
    'files.read.all',
    'files.read.path.?',
]


def remove_files_read_permissions(apps, schema_editor):
    PermissionNode = apps.get_model('sign', 'PermissionNode')
    UserPermission = apps.get_model('sign', 'UserPermission')

    PermissionNode.objects.filter(node__in=DEPRECATED_PERMISSION_NODES).delete()
    UserPermission.objects.filter(node__in=DEPRECATED_PERMISSION_NODES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('sign', '0005_user_storage_quota'),
    ]

    operations = [
        migrations.RunPython(remove_files_read_permissions, migrations.RunPython.noop),
    ]
