from django.urls import path

from . import permission_views


urlpatterns = [
    path('check/', permission_views.check_permission, name='permission_check'),
    path('nodes/', permission_views.permission_nodes, name='permission_nodes'),
    path('users/', permission_views.permission_users, name='permission_users'),
    path('users/<int:user_id>/', permission_views.user_permissions, name='user_permissions'),
]
