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
<body bgcolor="#F7EEE6">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=558 border=0 cellspacing=1 cellpadding=3 class=photo>
<tr class=fiel align=center><td width="104">好友名称</td><td width="157">共享目录</td>
<td width="116">操作</td></tr>
<%
Dim Friend_Name
Friend_Name=replace(request.querystring("Friend_Name"),"'","")
if Friend_Name<>"" then
DelFriend(Friend_Name)
else
if User_Friends="" then
response.write "无好友列表"
else
Friend_List
end if
end if
Function Friend_List
IF User_Friends="" then exit function
Dim My_Friend_list,i
My_Friend_list=split(User_Friends,"|")
for i=1 to ubound(My_Friend_List)-1
response.write "<tr><td>"&My_Friend_List(i)&"</td><td>"&FriendDir(My_Friend_List(i))&"</td>"
response.write"<td><a href=?Friend_Name="&My_Friend_List(i)&">删除</a></td></tr>"
next
response.write "</table>"
%>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
<%
end function

Function FriendDir(FriendName)
if isnull(FriendName) then exit function
sql="select * from Vip_FileDir where FileDir_Share>0 and FileDir_Userid in(select id from Vip_User where UserName='"&FriendName&"')"
set rs=conn.execute(sql)
if rs.eof then
FriendDir= "无共享目录"
else
do while not rs.eof
FriendDir=FriendDir&"<a href=My_Friend_FileDir.asp?FileDir_id="&rs("FileDir_id")&">"&rs("FileDir_Name")&"</a><br>"
rs.movenext
loop
end if
rs.close
set rs=nothing
end Function

function DelFriend(name)
if isnull(name) then exit function
sql="update Vip_User set User_Friends='"&replace(User_Friends,"|"&name&"|","|")&"' where id="&user_id
conn.execute(sql)
sql="select id,User_Friends from Vip_User where UserName='"&name&"'"
set rs=conn.execute(sql)
if rs.eof then
response.write"对象不是你的好友"
else
sql="update Vip_User set User_Friends='"&replace(rs("User_Friends"),"|"&UserName&"|","|")&"' where id="&rs("id")
conn.execute(sql)
end if
rs.close
set rs=nothing
response.redirect "My_Friend.asp"
end function
Closedata
%>
</table>
</body>
</html>
