数据库文件 data/db.mdb
数据库连接文件conn.asp

管理登陆文件admin/admin.asp
md5函数为md5.asp文件

GflSDKSetup.exe为水印组件，如果不使用请在后台关闭此功能

默认用户名密码 admin

用户权限分组，设置组权限即可设置所属组的用户权限

此程序使用无组件上传，自动创建组id目录-用户id目录-用户名目录
删除用户文件即删除用户所上传单个文件
删除用户即删除用户id目录（包括此目录下所有目录-文件）
删除组即删除组id目录（包括此目录下所有目录-文件）

目录创建删除需使用fso组件

图片水印使用GflSDK组件，压缩包自带（自行杀毒安装）

使用session两个（session("user_id")为用户，session("admin")为管理）

判断用户信息文件user_config.asp 
判断管理员信息文件admin_config.asp

文件夹加密功能暂不开放，等下一版增加此功能