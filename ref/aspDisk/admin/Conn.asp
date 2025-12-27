<%
Dim Conn,Connstr,DB
Dim RS,SQL
Dim ImgTypes
Dim Vip_Time
Vip_Time=Now        '获取服务器时间
Imgtypes=":.gif:.jpg:jpeg:.png:.bmp:"    '图片文件后缀，如果添加注意格式
Sub OpenData
DB="../data/db.mdb"
Set Conn = Server.CreateObject("ADODB.Connection")
Connstr="Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & Server.MapPath(""&db&"")
Conn.Open Connstr
End Sub

Sub CloseData
Conn.close
Set conn = Nothing
End Sub

'Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Sub Web_config
SQL="select * from Vip_config"
set rs=conn.execute(SQL)
if rs.eof then
rs.close
set rs=nothing
response.redirect "admin.asp"
else
Web_Vip_reg=rs("Vip_reg")
Web_Vip_Name=rs("Vip_Name")
Web_Vip_Caller=rs("Vip_Caller")
rs.close
set rs=nothing
end if
End Sub

Function FileDir_Name(name)
if isnull(name) then exit function
if len(name)>10 then 
response.write "名称超过10个字符"
exit function
end if
dim re
set re = New RegExp
re.Global = True
re.IgnoreCase = True
re.Pattern="^[a-zA-Z0-9]{1,}$"
FileDir_Name=re.Test(name)
Set Re = Nothing
end Function
%>
