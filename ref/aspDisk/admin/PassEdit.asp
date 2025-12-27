<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="Conn.asp"-->
<!--#include file="md5.asp"-->
<!--#include file="admin_config.asp"-->
<%
opendata
dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_config
%>
<HTML><HEAD><TITLE><%=web_vip_name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="">
<link rel="stylesheet" href="../style.css">
</head>
<script language="javascript">
<!--
function check_login() 
	{
    errfound = false;
if (document.form1.UserNameold.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入登录名！");
		form1.UserNameold.focus();
        errfound = true;
		}
		}
if (document.form1.Pwdold.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入口令！");
		form1.Pwdold.focus();
        errfound = true;
		}
		}
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
-->
</script>
<BODY>
<div align=center>
<center>
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
<table width=540><tr><td width=80></td><td>
<%
IF Request.QueryString("action")="Edit" then
Check
Else
Inputtext
End IF
Function Inputtext
%>
<form name="form1" method="POST" action="PassEdit.asp?action=Edit" onSubmit="return check_login();" autocomplete="off">
<table width=449 border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td width=115><span class=star>*</span>&nbsp;用户名称：</td>
<td width="133"><input type="text" name="UserNameold" size="18" maxlength=50></td>
<td width="169">(旧名称)</td></tr>
<tr><td width="115"><span class=star>*</span>&nbsp;用户密码：</td> 
<td width="133"><input type="password" name="Pwdold" tabIndex="2" maxlength=15 size=18></td>
<td width="169">(旧密码)</td></tr>
<tr><td width=115><span class=star>*</span>&nbsp;用户名称：</td>
<td width="133"><input type="text" name="UserName" size="18" maxlength=50></td>
<td width="169">(新名称)</td></tr>
<tr><td width="115"><span class=star>*</span>&nbsp;用户密码：</td> 
<td width="133"><input type="password" name="Pwd" tabIndex="2" maxlength=15 size=18></td>
<td width="169">(新密码)</td></tr></table><br>
<center><input type=image src=../images/btn_reg.gif onFocus="this.blur()">　<img src=../images/btn_reset.gif border=0 style='cursor:hand' onClick='reset();'></center>
</td></tr></table></form>
</td><td class=hline width="12"></td></table>
</center>
<%
End Function
Function Check
IF Session("Admin")="" then
response.redirect "exit.asp"
Else
Update
End IF
End Function

Function Update
Dim Username,pwd,Usernameold,pwdold
IF Session("admin")<>"" then
Username=replace(request.form("username"),"'","")
pwd=replace(request.form("pwd"),"'","")
Usernameold=replace(request.form("usernameold"),"'","")
pwdold=replace(request.form("pwdold"),"'","")
sql="select * from vip_admin where username='"&Usernameold&"'"
set rs=conn.execute(sql)
if rs.eof then
response.write "用户名错误"
response.end
rs.close
set rs=nothing
else
if rs("username")<>usernameold or rs("pwd")<>md5(pwdold) then
response.write "密码错误"
response.end
rs.close
set rs=nothing
else
pwd=md5(pwd)
SQL="Update Vip_Admin set UserName='"&UserName&"',Pwd='"&Pwd&"',Times='"&Now()&"' where Username='"&Usernameold&"'"
Conn.Execute(SQL)
rs.close
set rs=nothing
response.redirect "admin.asp"
End IF
end if
else
response.redirect "exit.asp"
end if

End Function
closedata
%>
</div>

</BODY></HTML>