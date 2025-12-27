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
### 开发环境
使用`Windows`/`macOS`/`Linux`命令行运行
```bash
docker-compose up web-dev
```
使用浏览器打开`http://localhost:8080`观察运行结果
### 生产环境（本地测试）
使用`Linux`命令行运行
```bash
docker-compose up web-prod
```
使用浏览器打开`http://localhost:8081`观察运行结果
### 关闭服务
使用`Windows`/`macOS`/`Linux`命令行运行以下命令以关闭所有服务
```bash
docker-compose down
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
