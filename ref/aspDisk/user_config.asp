<%
'此文件保存用户所属群组和群组权限、用户已经上传文件大小、数量
dim User_id
User_id=session("User_id")
if user_id="" and session("admin")="" then
response.write "用户超时，<a href=exit.asp target=_top>点此登陆</a>"
response.end
end if
function User_Online
sql="update Vip_Online set Last_time=now() where User_id="&User_id
conn.execute(sql)
sql="delete from Vip_Online where last_time<#"&dateadd("n","-20",Vip_Time)&"#"
conn.execute(sql)
end Function

'dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
'dim pwd,User_Share,USer_Friends,User_Friendallow
Function User_UpFileConfig(User_id)  '用户上传文件总数量、总容量
sql="select * from Vip_User where id="&User_id
set rs=conn.execute(sql)
if rs.eof then
response.write "错误，请联系管理员"
rs.close
set rs=nothing
response.end
end if
User_UpFileCount=rs("User_UpCount") '数量
User_UpFileMax=rs("User_UpMax")     '容量
User_Vip=rs("Vip")                  '用户群组
User_Share=rs("User_Share")         '用户共享目录
Username=rs("Username")
pwd=rs("pwd")
Sex=rs("sex")
Age=rs("age")
Address=rs("address")
Mail=rs("mail")
Times=rs("times")
Loginip=rs("loginip")
User_Friends=rs("USer_Friends")
User_Friendallow=rs("User_Friendallow")
rs.close
set rs=nothing
End Function

'dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
'dim File_GFL,File_FSO,File_Dir_Max,File_GFL_SL
Function User_Group(User_Vip)  '用户所属群组权限
sql="select * from Vip_Group where Group_id="&User_Vip
set rs=conn.execute(sql)
if rs.eof then
response.write "错误，请联系管理员"
rs.close
set rs=nothing
response.end
end if
Group_id=rs("Group_id")       '群组id
Group_Name=rs("Group_Name")   '群组名称
File_Count=rs("File_Count")   '群组允许上传数量
File_Max=rs("File_Max")  '群组允许上传单个文件大小
File_Max_Sum=rs("File_Max_Sum")'群组允许总体上传容量
File_Type=rs("File_Type")     '群组允许上传文件格式
File_Dir_Max=rs("File_Dir_Max")'群组允许创建的目录数量
File_str=rs("File_str")       '群组上传图片水印文字
File_Path=rs("File_Path")     '群组上传文件路径
File_GFL=rs("File_GFL")       '是否开启水印功能
File_GFL_SL=rs("File_GFL_SL") '是否开启缩略图功能
File_FSO=rs("File_FSO")       'Fso组件名称
rs.close
set rs=nothing
End Function

'Dim IsMy_Friend
Function My_Friend_Name(Friend_Name_id)     '判断用户名是否为好友
IsMy_Friend=False
if Friend_Name_id="" then exit function
if isnull(Friend_Name_id) then exit function
sqlF="select * from Vip_User where id="&Friend_Name_id
set rsF=conn.execute(sqlF)
if instr(rsF("User_Friends"),"|"&UserName&"|")<>0 then
IsMy_Friend=True
end if
rsF.close
set rsF=nothing
End Function
%>