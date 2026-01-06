from django.shortcuts import render

# Create your views here.
import random
from django.http import JsonResponse

def fun2random32767(request):
    """
    生成并返回一个 0 到 32767 之间的随机整数。
    """
    random_number = random.randint(0, 32767)
    return JsonResponse({'random_number': random_number})

# 如果你想要更直接的响应，也可以使用 HttpResponse
# from django.http import HttpResponse
# def generate_random_number(request):
#     random_number = random.randint(0, 32767)
#     return HttpResponse(str(random_number))