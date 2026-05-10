from django.urls import path

from . import views


urlpatterns = [
    path('', views.list_files, name='files_list'),
    path('upload/', views.upload_file, name='files_upload'),
    path('directories/', views.create_directory, name='files_create_directory'),
    path('directories/<int:directory_id>/rename/', views.rename_directory, name='files_rename_directory'),
    path('directories/<int:directory_id>/move/', views.move_directory, name='files_move_directory'),
    path('directories/<int:directory_id>/', views.delete_directory, name='files_delete_directory'),
    path('<int:entry_id>/download/', views.download_file, name='files_download'),
    path('<int:entry_id>/rename/', views.rename_file, name='files_rename'),
    path('<int:entry_id>/move/', views.move_file, name='files_move'),
    path('<int:entry_id>/', views.delete_file, name='files_delete'),
]
