from django.db import migrations


def migrate_existing_private_directories(apps, schema_editor):
    """Make old per-owner directory tables compatible with the shared tree."""
    if schema_editor.connection.vendor != 'sqlite':
        return

    table_names = schema_editor.connection.introspection.table_names()
    if 'files_directoryentry' not in table_names:
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute('PRAGMA table_info(files_directoryentry)')
        columns = {row[1] for row in cursor.fetchall()}

        if 'created_by_id' in columns:
            return

        if 'owner_id' in columns:
            cursor.execute('ALTER TABLE files_directoryentry RENAME COLUMN owner_id TO created_by_id')


class Migration(migrations.Migration):
    dependencies = [
        ('files', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_existing_private_directories, migrations.RunPython.noop),
    ]
