<!--#include file="conn.asp"-->
<!--#include file="User_Config.asp"-->
<%
OpenData
Dim User_Vip
User_UpFileConfig(User_id)
Dim File_FSO
User_Group(User_Vip)
Dim ID
ID=replace(Request.QueryString("ID"),"'","")
IF ID="" Then
Response.write "参数错误"
Response.End
End IF
if not IsNumeric(ID) then
response.write "非法递交"
response.end
end if

Sql="Select ID,User_ID,PhotoDir,PhotoDir_SL,FileDateSize From Vip_Photo Where id="&ID
Set Rs=Conn.Execute(SQL)
IF Rs.eof then
Response.write "无此文件"
rs.close
set rs=nothing
response.end
end if

IF Rs("User_ID")<>User_id then
Response.write "不能删除别人的记录"
rs.close
set rs=nothing
response.end
else
sql="update Vip_User set User_UpCount=User_UpCount-1,User_UpMax=User_UpMax-"&rs("FileDateSize")&" where id="&User_id
conn.execute(sql)
dim PhotoDir,PhotoDir_SL
PhotoDir="Upload/"&RS("PhotoDir")
PhotoDir=replace(PhotoDir,"/","\")
PhotoDir=Server.MapPath(PhotoDir)
if not isnull(RS("PhotoDir_SL")) then
PhotoDir_SL="Upload/"&RS("PhotoDir_SL")
PhotoDir_SL=replace(PhotoDir_SL,"/","\")
PhotoDir_SL=Server.MapPath(PhotoDir_SL)
end if
rs.close
set rs=nothing
end if
SQL="delete from Vip_Photo where id="&id
Conn.Execute(SQL)
dim objFso
on error resume next
Set objFso=Server.CreateObject(File_FSO)
If err <> 0 Then
Err.Clear
Response.Write "服务器不支持FSO"
Response.end
End If
DeleteFiles(PhotoDir)
Function DeleteFiles(path)
    If objFso.FileExists(path) Then
      objFso.DeleteFile path,True
      objFso.DeleteFile PhotoDir_SL,True
      'response.write "文件已删除．"
    Else
      'response.write "文件未找到．"
      'response.end
    End If
End Function
set objFso=nothing
CloseData
response.redirect request.ServerVariables("HTTP_REFERER")
%>
</td></tr></table>
</body>
</html>
