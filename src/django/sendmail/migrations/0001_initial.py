from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('files', '0002_shared_directory_compat'),
    ]

    operations = [
        migrations.CreateModel(
            name='MailMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=255)),
                ('body', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'sender',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='sent_mail_messages',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MailAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('size', models.BigIntegerField()),
                ('mime_type', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'file_object',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='mail_attachments',
                        to='files.fileobject',
                    ),
                ),
                (
                    'message',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='attachments',
                        to='sendmail.mailmessage',
                    ),
                ),
                (
                    'source_entry',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='mail_attachments',
                        to='files.fileentry',
                    ),
                ),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.CreateModel(
            name='MailRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('to', 'To'), ('cc', 'Cc'), ('bcc', 'Bcc')], max_length=8)),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                (
                    'message',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='recipients',
                        to='sendmail.mailmessage',
                    ),
                ),
                (
                    'recipient',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='received_mail',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['message', 'kind', 'recipient_id'],
            },
        ),
        migrations.AddIndex(
            model_name='mailmessage',
            index=models.Index(fields=['sender', 'created_at'], name='sendmail_ma_sender__ec983e_idx'),
        ),
        migrations.AddIndex(
            model_name='mailrecipient',
            index=models.Index(fields=['recipient', 'is_read', 'message'], name='sendmail_ma_recipie_a8e6ec_idx'),
        ),
        migrations.AddConstraint(
            model_name='mailrecipient',
            constraint=models.UniqueConstraint(
                fields=('message', 'recipient', 'kind'),
                name='sendmail_unique_message_recipient_kind',
            ),
        ),
    ]
