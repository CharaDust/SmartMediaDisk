<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
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
    <td height=10><%if session("User_id")<>"" then%><!--#include file="ad.asp"--><%end if%></td>
  </tr>
</table>
<table width=543 border=0 cellspacing=1 bgcolor="#F6ECE2"><tr><td height=1>
<tr><td>
<br>
<%
opendata
sql="select * from Vip_Group"
set rs=conn.execute(sql)
if rs.eof then
response.write "无"
else
do while not rs.eof
response.write "<img src=images/dot.gif>"&rs("Group_name")&"<br>"
response.write "┝允许上传文件数量"&rs("File_Count")&"个<br>"
response.write "┝单个文件大小"&rs("File_Max")&"K<br>"
response.write "┝允许上传总体文件大小"&rs("File_Max_Sum")&"K<br>"
response.write "┝允许上传的文件格式"&rs("File_Type")&"<br><br>"
rs.movenext
loop
end if
rs.close
set rs=nothing
closedata
%>
</td></tr></table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>