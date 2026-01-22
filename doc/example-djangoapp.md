本文档旨在提供一份开发Django app的基础开发框架
## 创建app模版
确保你的开发环境（非Docker环境）已安装`Python`、`pip`、`Django`及其所需依赖  
在以下目录内打开终端
```Path
/src/django
```
运行如下命令创建app模版：
- `Windows`命令
```powershell
py manage.py startapp 你的app名字
```
- `macOS`命令
```zsh
python3 manage.py startapp 你的app名字
```
- `Linux`命令
```shell
python manage.py startapp 你的app名字
```
## 注册app
打开以下文件
```Path
/sec/django/project/settings.py
```
在以下文段内添加你的app名字（文件夹名）
```python
INSTALLED_APPS = [
'django.contrib.admin',
'django.contrib.auth',
'django.contrib.contenttypes',
'django.contrib.sessions',
'django.contrib.messages',
'django.contrib.staticfiles',
'你的app名字',
]
```
## 编写逻辑
以下是一个简单的生成随机数的逻辑，将它加入`/sec/django/你的app名字/views.py`
```python
import random
from django.http import JsonResponse

# 函数名不必与app名相同
def fun2random32767(request):
"""
生成并返回一个 0 到 32767 之间的随机整数。
"""
random_number = random.randint(0, 32767)
return JsonResponse({'random_number': random_number})
```
- `random.randint(0, 32767)` 会生成一个包含边界值的随机整数。
- `JsonResponse` 会将数据以 JSON 格式返回给客户端，方便前端处理。如果不需要 JSON，可以使用 `HttpResponse` 返回纯文本。
## 分配链接路由
在`/sec/django/你的app名字`目录下创建一个新的文件`urls.py`，并编写以下内容：
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.fun2random32767, name='你的app名字'),
]
```
随后打开主URL路由配置，即`/src/django/project/urls.py`文件，修改内容：
```python
urlpatterns = [
	path('admin/', admin.site.urls),
	path('', hello_world), # 根路由
	path('api/自定义链接/', include('你的app名字.urls')), # 自定义app
	# path('api/其他api/', include('your_api_app.urls')), # 如果你有其他API应用，取消注释并添加
]
```