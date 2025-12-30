# django_app/myapp/views.py
from django.http import JsonResponse
from django.shortcuts import render

def hello_world(request):
    return JsonResponse({'message': 'Hello from Django backend!'})

def get_data(request):
    data = {
        'status': 'success',
        'data': [
            {'id': 1, 'name': 'Item 1'},
            {'id': 2, 'name': 'Item 2'},
            {'id': 3, 'name': 'Item 3'},
        ]
    }
    return JsonResponse(data)