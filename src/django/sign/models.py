from django.conf import settings
from django.db import models


class PermissionNode(models.Model):
    node = models.CharField(max_length=255, unique=True)
    label = models.CharField(max_length=100)
    category = models.CharField(max_length=60)
    description = models.TextField(blank=True)
    is_dangerous = models.BooleanField(default=False)
    is_system_locked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'node']

    def __str__(self):
        return self.node


class UserPermission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='direct_permissions')
    node = models.CharField(max_length=255)
    value = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['node']
        constraints = [
            models.UniqueConstraint(fields=['user', 'node'], name='sign_user_permission_unique_node'),
        ]

    def __str__(self):
        state = 'true' if self.value else 'false'
        return f'{self.user}:{self.node}={state}'


class UserStorageQuota(models.Model):
    """Storage quota assigned to a user."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='storage_quota')
    quota_bytes = models.BigIntegerField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user_id']

    def __str__(self):
        quota = 'unlimited' if self.quota_bytes is None else f'{self.quota_bytes} bytes'
        return f'{self.user}:{quota}'


class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return self.key
