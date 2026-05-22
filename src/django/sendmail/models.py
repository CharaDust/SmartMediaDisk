from django.conf import settings
from django.db import models


class MailMessage(models.Model):
    """A local mail message sent between site users."""
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_mail_messages')
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'created_at']),
        ]

    def __str__(self):
        return self.subject


class MailRecipient(models.Model):
    """Recipient row for a local mail message."""
    KIND_TO = 'to'
    KIND_CC = 'cc'
    KIND_BCC = 'bcc'
    KIND_CHOICES = [
        (KIND_TO, 'To'),
        (KIND_CC, 'Cc'),
        (KIND_BCC, 'Bcc'),
    ]

    message = models.ForeignKey(MailMessage, on_delete=models.CASCADE, related_name='recipients')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_mail')
    kind = models.CharField(max_length=8, choices=KIND_CHOICES)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['message', 'kind', 'recipient_id']
        constraints = [
            models.UniqueConstraint(fields=['message', 'recipient', 'kind'], name='sendmail_unique_message_recipient_kind'),
        ]
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'message']),
        ]

    def __str__(self):
        return f'{self.message_id}:{self.kind}:{self.recipient_id}'


class MailAttachment(models.Model):
    """Attachment reference stored with a local mail message."""
    message = models.ForeignKey(MailMessage, on_delete=models.CASCADE, related_name='attachments')
    file_object = models.ForeignKey('files.FileObject', on_delete=models.PROTECT, related_name='mail_attachments')
    source_entry = models.ForeignKey(
        'files.FileEntry',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='mail_attachments',
    )
    name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name
