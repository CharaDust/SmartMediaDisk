<!--#include file="conn.asp"-->
<!--#include file="md5.asp"-->
<%
Opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
web_config
if Web_Vip_Caller=1 then
response.write "已经停止注册"
response.end
end if
%>
<html>
<head>
<title><%=Web_Vip_name%></title>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
</head>
<script language="javascript">
<!--
function check_add() 
	{
    errfound = false;
if (document.form1.UserName.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入名称！");
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
if (document.form1.Pwd.value!=document.form1.Pwd1.value) 
		{
		if (!errfound) 
		{
		window.alert("两次密码不正确！");
		form1.Pwd1.focus();
        errfound = true;
		}
		}
if (document.form1.QQ.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入QQ！");
		form1.QQ.focus();
        errfound = true;
		}
		}
if (document.form1.Mail.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入信箱！");
		form1.Mail.focus();
        errfound = true;
		}
		}
if (document.form1.Mail.value.indexOf("@")< 0) 
		{
		if (!errfound) 
		{
		window.alert("错误的信箱！");
		form1.Mail.focus();
        errfound = true;
		}
		}
	return ! errfound;
		
}
-->
</script>
<body>
<center>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#B4B6B5>
<!--#include file="top.asp"-->
<center>
<%
IF Request.QueryString("action")="reg" then
call reg
end if
Sub reg
dim Username,Pwd,Sex,Age,Address,Mail
dim errstr
errstr="提示信息==>>&nbsp;"
Username=replace(request.form("username"),"'","")
Pwd=replace(request.form("Pwd"),"'","")
Pwd1=replace(request.form("Pwd1"),"'","")
Sex=replace(request.form("Sex"),"'","")
Age=replace(request.form("Age"),"'","")
QQ=replace(request.form("QQ"),"'","")
Mail=replace(request.form("Mail"),"'","")
if len(Username)>10 then 
errstr="用户名不能超过5个汉字"
else
if instr(Username," ")<>0 or instr(Pwd," ")<>0 then
errstr="用户名，密码不能包含空格"
else
if trim(UserName)="" or trim(Pwd)="" or trim(Mail)="" then 
errstr=errstr&"带*号的必须填写"
else
if Pwd<>Pwd1 then
errstr=errstr&"两次密码不一致"
else
if not IsNumeric(Age) then
errstr=errstr&"年龄必须为数字"
else
IF not IsNumeric(QQ) then
errstr=errstr&"OICQ必须为数字"
else
if isnull(Address) then
errstr=errstr&"请填写地址"
else
sql="select Username from vip_user where Username='"&Username&"'"
set rs=conn.execute(sql)
if not rs.eof then
errstr=errstr&"用户名已存在"
rs.close
set rs=nothing
else
Pwd=md5(pwd)
sql="insert into vip_user (username,pwd,sex,age,address,mail,times,Vip,loginip)values('"&Username&"','"&Pwd&"',"&Sex&","&Age&","&QQ&",'"&Mail&"','"&Now()&"',"&Web_Vip_reg&",'"&Request.ServerVariables("REMOTE_ADDR")&"')"
conn.execute (Sql)
errstr=errstr&"注册成功&nbsp;<a href=login.asp><font color=red>点此登陆</font></a>"
rs.close
set rs=nothing
end if
end if
end if
end if
end if
end if
end if
end if
response.write "<font color=#ffffff><b>"&errstr&"</b></font>"
End Sub
Closedata
%>
</center>
<form method="post" action="reg.asp?action=reg" name=form1 onSubmit="return check_add();" autocomplete="off">
<div align="center">
  <center>
<table width=540><tr><td>
<table width=548 border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td width="84"><span class=star>*</span>名&nbsp;&nbsp;&nbsp;&nbsp;称：</td>
<td width="130"><input type=text name=UserName size=20 maxlength=20 class=inp2></td>
<td width="302">(不允许重复哦！)</td></tr>
<tr><td width="84"><span class=star>*</span>密&nbsp;&nbsp;&nbsp;&nbsp;码：</td>
<td width="130"><input type=text name=Pwd size=20 maxlength=20 class=inp2></td>
<td width="302">(要求6位以上的数字和字母)</td></tr>
<tr><td width="84"><span class=star>*</span>重复密码：</td> 
<td width="130"><input type=text name=Pwd1 size=20 maxlength=20 class=inp2></td>
<td width="302">(同上)</td></tr>
<tr><td width="84"><span class=star>*</span>&nbsp;O&nbsp;I&nbsp;C&nbsp;Q：</td>
<td width="130"><input type=text name=QQ size=20 maxlength=40 class=inp2></td>
<td width="302">(请输入数字)</td></tr>
<tr><td width="84"><span class=star>*</span>邮&nbsp;&nbsp;&nbsp;&nbsp;箱：</td>
<td width="130"><input type=text name=Mail size=20 maxlength=40 class=inp2></td>
<td width="302">(请输入正确的邮箱，否则将有可能接收不到系统发送的重要信息)</td></tr>
<tr><td width="84"><span class=star>*</span>性&nbsp;&nbsp;&nbsp;&nbsp;别：</td> 
<td width="130"><input type="radio" name="Sex" value="0" checked>男 
<input type="radio" name="Sex" value="1">女</td>
<td width="302">(请正确选择)</td></tr>
<tr><td width="84"><span class=star>*</span>年&nbsp;&nbsp;&nbsp;&nbsp;龄：</td>
<td width="130"><input type=text name=Age class=inp2></td>
<td width="302">(请使用数字)</td></tr>
</table><br>
<center><input type=image border=0 src=images/btn_reg.gif onFocus="this.blur()">　<img src=images/btn_reset.gif border=0 style='cursor:hand' onClick='reset();'></center>
</td></tr></table>
  </center>
</div>
</form>
</body>
