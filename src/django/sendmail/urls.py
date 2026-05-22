from django.urls import path

from . import views


urlpatterns = [
    path('users/', views.mail_users, name='sendmail_users'),
    path('send/', views.send_mail, name='sendmail_send'),
    path('inbox/', views.inbox, name='sendmail_inbox'),
    path('messages/<int:message_id>/', views.message_detail, name='sendmail_message_detail'),
    path('attachments/<int:attachment_id>/save/', views.save_attachment, name='sendmail_save_attachment'),
]

