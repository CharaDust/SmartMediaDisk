from django.urls import path

from . import user_views


urlpatterns = [
    path('', user_views.users, name='users'),
    path('create/', user_views.create_user, name='create_user'),
    path('<int:user_id>/', user_views.user_detail, name='user_detail'),
    path('<int:user_id>/password/', user_views.reset_user_password, name='reset_user_password'),
]
