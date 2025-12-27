<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<!--#include file="check.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="style.css">
<style type="text/css">
form {display:inline}
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
</head>
<body>
<%
Opendata
if Request.QueryString("action")="add" then
dim User_phototype,id
id=replace(Request.QueryString("id"),"'","")
if not FileDir_Name(id) then
response.write "非法递交"
response.end 
end if
User_phototype=replace(request.form("User_phototype"),"'","")
if trim(id)="" or trim(User_phototype)="" then
response.write "请输入内容,[<a href='javascript:history.back()'>返回</a>]"
response.end
end if
if len(User_phototype)>100 then
response.write "不能超过50个汉字，[<a href='javascript:history.back()'>返回</a>]"
response.end
end if
User_phototype=inohtml(User_phototype)
sql="update vip_photo set PhotoType='"&User_phototype&"' where id="&id
conn.execute(sql)
response.write "<script>javasctipt:window.opener.location.reload();window.close();</script>"
response.end
end if
dim Photo_type_id
Photo_type_id=replace(Request.QueryString("id"),"'","")
if trim(Photo_type_id)="" then
response.write "请选择文件"
response.end
if not FileDir_Name(Photo_type_id) then
response.write "非法递交"
response.end 
end if
else
%>
<form name="form1" method=Post action='user_phototype.asp?action=add&id=<%=Photo_type_id%>'>
<table width=100% border=0 cellspacing=1 height=100% bgcolor=#E0E2E0>
<tr><td align=center>[添加修改文件说明]<br>说明：不能超过50个汉字</td></tr>
<tr><td align=center>
<textarea name=User_phototype cols=40 rows=6></textarea><br>
<input type=submit name=submit value='确认添加'>&nbsp;
<input type=reset name=reset1 value='重新添加'>
</td></tr></table></form>
</body>
<%
end if
CloseData
%>