<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
dim pwd,User_Share,USer_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id)
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_GFL_SL
User_Group(User_Vip)
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
</head>
<body bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=558 border=0 cellspacing=1 cellpadding=3>
<tr class=fiel align=center><td width="104">目录名称</td><td width="157">共享权限</td><td width="116">建立日期</td><td width="64">操作</td></tr>
<%
if request.querystring("action")="del" then
dim FileDir_delid
FileDir_delid=request.querystring("FileDir_id")
if not FileDir_Name(FileDir_delid) then
response.write "非法递交"
response.end 
end if
FileDir_Del(FileDir_delid)
else
if request.querystring("FileDir_id")<>"" then
dim FileDir_id,FileDir_Share
FileDir_id=replace(request.querystring("FileDir_id"),"'","")
if not FileDir_Name(FileDir_id) then
response.write "非法递交"
response.end 
end if
FileDir_Share=replace(request.form("FileDir_Share"),"'","")
FileDir_Edit FileDir_id,FileDir_Share
else
FileDirList
end if
end if

CloseData

Function FileDir_Edit(str,str1)
if isnull(str) then exit function
str=trim(replace(str,"'",""))
if str="" then exit function
if isnull(str1) then exit function
str1=trim(replace(str1,"'",""))
if str1="" then exit function
if not IsNumeric(str1) then exit function
if str1<0 or str1>2 then exit function
sql="update Vip_FileDir set FileDir_Share="&str1&" where FileDir_id="&str&" and FileDir_Userid="&User_id
conn.execute(sql)
response.redirect "FileDirList.asp"
end Function

Function FileDir_Del(id)
if isnull(id) then exit function
id=trim(replace(id,"'",""))
if id="" then exit function
sql="select * from Vip_FileDir where FileDir_id="&id&" and FileDir_Userid="&User_id
set rs=conn.execute(sql)
if rs.eof then
response.write "无此目录"
rs.close
set rs=nothing
else
Dim FileDir_name
FileDir_name=rs("FileDir_Name")
rs.close
set rs=nothing
sql="select sum (FileDateSize) as SumSize,count(id) as Countid from Vip_Photo where FileDir_id="&id
set rs=conn.execute(sql)
dim SumSize,Countid
SumSize=rs("SumSize")
Countid=rs("Countid")
if isnull(SumSize) then
SumSize=0
end if
rs.close
set rs=nothing
sql="update Vip_User set User_Share='"&replace(User_Share,"|"&FileDir_name&"|","|")&"',User_UpMax=User_UpMax-"&SumSize&",User_UpCount=User_UpCount-"&Countid&" where id="&User_id
conn.execute(sql)

sql="delete from Vip_FileDir where FileDir_id="&id&" and FileDir_Userid="&User_id
conn.execute(sql)

sql="delete from Vip_Photo where id in (select id from Vip_Photo where FileDir_id="&id&" and User_id="&User_id&")"
conn.execute(sql)

on error resume next
Dim objFso
Set objFso=Server.CreateObject(File_FSO)
If err <> 0 Then
Err.Clear
Response.Write "服务器不支持FSO"
else
dim path
Path=File_Path&Group_id&"/"&User_id&"/"&FileDir_name
path=Server.MapPath(path)
response.write path
    If objFso.FolderExists(path) then
      objFso.DeleteFolder (path)
     response.write "目录已删除．"
    Else
     response.write "目录未找到．"
    End If
end if
Set objFso=nothing
end if
response.redirect "FileDirList.asp"
end Function

Function FileDirlist
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_FileDir where FileDir_Userid="&User_id
rs.open sql,conn,1,1
if rs.eof then
response.write "无目录"
else
do while not rs.eof%>
<tr>
<form name=form1 method=post action='?FileDir_id=<%=rs("FileDir_id")%>'>
<td width="104" align=center><a href=FileDir.asp?FileDir_Namelist=<%=rs("FileDir_Name")%>><%=rs("FileDir_Name")%></a></td>
<td width="104" align=center><select name=FileDir_Share>
<option value='0' <%if rs("FileDir_Share")=0 then response.write "selected"%>>不共享</option>
<option value='1' <%if rs("FileDir_Share")=1 then response.write "selected"%>>只好友</option>
<option value='2' <%if rs("FileDir_Share")=2 then response.write "selected"%>>所有人</option>
</select>
</td>
<td width="104" align=center><%=Formatdatetime(rs("FileDir_Time"),2)%></td>
<td width="104" align=center><input type=submit name=submit value='修改'>
<input type=button onClick="javascript:location.href='FileDirList.asp?FileDir_id=<%=rs("FileDir_id")%>&action=del';" value='删除'></td>
</form>
</tr>
<%
rs.movenext
loop
end if
rs.close
set rs=nothing
end function
%>
</table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>
