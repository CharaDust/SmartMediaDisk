<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
OpenData
Dim ID
ID=replace(Request.QueryString("ID"),"'","")
IF ID="" Then
Response.write "参数错误"
Response.End
End IF
Sql="Select ID,User_ID,PhotoDir From Vip_Photo Where id="&ID
Set Rs=Conn.Execute(SQL)
IF Rs.eof then
Response.write "参数错误"
Else
dim PhotoDir
PhotoDir="Upload/"&RS("PhotoDir")
PhotoDir=replace(PhotoDir,"/","\")
PhotoDir=Server.MapPath(PhotoDir)
PhotoDir=replace(PhotoDir,"admin\","")
SQL="delete from Vip_Photo where id="&id
Conn.Execute(SQL)
dim objFso
on error resume next
Set objFso=Server.CreateObject("Scripting.FileSystemObject")
If err <> 0 Then
Err.Clear
Response.Write "服务器不支持FSO"
Response.end
End If
DeleteFiles(PhotoDir)
Function DeleteFiles(path)
    If objFso.FileExists(path) Then
      objFso.DeleteFile path,True
      'response.write "文件已删除．"
    Else
      response.write "文件未找到．"
      response.end
    End If
response.redirect "List.asp"
End Function
End IF
rs.close
set rs=nothing
set objFso=nothing
CloseData%>