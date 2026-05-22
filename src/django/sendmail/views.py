import json
import re

from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from files.models import DirectoryEntry, FileEntry, FileObject
from files.path_utils import display_path, normalize_name, normalize_path, split_path
from files.permissions import can_share_file, can_upload_file
from files.storage_service import create_file_entry_from_object

from .models import MailAttachment, MailMessage, MailRecipient

LOCAL_MAIL_DOMAIN = 'local'
MAX_ATTACHMENTS = 20


def _json_error(message, status):
    return JsonResponse(
        {
            'status': 'error',
            'message': message,
        },
        status=status,
    )


def _read_payload(request):
    try:
        return json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return None


def _require_authenticated(request):
    if not request.user.is_authenticated:
        return _json_error('Authentication required.', 401)

    return None


def _mail_address(user):
    username = user.get_username()
    return f'{username}@{LOCAL_MAIL_DOMAIN}'


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.get_username(),
        'email': user.email,
        'mail_address': _mail_address(user),
    }


def _directory_exists(path):
    path = normalize_path(path)
    if not path:
        return True

    parent_path, name = split_path(path)
    return DirectoryEntry.objects.filter(parent_path=parent_path, name=name).exists()


def _split_address_list(value):
    if isinstance(value, list):
        raw_values = value
    else:
        raw_values = re.split(r'[;,，；\s]+', str(value or ''))

    return [str(item).strip() for item in raw_values if str(item).strip()]


def _build_user_lookup():
    User = get_user_model()
    lookup = {}
    for user in User.objects.filter(is_active=True):
        username = user.get_username()
        candidates = {username, f'{username}@{LOCAL_MAIL_DOMAIN}'}
        if user.email:
            candidates.add(user.email)

        for candidate in candidates:
            lookup[candidate.lower()] = user

    return lookup


def _resolve_recipients(payload):
    lookup = _build_user_lookup()
    recipients = []
    seen = set()
    for kind in (MailRecipient.KIND_TO, MailRecipient.KIND_CC, MailRecipient.KIND_BCC):
        for address in _split_address_list(payload.get(kind)):
            user = lookup.get(address.lower())
            if user is None:
                raise ValueError(f'Unknown local mail account: {address}')

            key = (kind, user.id)
            if key in seen:
                continue

            seen.add(key)
            recipients.append((kind, user))

    if not recipients:
        raise ValueError('At least one recipient is required.')

    return recipients


def _serialize_recipient_user(recipient):
    return _serialize_user(recipient.recipient)


def _serialize_recipients(message, current_user):
    rows = list(message.recipients.all())
    current_user_id = current_user.id if current_user.is_authenticated else None
    return {
        'to': [_serialize_recipient_user(row) for row in rows if row.kind == MailRecipient.KIND_TO],
        'cc': [_serialize_recipient_user(row) for row in rows if row.kind == MailRecipient.KIND_CC],
        'bcc': [
            _serialize_recipient_user(row)
            for row in rows
            if row.kind == MailRecipient.KIND_BCC and row.recipient_id == current_user_id
        ],
    }


def _serialize_attachment(attachment):
    return {
        'id': attachment.id,
        'name': attachment.name,
        'size': attachment.size,
        'mime_type': attachment.mime_type,
    }


def _serialize_message(message, current_user, include_body=False):
    current_rows = [
        row
        for row in message.recipients.all()
        if row.recipient_id == current_user.id
    ]
    data = {
        'id': message.id,
        'subject': message.subject,
        'sender': _serialize_user(message.sender),
        'recipients': _serialize_recipients(message, current_user),
        'attachments': [_serialize_attachment(attachment) for attachment in message.attachments.all()],
        'created_at': message.created_at.isoformat(),
        'is_read': all(row.is_read for row in current_rows) if current_rows else False,
    }
    if include_body:
        data['body'] = message.body

    return data


