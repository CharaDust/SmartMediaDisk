<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
OpenData
dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_config
dim actionname
actionname=replace(Request.QueryString("action"),"'","")
select case actionname 
case "add"
Groupadd
case "GroupEdit"
GroupEdit
case "addsave"
GroupAddSave
end select
response.end
function GroupEdit
dim id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path,File_GFL,File_FSO
dim File_Dir_Max,File_GFL_SL
id=replace(Request.QueryString("id"),"'","")
Group_Name=replace(request.form("Group_Name"),"'","")
File_Count=replace(request.form("File_Count"),"'","")
File_Max=replace(request.form("File_Max"),"'","")
File_Max_Sum=replace(request.form("File_Max_Sum"),"'","")
File_Type=replace(request.form("File_Type"),"'","")
File_Dir_Max=replace(request.form("File_Dir_Max"),"'","")
File_str=replace(request.form("File_str"),"'","")
File_Path=replace(request.form("File_Path"),"'","")
File_GFL=replace(request.form("File_GFL"),"'","")
File_GFL_SL=replace(request.form("File_GFL_SL"),"'","")
File_FSO=replace(request.form("File_FSO"),"'","")
if id=""  then
response.write "群组不存在"
else
if File_Max_Sum="" or File_Type="" or File_str="" or File_Path="" then
response.write "请填写完整"
else
if File_GFL="" or File_FSO="" or Group_Name="" or File_Count="" or File_Max="" then
response.write "请填写完整"
else
if not IsNumeric(File_Count) or not IsNumeric(File_Max) then
response.write "请输入数字"
else
if not IsNumeric(File_Max_Sum) or not IsNumeric(File_GFL) then 
response.write "请输入数字"
else
sql="update Vip_Group set Group_Name='"&Group_Name&"',File_Count="&File_Count&","
sql=sql& "File_Max="&File_Max&",File_Max_Sum="&File_Max_Sum&","
sql=sql& "File_Type='"&File_Type&"',File_Dir_Max="&File_Dir_Max&",File_str='"&File_str&"',"
sql=sql&"File_Path='"&File_Path&"',File_GFL="&File_GFL&",File_GFL_SL="&File_GFL_SL&","
sql=sql& "File_FSO='"&File_FSO&"' where Group_id="&id
conn.execute(sql)
response.redirect Request.ServerVariables("HTTP_REFERER")
end if
end if
end if
end if
end if
end function
function Groupadd
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="../style.css">
</head>
<BODY>
<div align=center>
<center>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#B4B6B5>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="536" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 管理登陆</td></tr>
<tr><td height=1 bgcolor=#EAEAEA width="20%"><a href=admin.asp>管理首页</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=Group.asp>群组管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=User1.asp>用户管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=PassEdit.asp>修改密码</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=exit.asp>退出登陆</a></td>
<tr><td height=1 bgcolor=#CECECE width="536" colspan=5></td></tr>
</table>
<img src=../images/step01.gif><br>
<table width=540><tr><td width=80></td><td>
<table width=100% border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td></td></tr>
<tr><td></td><td>信息</td><td>说明</td></tr>
<form name=form1 method='post' action='GroupEdit.asp?action=addsave'>
<tr><td>群组名称</td><td><input type=text name='Group_Name' value=初级用户></td><td>群组名称</td></tr><tr><td>文件数量</td><td><input type=text name='File_Count' value='5'></td><td>允许上传的文件总数量</td></tr><tr><td>文件大小</td><td><input type=text name='File_Max' value='50'>K</td><td>允许上传的单个文件大小</td></tr><tr><td>文件总量</td><td><input type=text name='File_Max_Sum' value='500'>K</td><td>允许上传的文件容量</td></tr><tr><td>文件类型</td><td><input type=text name='File_Type' value=':.jpg:.gif:.jpeg:.jpe:.png:'></td><td>允许上传的文件类型,<font color=red>谨慎更改</font></td></tr><tr><td>目录数量</td><td><input type=text name='File_Dir_Max' value='0'></td><td>允许创建的目录数量</td></tr><tr><td>水印文字</td><td><input type=text name='File_str'value='昕格管理'></td><td>图片文件的水印文字</td></tr><tr><td>存储目录</td><td><input type=text name='File_Path' value='upload/'></td><td>文件存储的目录,<font color=red>谨慎更改</font></td></tr><tr><td>使用缩图</td><td><input type=text name='File_GFL_SL' value='1'></td><td>是否使用缩略图,0使用,1不使用</td></tr><tr><td>使用水印</td><td><input type=text name='File_GFL' value='1'></td><td>是否给图片加水印,0使用,1不使用</td></tr><tr><td>FSO组件</td><td><input type=text name='File_FSO' value='Scripting.FileSystemObject'></td><td>FSO组件名称,<font color=red>谨慎更改</font></td></tr>
<tr><td colspan=3 align=center><input type=submit name=submit value='添加'>&nbsp;<input type=reset name=reset value='重添'></td></tr></form>
</table>
</td></tr></table>
</td></tr></table>
</center></div>
<!--#include file="bottom.asp"-->
</BODY></HTML>
<%
end function
function GroupAddSave
dim Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path,File_GFL,File_FSO
Dim File_Dir_Max,File_GFL_SL
Group_Name=replace(request.form("Group_Name"),"'","")
File_Count=replace(request.form("File_Count"),"'","")
File_Max=replace(request.form("File_Max"),"'","")
File_Max_Sum=replace(request.form("File_Max_Sum"),"'","")
File_Type=replace(request.form("File_Type"),"'","")
File_Dir_Max=replace(request.form("File_Dir_Max"),"'","")
File_str=replace(request.form("File_str"),"'","")
File_Path=replace(request.form("File_Path"),"'","")
File_GFL_SL=replace(request.form("File_GFL_SL"),"'","")
File_GFL=replace(request.form("File_GFL"),"'","")
File_FSO=replace(request.form("File_FSO"),"'","")
sql="select Group_name from Vip_Group where Group_Name='"&Group_Name&"'"
set rs=conn.execute(sql)
if not rs.eof then
response.write "群组已经存在"
rs.close
set rs=nothing
else
if File_Max_Sum="" or File_Type="" or File_str="" or File_Path="" then
response.write "请填写完整"
else
if File_GFL="" or File_FSO="" or Group_Name="" or File_Count="" or File_Max="" then
response.write "请填写完整"
else
if not IsNumeric(File_Count) or not IsNumeric(File_Max) then
response.write "请输入数字"
else
if not IsNumeric(File_Max_Sum) or not IsNumeric(File_GFL) then 
response.write "请输入数字"
else
sql="insert into Vip_Group "
sql=sql& "(Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_Dir_Max,File_str,"
sql=sql& "File_Path,File_GFL,File_GFL_SL,File_FSO)values('"&Group_Name&"',"&File_Count&","&File_Max&","
sql=sql& File_Max_Sum&",'"&File_Type&"',"&File_Dir_Max&",'"&File_str&"'"
sql=sql& ",'"&File_Path&"',"&File_GFL&","&File_GFL_SL&",'"&File_FSO&"')"
'response.write sql
conn.execute(sql)
rs.close
set rs=nothing
response.redirect "Group.asp"
end if
end if
end if
end if
end if
end function
CloseData
%>