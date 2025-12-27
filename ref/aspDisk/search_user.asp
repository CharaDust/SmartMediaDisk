<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = true
Opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<!-- #include file=conn.asp -->
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="style.css">
</head>
<body leftmargin="0" topmargin="0" bgcolor="#F6ECE2">
<%

If Request.QueryString("submitflag") = "" Then
	SearchFunction
Else
dim search
search=replace(request.form("search"),"'","")
if search="" then search="all"
GetSeatchName(search)

End If

Function SearchFunction
%>
<table width="560" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<p align=left>　提示：
<br><font color=#B50000>1. 请在文本框输入要查询的用户名。 
<br>2. 如果不输入用户名则为查询全部用户。 
<br> 
<br>
</font></p></td></tr>
<form name="form1" method="Post" action=?submitflag=yes>
<table width="560" border="0" cellspacing="0" cellpadding="0" height="84">
<tr><td align=center>用户名称<input type="text" name='search' value=""><input type="submit" value="搜索"></td></tr>
</table>
</form>
</td></tr></table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>
<%
End Function


Function GetSeatchName(name)
if name="all" then
sql="select * from Vip_User"
else
sql="select * from Vip_User where UserName='"&name&"'"
end if
set rs=server.createobject("adodb.recordset")
rs.open sql,conn,1,1
if rs.eof and rs.bof then
response.write "无此用户"
else
dim pagecount,pagesize
pagesize=120    '每页数量
if not isnull(request("page")) then
pagecount=cint(request("page"))
else
pagecount=1
end if
rs.pagesize=pagesize
if pagecount>rs.pagecount or pagecount<=0 then
pagecount=1
end if
rs.AbsolutePage=pagecount
response.write "<table width='560' border='0' cellpadding='0' cellspacing='0'>"
response.write "<tr>"
dim i
for i=1 to rs.recordcount
response.write "<td>"
response.write "<a href=Vip_Online_List.asp?id="&rs("ID")&">"&rs("Username")&"</a>"
response.write "</td>"
if i mod 6=0 then response.write "</tr><tr>"
rs.movenext
if i>=pagesize or rs.eof then exit for
next
response.write "</tr></table>"
response.write"<table><tr><td align=center>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=?page=1&submitflag=yes>首页</a>&nbsp;"
response.write "<a href=?page="+cstr(pagecount-1)+"&submitflag=yes>"
response.write "上一页</a>&nbsp;"
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write"<a href=?page="+cstr(pagecount+1)+"&submitflag=yes>"
response.write "下一页</a>&nbsp;"
response.write "<a href=?page="+cstr(rs.PageCount)+"&submitflag=yes>尾页</a>"    
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>" 
response.write"&nbsp;&nbsp;每页"&pagesize&"人&nbsp;&nbsp;共"&rs.recordcount&"人</td>"
response.write "</tr></table>"
response.write "</body></html>"
end if
rs.close
set rs=nothing
End Function
CloseData
%>