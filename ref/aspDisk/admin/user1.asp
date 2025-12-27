<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
Opendata
dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_config%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="../style.css">
<SCRIPT LANGUAGE="JavaScript">
<!--
function check()
{
   if (isNaN(document.form2.page.value))
		alert("请正确填写转到页数！");
   else if (document.form2.page.value=="") 
	     {
		alert("请输入转到页数！");
		 }
   else
		document.form2.submit();
}
//-->
</SCRIPT>
</head>
<BODY>
<div align=center>
<center>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#B4B6B5>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="100%" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 管理登陆</td></tr>
<tr><td height=1 bgcolor=#EAEAEA width="20%"><a href=admin.asp>管理首页</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=Group.asp>群组管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=User1.asp>用户管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=PassEdit.asp>修改密码</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=exit.asp>退出登陆</a></td>
<tr><td height=1 bgcolor=#CECECE width="100%" colspan=5></td></tr>
</table>
<img src=../images/step01.gif width=550><br>
<table width=540><tr><td width=40></td><td>
<table width=100% border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td></td></tr>
<tr><td>用户名称</td><td>上传数量</td><td>上传容量</td><td>操作</td></tr>
<%
dim key
key=trim(replace(request.form("key"),"'",""))
set rs=server.createobject("adodb.recordset")
if key="" then
SQL="Select * from Vip_User"
else
SQL="Select * from Vip_User where username like '%"&key&"%'"
end if
rs.open sql,conn,1,1
if rs.eof then
response.write "无用户"
rs.close
set rs=nothing
else
dim pagecount,pagesize
pagesize=50
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
dim i
for i=1 to rs.pagesize%>
<tr><td><a href=user.asp?id=<%=rs("id")%> target=_blank><%=rs("UserName")%></a></td>
<td><%=rs("User_UpCount")%></td><td><%=clng(rs("User_UpMax")/1024)%></td>
<td><a href=admindeluser.asp?id=<%=rs("id")%>>删除</a></td></tr>
<%
rs.movenext
if rs.eof then exit for
next
%>
</td></tr></table>
<table><tr><td align='center' width=500>
<% response.write"<form name=form2 method=Post action='user1.asp'>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
if key="" then 
response.write "<a href=user1.asp?page=1>首页</a>&nbsp;"   
response.write "<a href=user1.asp?page="+cstr(pagecount-1)+">上一页</a>&nbsp;"
else
response.write "<a href=user1.asp?page=1&key="+key+">首页</a>&nbsp;" 
response.write "<a href=user1.asp?page="+cstr(pagecount-1)+"&key="+key+">上一页</a>&nbsp;"
end if
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
if key="" then
response.write "<a href=user1.asp?page="+cstr(pagecount+1)+">下一页</a>&nbsp;"
response.write "<a href=user1.asp?page="+cstr(rs.PageCount)+">尾页</a>"
else
response.write "<a href=user1.asp?page="+cstr(pagecount+1)+"&key="+key+">下一页</a>&nbsp;"
response.write "<a href=user1.asp?page="+cstr(rs.PageCount)+"&key="+key+">尾页</a>"
end if
end if
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>"
response.write "<br>转到第<input type='text' name='page' size=2 maxLength=3 value="&PageCount&">"
response.write "页&nbsp;&nbsp;<input type='button' value='确 定' onclick=check()>"
response.write "</form>"
rs.close
set rs=nothing
end if
CloseData
%>
</td></tr></table>
</td></tr></table></center>
<table width="550" border="0" cellpadding="0" cellspacing="0">
<tr><td align=center><form method="post" action="" name=form1>
<input name=key type=text><input type=submit name=submit value='查询用户'></form></table>
</td></tr></table>

</BODY></HTML>