@require_GET
def mail_users(request):
    """Return active local mail users for composing messages."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    User = get_user_model()
    users = [_serialize_user(user) for user in User.objects.filter(is_active=True).order_by(User.USERNAME_FIELD)]
    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'users': users,
            },
        }
    )


@csrf_exempt
@require_POST
def send_mail(request):
    """Send a local mail message with optional file attachments."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        recipients = _resolve_recipients(payload)
    except ValueError as error:
        return _json_error(str(error), 400)

    subject = str(payload.get('subject') or '').strip()[:255] or '(无主题)'
    body = str(payload.get('body') or '')
    attachment_ids = payload.get('attachment_ids') or payload.get('attachments') or []
    if not isinstance(attachment_ids, list):
        return _json_error('attachment_ids must be a list.', 400)
    if len(attachment_ids) > MAX_ATTACHMENTS:
        return _json_error(f'At most {MAX_ATTACHMENTS} attachments are allowed.', 400)

    entries = []
    for entry_id in attachment_ids:
        try:
            entry = FileEntry.objects.select_related('owner', 'file_object').get(pk=int(entry_id))
        except (TypeError, ValueError, FileEntry.DoesNotExist):
            return _json_error('Attachment file not found.', 404)

        if not can_share_file(request.user, entry):
            return _json_error('Permission denied for one or more attachments.', 403)

        entries.append(entry)

    with transaction.atomic():
        message = MailMessage.objects.create(sender=request.user, subject=subject, body=body)
        MailRecipient.objects.bulk_create(
            [
                MailRecipient(message=message, recipient=recipient, kind=kind)
                for kind, recipient in recipients
            ]
        )
        for entry in entries:
            file_object = FileObject.objects.select_for_update().get(pk=entry.file_object_id)
            file_object.ref_count += 1
            file_object.save(update_fields=['ref_count', 'updated_at'])
            MailAttachment.objects.create(
                message=message,
                file_object=file_object,
                source_entry=entry,
                name=entry.name,
                size=entry.size,
                mime_type=entry.mime_type,
            )

    message = (
        MailMessage.objects.select_related('sender')
        .prefetch_related('recipients__recipient', 'attachments')
        .get(pk=message.pk)
    )
    return JsonResponse(
        {
            'status': 'success',
            'message': 'Mail sent.',
            'data': {
                'message': _serialize_message(message, request.user, include_body=True),
            },
        },
        status=201,
    )


@require_GET
def inbox(request):
    """Return local mail received by the current user."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    messages = (
        MailMessage.objects.filter(recipients__recipient=request.user)
        .select_related('sender')
        .prefetch_related('recipients__recipient', 'attachments')
        .distinct()
        .order_by('-created_at')
    )
    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'messages': [_serialize_message(message, request.user) for message in messages],
            },
        }
    )


@require_GET
def message_detail(request, message_id):
    """Return one received local mail message and mark it as read."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    try:
        message = (
            MailMessage.objects.filter(recipients__recipient=request.user)
            .select_related('sender')
            .prefetch_related('recipients__recipient', 'attachments')
            .distinct()
            .get(pk=message_id)
        )
    except MailMessage.DoesNotExist:
        return _json_error('Mail message not found.', 404)

    MailRecipient.objects.filter(message=message, recipient=request.user, is_read=False).update(
        is_read=True,
        read_at=timezone.now(),
    )
    message = (
        MailMessage.objects.select_related('sender')
        .prefetch_related('recipients__recipient', 'attachments')
        .get(pk=message.pk)
    )
    return JsonResponse(
        {
            'status': 'success',
            'data': {
                'message': _serialize_message(message, request.user, include_body=True),
            },
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def save_attachment(request, attachment_id):
    """Save a received mail attachment into the current user's disk."""
    auth_error = _require_authenticated(request)
    if auth_error:
        return auth_error

    payload = _read_payload(request)
    if payload is None:
        return _json_error('Invalid JSON payload.', 400)

    try:
        parent_path = normalize_path(payload.get('path'))
        name = normalize_name(payload.get('name') or '', 'File name') if payload.get('name') else None
    except ValueError as error:
        return _json_error(str(error), 400)

    try:
        attachment = (
            MailAttachment.objects.select_related('message', 'file_object')
            .filter(message__recipients__recipient=request.user)
            .distinct()
            .get(pk=attachment_id)
        )
    except MailAttachment.DoesNotExist:
        return _json_error('Attachment not found.', 404)

    if not can_upload_file(request.user, parent_path):
        return _json_error('Permission denied.', 403)

    if not _directory_exists(parent_path):
        return _json_error('Target directory not found.', 404)

    try:
        entry = create_file_entry_from_object(
            request.user,
            attachment.file_object,
            parent_path,
            name or attachment.name,
            attachment.mime_type,
        )
    except ValueError as error:
        return _json_error(str(error), 409)

    return JsonResponse(
        {
            'status': 'success',
            'message': 'Attachment saved.',
            'data': {
                'file': {
                    'id': entry.id,
                    'name': entry.name,
                    'path': display_path(entry.path),
                    'owner': _serialize_user(entry.owner),
                },
            },
        },
        status=201,
    )
