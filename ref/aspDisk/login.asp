<!--#include file="conn.asp"-->
<!--#include file="md5.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<%
if request.querystring("clear")="1" then
	session.abandon()
	response.redirect "login.asp"
end if
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<META http-equiv=Content-Type content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<STYLE type=text/css>
TD {FONT-SIZE: 12px; COLOR: #333333; FONT-FAMILY: "宋体"}
.style1 {font-size: xx-large}
</STYLE>
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
-->
</script>
<BODY>
<div align=center>
<center>
<form name="form1" method="POST" action="Login.asp?action=login" onSubmit="return check_login();" autocomplete="off">
<table width="500" height="300" border="0" cellpadding="0" cellspacing="14" bgcolor="#eeeeee">
<tr><td align="center" bgcolor="#FFFFFF"><table width="472" height="272" border="0" cellpadding="0" cellspacing="1" bgcolor="#dddddd">
<tr><td width="472" align="center" bgcolor="#FFFFFF">
<table width="433" height="229" border="0" cellpadding="0" cellspacing="0">
<tr><td width="147" valign="top"><img src="images/001.jpg" width="145" height="200"></td>
<td width="19">&nbsp;</td>
<td width="267" valign="top"><table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td><table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr> 
<td width="15"><img src="images/left.gif" width="15" height="94"></td>
<td><table width="100%" height="94" border="0" cellpadding="0" cellspacing="0">
<tr> <td height="1" bgcolor="#CCCCCC"> </td></tr>
<tr>
  <td align="center"><div align="center"><span class="style1">网络硬盘
          <%if session("User_id")="" or isnull(session("User_id")) then
login1
else
response.write "&nbsp;<a href=Boards.asp><font color=red>点此进入</font></a>"
%>
<%end if%>
  </span></div></td></tr>
<tr><td height="1" bgcolor="#CCCCCC"></td></tr>
</table></td>
<td width="15"><img src="images/right.gif" width="15" height="94"></td>
</tr></table></td></tr><tr>
<td height="50" align="center"><%if session("User_id")="" then%><img src="images/dot.gif" width="9" height="9"><a href="reg.asp">用户注册</a><%end if%><img src="images/dot.gif" width="9" height="9"><a href="login.asp?clear=1">重新登陆</a><img src="images/dot.gif" width="9" height="9">[<a href=# onclick="javascript:alert('暂不开放');">忘记密码</a>]</td>
</tr></table></td></tr><tr><td width="147" valign="top"></td>
<td></td><td width="267" valign="top" align=center>

<%
IF Request.QueryString("action")="login" then
login
end if
Function login
dim username,errstr
errstr="提示信息==>>&nbsp;"
username=replace(request.form("username"),"'","")
pwd=replace(request.form("pwd"),"'","")
if trim(username)="" then
errstr=errstr&"用户名错误"
else
set rs=server.createobject("ADODB.recordset")
sql="select * from vip_user where username='"&username&"'"
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
session("User_id")=rs("id")
rs("times")=now()
rs("loginip")=Request.ServerVariables("REMOTE_ADDR")
rs.update
rs.close
set rs=nothing
sql="delete from Vip_Online where User_id="&session("User_id")
conn.execute(sql)
sql="insert into Vip_Online(User_id,Login_IP,Login_time,Last_time)values("&Session("User_id")&",'"&Request.ServerVariables("REMOTE_ADDR")&"','"&Vip_Time&"','"&Vip_Time&"')"
conn.execute(sql)
response.redirect "login.asp"
end if
end if
end if
closedata
response.write errstr
end Function
function login1%>
<table width="100%" height="112" border="0" cellpadding="0" cellspacing="2">
<tr><td width="26%" align="center">用户名：</td>
<td width="56%"><input type="text" name="UserName" size="18" maxlength=50></td>
<td width="18%" rowspan="3" align="center" valign="bottom"><a href=help.asp><img src="images/pic.gif" width="29" height="46" border=0 alt='帮助信息'></a></td>
</tr><tr><td align="center">密　码：</td>
<td><input type="password" name="Pwd" tabIndex="2" maxlength=15 size=18></td>
</tr><tr><td height="50">&nbsp;</td>
<td><input name="imageField"  onFocus="this.blur()" type="image" src="images/bt01.gif" width="60" height="15" border="0">
<a href="#" onclick="javascript:alert('暂不开放');"><img src="images/bt02.gif" width="60" height="15" border="0"></a></td></tr></table>

<%end function%>
</td></tr></table></td></tr></table></td></tr></table>
</form></center></div>
<div align="center">
  <center>
Copyright由湖南文理学院计算机系王威所有 2005.05.26.
  </center>
</div>
</BODY></HTML>