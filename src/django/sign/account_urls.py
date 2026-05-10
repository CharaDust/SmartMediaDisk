from django.urls import path

from . import account_views


urlpatterns = [
    path('', account_views.account_detail, name='account_detail'),
    path('navbar-title/', account_views.navbar_title, name='account_navbar_title'),
    path('navbar-title/update/', account_views.update_navbar_title, name='account_update_navbar_title'),
    path('username/', account_views.update_username, name='account_update_username'),
    path('password/', account_views.update_password, name='account_update_password'),
]
