from django.urls import path
from . import views

urlpatterns = [
    path('', views.test_database, name='db_test'),
    path('create/', views.create_item, name='create_item'), # 移除 {'create': True}
    path('delete/', views.delete_all, name='delete_all_items'),
    path('data/', views.test_database, name='db_test'),
]