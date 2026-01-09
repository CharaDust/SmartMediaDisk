# SmartMediaDisk
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
这是一个本科毕业设计，由多位作者联合开发和维护。  
一个部署在Docker内的媒体网盘服务器  
[repo](doc/report-general.md)
## 功能 / Feature
- 暂定
## 需要注意 / Warn
- 非紧急的注意事项已移动至议题（issues）页面
- 暂无紧急注意事项
## 使用方法 / Usage
### 构建（开发）
在项目文件夹内打开终端  
使用`Windows`/`macOS`/`Linux`命令行运行
```bash
docker compose build
```
### 创建容器并运行（开发）
使用`Windows`/`macOS`/`Linux`命令行运行所有服务
```bash
docker compose up
```
- 使用浏览器打开`http://localhost:8080`观察前端运行结果（Nginx）
	- 应该能看到一个简易的主页
- 使用浏览器打开`http://localhost:8000`观察后端运行结果（Django）
	- 应该能看到一串文本“Hello World（Django Default APP）”
### 关闭服务（开发）
使用`Windows`/`macOS`/`Linux`命令行运行以下命令以关闭所有服务
```bash
docker compose down
```
### 创建镜像并迁移（生产）
该教程为离线迁移教程，适用于兼容性好且当你无法轻松访问docker hub服务时使用。  
虽然有更好的registry推送可以使用，但对于本项目而言，并不推荐使用这种做法，因为开发阶段的代码没有做任何裁剪，镜像包大小总计已经超过1GB，不建议通过互联网传输。
##### `步骤1:`
使用`Windows`/`macOS`/`Linux`命令行运行以下命令以打包镜像  
```shell
docker save \
  -o smartmediadisk-images.tar \
  smartmediadisk-django-dev:latest \
  smartmediadisk-nginx-dev:latest
```
- 此命令已包含所用到的服务包，
##### `步骤2:`
将文件`smartmediadisk-images.tar`通过任意方式转移至生产环境（U盘，网络传输等）
##### `步骤3:`
使用`Windows`/`macOS`/`Linux`命令行运行以下命令以加载镜像  
```bash
docker load -i /home/yourusername/smartmediadisk-images.tar
```
##### `步骤4:`
项目中有一个用于生产环境配置的文件，你可以直接使用它，或者自己再写一份，他们之间的区别是：

| 条目          | 生产环境                      | 开发环境                 |
| ----------- | ------------------------- | -------------------- |
| 文件名         | `docker-compose.yml.prod` | `docker-compose.yml` |
| 启动方式        | 加载镜像                      | 构建镜像                 |
| 存储卷         | 已经固定                      | 挂载中，可以随时修改           |
| image       | ✔︎                        | ✘                    |
| build       | ✘                         | ✔︎                   |
| port        | ✔︎                        | ✔︎                   |
| volume      | ✘                         | ✔︎                   |
| environment | ✔︎                        | ✔︎                   |
| depends_on  | ✔︎                        | ✔︎                   |
##### `步骤5:`
从镜像构建容器并运行。  
- 如果生产设备安装了webUI面板，可以登录面板（如Portainer面板`<http://ip:9000>`）创建一个stack，在构建方式（Build method）编辑框内填入生产环境构建文件的内容，随后保存运行，容器就成功启动了。可以转到结果测试中测试迁移结果
- 如果生产设备仅安装了Docker基础服务，则按照下面的方法构建容器
	- 将生产环境的构建文件传输到刚刚传输镜像包的文件夹目录内。
	- 随后使用终端运行`docker-compose up -d`来从镜像构建容器。
##### `结果测试`
- 使用浏览器打开`http://ip:8080`观察前端运行结果（Nginx）
	- 应该能看到一个简易的主页
- 使用浏览器打开`http://ip:8000`观察后端运行结果（Django）
	- 应该能看到一串文本“Hello World（Django Default APP）”
## 调试与修改 / Debug & Modify
以下操作应在开发环境内完成，不建议在生产环境使用
### 设计静态前端
修改以下文件夹内的内容，得益于Volume映射，保存文件后刷新网页即可看到修改内容
```Path
/src/html
```
### 设计后端
设计后端略显麻烦，需要自行编写或导入现有Django app，然后注册它，最后为它分配URL  
- [创建一个简单的 Django app](doc/example-djangoapp.md)
- [实现一个简单的前后端交互]()
### 创建数据库
- [创建一个简单的 SQLite 数据库](doc/example-sqlite.md)
- [实现一个简单的前后端数据交互]()
### 参考手册
如果你需要实现更多高级功能，请参照[Django 官方文档（中文）](https://docs.djangoproject.com/zh-hans/6.0/)

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
