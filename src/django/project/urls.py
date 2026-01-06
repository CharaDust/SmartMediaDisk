# django_app/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse # 添加导入

# 定义一个简单的视图函数
def hello_world(request):
    return HttpResponse("Hello, World! (Django Default APP)")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', hello_world), # 添加根路由
    path('api/random32767/', include('random32767.urls')), # 自定义app
    # path('api/', include('your_api_app.urls')), # 如果你有API应用，取消注释并添加
]
