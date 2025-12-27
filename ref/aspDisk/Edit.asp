<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<!--#include file="md5.asp"-->
<HTML><HEAD><TITLE></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
<script Language="JavaScript" src="js/common.js"></script>
<SCRIPT LANGUAGE="JavaScript">
<!--
function check_edit() 
	{
    errfound = false;
if (document.form1.Pwd.value=="") 
		{
		if (!errfound) 
		{
		window.alert("请输入口令！");
		form1.Pwd.focus();
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
//-->
</SCRIPT>
</head>
<body bgcolor="#F6ECE2">
<%
Opendata
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,pwd,Sex,Age,Address,Mail,Times,Loginip
Dim User_Share,USer_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id) 
IF Request.QueryString("action")="edit" then
UserEdit
response.end
End IF
%>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor="#F6ECE2">
<form name="form1" method=Post action='Edit.asp?action=edit' onSubmit="return check_edit();" autocomplete="off">
<table width="560" border="0" cellspacing="0" cellpadding="0">
  <tr> 
    <td> <table width=100% cellpadding=3 cellspacing=1>
        <tr> 
          <td>您的ＩＤ：</td>
          <td><%=UserName%></td>
          <td>性    别：</td>
          <td>
<input type="radio" name="Sex" value="0" <%if sex=0 then response.write "checked"%>>男 
<input type="radio" name="Sex" value="1" <%if sex=1 then response.write "checked"%>>女</td>
        </tr>
        <tr> 
          <td>您的密码：</td>
          <td><input type=password name=Pwd value='<%=pwd%>'></td>
          <td>年    龄：</td>
          <td><input type=text name=Age value='<%=age%>'></td>
        </tr>
        <tr> 
          <td>ＯＩＣＱ：</td>
          <td class=num><input type=text name=QQ value='<%=address%>'></td>
          <td>邮   箱：</td>
          <td><input type=text name=Mail value='<%=mail%>'></td>
        </tr>
        <tr> 
          <td>友好状态：</td>
          <td class=num><input type="radio" name="User_Friendallow" value="0" <%if User_Friendallow=0 then response.write "checked"%>>拒绝 <input type="radio" name="User_Friendallow" value="1" <%if User_Friendallow=1 then response.write "checked"%>>允许</td>
          <td>ＩＰ：</td>
          <td><%=loginip%></td>
        </tr>
        <tr> 
          <td>登陆时间：</td>
          <td><%=times%></td>
          <td></td>
          <td></td>
        </tr>
     </table></td>
  </tr>
</table>
<center>
<input type="Submit" name=Submit value="确定修改">&nbsp;&nbsp;
<input type="reset" value="重新填写" name=reset>
</center></form>
</td></tr></table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
<%
Function UserEdit
dim Pwd1,Sex,Age,QQ,Mail
dim errstr
errstr="提示信息==>>&nbsp;"
Pwd1=replace(request.form("Pwd"),"'","")
Sex=replace(request.form("Sex"),"'","")
Age=replace(request.form("Age"),"'","")
QQ=replace(request.form("QQ"),"'","")
Mail=replace(request.form("Mail"),"'","")
User_Friendallow=replace(request.form("User_Friendallow"),"'","")
if instr(Pwd," ")<>0 then
errstr="用户名，密码不能包含空格"
else
if trim(Pwd1)="" or trim(Mail)="" or sex="" or mail="" then 
errstr=errstr&"必须填写完整"
else
if not IsNumeric(Age) then
errstr=errstr&"年龄必须为数字"
else
if not IsNumeric(QQ) then
errstr=errstr&"QQ必须为数字"
else
if pwd1<>pwd then
pwd1=md5(pwd1)
else
pwd1=pwd
end if
sql="update vip_user set Pwd='"&Pwd1&"',Sex="&Sex&",Age="&Age&",Address="&QQ&",Mail='"&Mail&"',Times='"&Now()&"',Loginip='"&Request.ServerVariables("REMOTE_ADDR")&"',User_Friendallow="&User_Friendallow&" where id="&User_id
conn.execute (Sql)
response.redirect "List.asp?action=right"
end if
end if
end if
end if
Closedata
response.write errstr
End Function
CloseData
%>