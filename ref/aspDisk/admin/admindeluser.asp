<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
ID=replace(Request.QueryString("id"),"'","")
if id="" then
response.write "无此用户"
response.end
end if
opendata
sql="select * from vip_user where id="&id
set rs=conn.execute(sql)
if rs.eof then
response.write "无此用户"
rs.close
set rs=nothing
response.end
else
Username=rs("Username")
Friends=rs("User_Friends")
groupid=rs("vip")
rs.close
set rs=nothing
end if

sql="select * from vip_Group where Group_id="&groupid
set rs=conn.execute(sql)
if rs.eof then
response.write "无此群组"
rs.close
set rs=nothing
else
Group_id=rs("Group_id")
File_Path=rs("File_Path")
File_FSO=rs("File_FSO")
rs.close
set rs=nothing
end if


function del_UserFriend
Friends=split(Friends,"|")
response.write ubound(Friends)-1
Dim i
for i=1 to ubound(Friends)-1
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_User where Username='"&Friends(i)&"'"
rs.open sql,conn,1,3
if not rs.eof then
rs("User_Friends")=replace(rs("User_Friends"),"|"&Username&"|","|")
rs.update
end if
rs.close
set rs=nothing
next
end function

del_UserFriend
sql="delete from Vip_Photo where User_id="&id
conn.execute(sql)
sql="delete from Vip_user where id="&id
conn.execute(sql)
sql="delete from Vip_FileDir where FileDir_Userid="&id
conn.execute(sql)
on error resume next
Set objFso=Server.CreateObject(File_FSO)
If err <> 0 Then
Err.Clear
Response.Write "服务器不支持FSO"
else
Path=File_Path&Group_id&"/"&id
path=Server.MapPath(path)
Path=replace(Path,"admin\","")
If objFso.FolderExists(path) then
      objFso.DeleteFolder (path)
      response.write "目录已删除．"
    Else
      response.write "目录未找到．"
    End If
end if
Set objFso=nothing
closedata
response.redirect "user1.asp"
%>