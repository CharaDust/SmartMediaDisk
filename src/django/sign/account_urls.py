from django.urls import path

from . import account_views


urlpatterns = [
    path('', account_views.account_detail, name='account_detail'),
    path('username/', account_views.update_username, name='account_update_username'),
    path('password/', account_views.update_password, name='account_update_password'),
]
