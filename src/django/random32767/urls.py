from django.urls import path
from . import views

urlpatterns = [
    path('', views.fun2random32767, name='random32767'),
]