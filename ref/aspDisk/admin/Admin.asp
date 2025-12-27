<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="md5.asp"-->
<%
Opendata
dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_config%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="../style.css">
</head>
<script language="javascript">
<!--
function check_login() 
	{
    errfound = false;
if (document.form1.UserName.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入登录名！");
		form1.UserName.focus();
        errfound = true;
		}
		}
if (document.form1.Pwd.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入口令！");
		form1.Pwd.focus();
        errfound = true;
		}
		}
	return ! errfound;
		}
function check_add() 
	{
    errfound = false;
if (document.form1.Vip_Name.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入站点名称！");
		form1.Vip_Name.focus();
        errfound = true;
		}
		}
if (document.form1.Vip_Reg.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请选择群组！");
		//form1.Vip_Reg.focus();
        errfound = true;
		}
		}
if (document.form1.Vip_Caller.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入游客权限！");
		form1.Vip_Caller.focus();
        errfound = true;
		}
		}
	return ! errfound;
		
}
-->
</script>
<BODY>
<div align=center>
<center>
<%
IF Request.QueryString("action")="login" then
Check
End IF
IF Request.QueryString("action")="Update" then
Config_Update
End IF
IF Session("Admin")="" then
Login
Else
Login_OK
End if
Function Login
%>
<form name="form1" method="POST" action="Admin.asp?action=login" onSubmit="return check_login();" autocomplete="off">
<table width="300" height="90" border="0" cellpadding="0" cellspacing="2">
<tr><td width="26%" align="center">用户名：</td>
<td width="56%"><input type="text" name="UserName" size="18" maxlength=50></td>
<td width="18%" rowspan="3" align="center" valign="bottom"><img src="../images/pic.gif" width="29" height="46"></td>
</tr><tr><td align="center">密　码：</td>
<td><input type="password" name="Pwd" tabIndex="2" maxlength=15 size=18></td>
</tr><tr><td>&nbsp;</td>
<td><input name="imageField"  onFocus="this.blur()" type="image" src="../images/bt01.gif" width="60" height="15" border="0">
<a href="#" onClick="top.location.href='guest.asp'"><img src="../images/bt02.gif" width="60" height="15" border="0"></a></td></tr></table>
</form>
<%
End Function
Function Check
dim username,errstr,pwd
errstr="提示信息==>>&nbsp;"
username=replace(request.form("username"),"'","")
pwd=replace(request.form("pwd"),"'","")
if trim(username)="" then
errstr=errstr&"用户名错误"
else
set rs=server.createobject("adodb.recordset")
sql="select * from vip_Admin where username='"&username&"'"
rs.open sql,conn,1,3
if rs.eof then
errstr=errstr&"无此用户"
rs.close
set rs=nothing
else
if rs("pwd")<>md5(pwd) then
errstr=errstr&"密码错误"
rs.close
set rs=nothing
else
rs("Times")=Now()
rs.update
session("admin")=UserName
rs.close
set rs=nothing
response.redirect "admin.asp"
end if
end if
end if
response.write errstr
End Function
Function Login_OK
%>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#B4B6B5>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="536" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 管理登陆</td></tr> 
<tr><td height=1 bgcolor=#EAEAEA width="20%"><a href=admin.asp>管理首页</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=Group.asp>群组管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=User1.asp>用户管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=PassEdit.asp>修改密码</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=exit.asp>退出登陆</a></td>
<tr><td height=1 bgcolor=#CECECE width="536" colspan=5></td></tr>
</table>
<img src=../images/step01.gif><br>
<form method="post" action="admin.asp?action=Update" name=form1 onSubmit="return check_add();" autocomplete="off">
<table width=540><tr><td width=80></td><td>
<table width=476 border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td width=108><span class=star>*</span>&nbsp;站点名称：</td>
<td width="130"><input type=text name=Vip_Name size=20 maxlength=20 class=inp2 value='网络硬盘'></td>
<td width="206">(标题栏信息)</td></tr><tr><td width="108"><span class=star>*</span>&nbsp;注册管理：</td>
<td width="130">
<%
Dim Vip_Reg,Vip_Name,Vip_Caller
SQL="Select * From Vip_Group"
Set RS=Conn.Execute(SQL)
IF Not RS.Eof Then
response.write "<select name=Vip_Reg><option value='' selected>选择群组</option>"
do while not rs.eof
response.write "<option value='"&rs("group_id")&"'>"&rs("Group_name")&"</option>"
rs.movenext
loop
response.write "</select>"
else
response.write "<input type=hidden name=Vip_Reg value=''><a href=Group.asp>请先添加群组</a>"
end if
rs.close
set rs=nothing
%>
</td><td width="206">(选取新注册用户所属群组)</td>
</tr>
<tr><td width="108"><span class=star>*</span>&nbsp;站点管理：</td> 
<td width="130"><input type=text name=Vip_Caller size=20 maxlength=20 class=inp2 value='0'></td>
<td width="206">(是否停止注册,0为允许，1为禁止)</td></tr></table><br>
<center><input type=image src=../images/btn_reg.gif onFocus="this.blur()">　<img src=../images/btn_reset.gif border=0 style='cursor:hand' onClick='reset();'></center>
</td></tr></table></form>
</td><td class=hline width="12"></td></table>
</center>
<%
End Function
Function Config_Update
IF Session("admin")<>"" then
SQL="Update Vip_Config set Vip_Name='"&request.form("Vip_Name")&"',Vip_Reg="&request.form("Vip_Reg")&","
SQL=SQL& "Vip_Caller="&request.form("Vip_Caller")&""
Conn.Execute(SQL)
response.redirect "admin.asp"
Else
response.redirect "exit.asp"
End IF
End Function
closedata
%>
</div>
</BODY></HTML>