本文档旨在提供一份给予Django创建数据库的基础开发框架  
Django自带一个数据库引擎——`SQLite`，在小型项目中可以快速创建以及应用数据库功能  
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
## 创建数据模型
打开以下文件
```Path
/sec/django/你的app名字/models.py
```
编写以下内容
```python
from django.db import models

class TestItem(models.Model):
    name = models.CharField(max_length=100)              # 名称序号：Char
	value = models.IntegerField()                        # 整数值：Int
    created_at = models.DateTimeField(auto_now_add=True) # 创建时间：Date

    def __str__(self):
        return self.name
```
## 创建数据库迁移文件
在以下目录内打开终端
```Path
/src/django
```
运行如下命令创建app模版：
- `Windows`命令
```powershell
py manage.py makemigrations 你的app名字
```
- `macOS`命令
```zsh
python3 manage.py makemigrations 你的app名字
```
- `Linux`命令
```shell
python manage.py makemigrations 你的app名字
```
看到如下内容时，代表运行成功
```log
Migrations for '你的app名字':
  你的app名字/migrations/0001_initial.py
    - Create model TestItem
```
## 迁移至数据库
在以下目录内打开终端
```Path
/src/django
```
运行如下命令创建app模版：
- `Windows`命令
```powershell
py manage.py migrate
```
- `macOS`命令
```zsh
python3 manage.py migrate
```
- `Linux`命令
```shell
python manage.py migrate
```
看到如下内容时，代表运行成功
```log
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, 你的app名字, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying admin.0003_logentry_add_action_flag_choices... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying auth.0010_alter_group_name_max_length... OK
  Applying auth.0011_update_proxy_permissions... OK
  Applying auth.0012_alter_user_first_name_max_length... OK
  Applying 你的app名字.0001_initial... OK
  Applying sessions.0001_initial... OK
```
- 这会在你的数据库（默认是 SQLite）中创建 `你的app名字_testitem` 表。
## 编写数据库功能（视图）
打开以下文件
```Path
/sec/django/你的app名字/views.py
```
编写以下内容
```python
from django.shortcuts import render
from django.http import JsonResponse
import random
from .models import TestItem

def test_database(request):
    """
    测试数据库功能：查询所有数据。
    """
    items = TestItem.objects.all()
    items_data = []
    for item in items:
        items_data.append({
            'id': item.id,
            'name': item.name,
            'value': item.value,
            'created_at': item.created_at.isoformat() # 转换为 ISO 格式字符串
        })

    # 返回 JSON 数据
    return JsonResponse({'items': items_data})

def create_item(request):
    """
    创建一个新的 TestItem。
    """
    # 生成 0-32767 之间的随机数
    random_value = random.randint(0, 32767)
    new_item = TestItem.objects.create(
        name=f"Item_{random.randint(1000, 9999)}",
        value=random_value
    )
    return JsonResponse({
        'message': f'Created item {new_item.name} with value {new_item.value}',
        'item_id': new_item.id
    })

def delete_all(request):
    """
    删除所有测试数据 (用于清理)。
    """
    deleted_count, _ = TestItem.objects.all().delete()
    return JsonResponse({'message': f'Deleted {deleted_count} items.'})
```
## 分配链接路由
在`/sec/django/你的app名字`目录下创建一个新的文件`urls.py`，并编写以下内容：
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.test_database, name='你的app名字'),
    path('create/', views.create_item, name='create_item'),
    path('delete/', views.delete_all, name='delete_all_items'),
]
```
随后打开主URL路由配置，即`/src/django/project/urls.py`文件，修改内容：
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', hello_world), # 添加根路由
    path('api/dbtest/', include('你的app名字.urls')), # 注意这里加了前缀 'api/testdb/'
    # path('api/', include('your_api_app.urls')), # 如果你有API应用，取消注释并添加
]
```
## 测试结果
- **访问主页 (列出所有项):** `http://localhost:8080/api/testdb/`
    - 一开始应该是空列表。
- **创建新项:** `http://localhost:8080/api/testdb/create/`
    - 每次访问都会创建一个新的 `TestItem`，其 `value` 是 0-32767 之间的随机数。
- **删除所有项:** `http://localhost:8080/api/testdb/delete/`
    - 清理数据库中的所有 `TestItem`。