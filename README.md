# SmartMediaDisk
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
这是一个本科毕业设计，由多位作者联合开发和维护。  
## 功能 / Feature
- 暂定
## 需要注意 / Warn
以下需要注意的问题在github教学后将会移动至Issues页面
### 设计更名问题
**诉求：**  
- 删除设计的名称包含的“基于ASP与Access”这一限定技术的文本

**原因：**  
在资料搜索的过程中发现
- ASPX / ASP.NET的应用范围较为狭窄，仅原生支持具有IIS功能的Windows服务器，在Linux运行时需要花大量时间做兼容工作。
	- ASP.NET 需要额外花时间学习C#语言来实现后端功能。C#是属于典型的面向对象编程语言，但实现方法比C++要更难，对于面向对象编程而言，需要开发者拥有C++（不能是C）编程基础才能更顺利地学习。
	- 做好后端功能后，我们仍要使用其他技术实现邮件服务器。
- Access数据库也拥有同样的问题，即只能在Windows上预览与编辑。此外，如果需要进行web操作（如执行“注册用户”命令），在不学习复杂的Basic宏脚本的情况下只能去软件内手动修改表的内容。

**综上所述：**
若设计的名称包含“基于ASP与Access”这一限定技术的文本，建议删除，仅保留主体部分。或者仅删除“ASP与”，Access还能够通过单向映射来模拟，但也不建议这样做，因为这会徒增不必要的工作量  
### 设计所使用的技术
**诉求：**  
该项目未来所需要使用的技术：  
- Django（python） - 用于实现网页后端与邮件服务器
- SQLite - 用于实现数据库功能
- Bootstrap - 用于重写现代化网页

**原因：**
基于搜索引擎与AI的推荐，以及各方面的资料，实现网络存储和邮件转发的基本功能所用到的最简单技术栈就是这些。  
在此之前，所谓指导老师还在给我提“建议”：
- 前端开发加个Vue，TypeScript，还有React
- 后端开发加个FastAPI，Django
- 还有你这实时性再加个Node，还有Express
- 你这开服务器得用Nginx，挂载Gunicorn或者uWSGI
- 文件服务用WebDAV，还有apache
- 这个数据库还需要MySQL
- 相册功能还可以加入地图预览，弄个高德的API上去
- 咱们是通信工程的，还得融合几个通信接口，传感器啊什么的

听起来像是在许愿。。。
## 使用方法 / Usage
### 构建
在项目文件夹内打开终端  
使用`Windows`/`macOS`/`Linux`命令行运行
```bash
docker compose build
```
### 开发环境
使用`Windows`/`macOS`/`Linux`命令行运行所有服务
```bash
docker compose up
```
- 使用浏览器打开`http://localhost:8080`观察前端运行结果（Nginx）
	- 应该能看到一个简易的主页
- 使用浏览器打开`http://localhost:8000`观察后端运行结果（Django）
	- 应该能看到一串文本“Hello World（Django Default APP）”
## 调试与修改 / Debug & Modify
### 设计静态前端
修改以下文件夹内的内容，得益于Volume映射，保存文件后刷新网页即可看到修改内容
```Path
/src/html
```
### 设计后端
设计后端略显麻烦，需要自行编写或导入现有Django app，然后注册它，最后为它分配URL
#### 创建app模版
确保你的开发环境（非Docker环境）已安装Python、pip、Django及其所需依赖  
在以下目录内打开终端
```Path
/src/django
```
运行如下命令创建app模版
```bash
//Linux指令
python manage.py startapp 你的app名字
//macOS指令
python3 manage.py startapp 你的app名字
//Windows 指令
py manage.py startapp 你的app名字
```
或者复制该目录下的`empty`文件夹并直接粘贴，里面包含已创建好的app模版  
#### 注册app
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
#### 编写逻辑
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
#### 分配链接路由
在`/sec/django/你的app名字`目录下创建一个新的文件`urls.py`，并编写以下内容：
```python
from django.urls import path
from . import views

urlpatterns = [
# random32767是函数名称
path('', views.random32767, name='你的APP名字'),
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
#### 参考手册
如果你需要实现更多高级功能，请参照[Django 官方文档（中文）](https://docs.djangoproject.com/zh-hans/6.0/)
### 关闭服务
使用`Windows`/`macOS`/`Linux`命令行运行以下命令以关闭所有服务
```bash
docker compose down
```
## 任务列表 / Todo
以下为完成该项目所需要做的事情以及需要学习的技术  
### 前端
- [ ] 重写现代化网页 - Bootstrap（HTML）
- [ ] 正在分析...
### 后端
- [ ] 规划功能 - Django（python）
- [ ] 正在分析...
### 数据库
- [ ] 规划功能 - SQLite
- [ ] 单向兼容Microsoft Access
- [ ] 正在分析...
### 邮件服务器
- [ ] 规划功能 - Django Sendmail（python）
- [ ] 正在分析...
## 许可证 / LICENSE
这个项目下的所有原创代码与设计采用 **MIT 开源协议**。您可以自由使用、修改和分发本项目。  
您必须在副本中包含原始版权声明和许可声明。  
软件按"原样"提供，不附带任何担保。
