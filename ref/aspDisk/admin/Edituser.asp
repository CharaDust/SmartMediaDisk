<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<!--#include file="md5.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,落尘论坛,ASP,数据库,SQL">
<link rel="stylesheet" href="../style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
<script Language="JavaScript" src="../js/common.js"></script>
<SCRIPT LANGUAGE="JavaScript">
<!--
function Add(){
	document.form1.PAction.value = "Add";
	document.form1.action = "Add.asp";
	document.form1.submit();
}
function exit(){
	document.form1.PAction.value = "exit";
	document.form1.action = "exit.asp";
	document.form1.submit();
}
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
<body>
<%
Opendata
User_id=replace(Request.QueryString("user_id"),"'","")
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
dim pwd,User_Share,USer_Friends,User_Friendallow
User_UpFileConfig(User_id)
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_Dir_Max,File_GFL_SL
User_Group(User_Vip)
IF Request.QueryString("action")="edit" then
UserEdit
End IF
Dim User_id
%>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#E0E2E0>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="536" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 用户资料修改</td></tr>
<tr><td height=1 bgcolor=#CECECE width="536" colspan=5></td></tr>
</table>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td align=center bgcolor=#ffffff><img src=../images/step01.gif width=468 height=60></td></tr>
</table>
<table width="560" border="0" cellpadding="0" cellspacing="0">
  <tr> 
    <td background="../images/member-02-back.gif"><img src="../images/vip-55b.gif"></td>
  </tr>
</table>
<form name="form1" method=Post action='Edituser.asp?action=edit&user_id=<%=user_id%>' onSubmit="return check_edit();" autocomplete="off">
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
          <td>地    址：</td>
          <td class=num><input type=text name=Address value='<%=address%>'></td>
          <td>邮   箱：</td>
          <td><input type=text name=Mail value='<%=mail%>'></td>
        </tr>
        <tr> 
          <td>所属群组：</td>
          <td>
<%
sql="select Group_id,Group_name from Vip_Group"
set rs=conn.execute(sql)
response.write "<select name=Vip>"
do while not rs.eof
response.write "<option value='"&rs("Group_id")&"' "
if User_Vip=rs("Group_id") then response.write "selected"
response.write ">"&rs("Group_name")&"</option>"
rs.movenext
loop
response.write "</select>"
rs.close
set rs=nothing
%>
</td>
<td>登陆ＩＰ：</td> <td><%=loginip%></td></tr>
<tr><td>登陆时间：</td><td><%=times%></td><td></td><td></td></tr>
</table></td>
  </tr>
</table>
<center>
<input type="Submit" name=Submit value="确定修改">&nbsp;&nbsp;<input type="button" value="退出登陆" onclick="exit();">
<input type="hidden" name="PAction">
</center></form>
</td></tr></table>
<!--#include file="bottom.asp"-->
<%
Function UserEdit
Dim User_id
User_id=replace(Request.QueryString("user_id"),"'","")
sql="select * from Vip_user where id="&user_id
set rs=conn.execute(sql)
if rs.eof then
response.write "无此用户"
rs.close
set rs=nothing
response.end
else
dim pwd,User_Share
User_Share=rs("User_Share")
user_id=rs("id")
pwd=rs("pwd")
rs.close
set rs=nothing
end if
dim Pwd1,vip
dim errstr
errstr="提示信息==>>&nbsp;"
Pwd1=replace(request.form("Pwd"),"'","")
Sex=replace(request.form("Sex"),"'","")
Age=replace(request.form("Age"),"'","")
Address=replace(request.form("Address"),"'","")
Mail=replace(request.form("Mail"),"'","")
Vip=replace(request.form("vip"),"'","")
if instr(Username," ")<>0 or instr(Pwd," ")<>0 then
errstr="用户名，密码不能包含空格"
else
if trim(Pwd1)="" or trim(Mail)="" or sex="" or mail="" then 
errstr=errstr&"必须填写完整"
else
if not IsNumeric(Age) then
errstr=errstr&"年龄必须为数字"
else
if pwd1<>pwd then
pwd1=md5(pwd1)
else
pwd1=pwd
end if
sql="update vip_user set Pwd='"&Pwd1&"',Sex="&Sex&",Age="&Age&",Address='"&Address&"',Mail='"&Mail&"',Times='"&Now()&"',Loginip='"&Request.ServerVariables("REMOTE_ADDR")&"',vip="&vip&" where id="&User_id
conn.execute (Sql)
response.write User_Share&"---"&vip&"<br>"

User_Dir User_Share,vip
response.redirect "user.asp?id="&user_id
end if
end if
end if
response.write errstr
End Function

Function User_Dir(User_File_Dir,vip)
Dim i,path,path2,FSO
path=server.mappath(File_Path&User_Vip&"/"&User_id)
path2=server.mappath(File_Path&Vip)
path=replace(path,"admin\","")
path2=replace(path2,"admin\","")


Set FSO=Server.CreateObject(File_FSO)
If FSO.FolderExists(path) then
If Not FSO.FolderExists(path2) then
FSO.CreateFolder(path2)
end if
FSO.MoveFolder path , path2&"\"
end if
Set FSO=nothing
set rs=server.createobject("adodb.recordset")
sql="select PhotoDir,PhotoDir_SL from Vip_Photo where User_id="&User_id
rs.open sql,conn,1,3
Dim PhotoDir
do while not rs.eof
rs("PhotoDir")=replace(rs("PhotoDir"),split(rs("PhotoDir"),"/")(0),Vip,1,1)
rs("PhotoDir_SL")=replace(rs("PhotoDir_SL"),split(rs("PhotoDir_SL"),"/")(0),Vip,1,1)
rs.update
rs.movenext
loop
rs.close
set rs=nothing
End Function

CloseData
%>