<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = true
Opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<!-- #include file=conn.asp -->
<!-- #include file=User_config.asp -->
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="style.css">
<script Language="JavaScript">
function Add(){
	if (!document.all.Photo.value){
		alert("路径不能为空！");
		document.all.Photo.focus();
		return false;
	}
}
</script>
</head>
<body leftmargin="0" topmargin="0" class=TBBG9>
<%
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,pwd,Sex,Age,Address,Mail,Times,Loginip
Dim User_Share,File_Dir_Max
User_UpFileConfig(User_id) 
%>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#E0E2E0>
<!--#include file="top.asp"-->
<table width="560" border="0" cellpadding="0" cellspacing="0"><tr><td>
<p align=left>　提示：
<br><font color=#B50000>1. 凡上传淫秽图片者，一律封ID帐号。 
<br>2. 禁止上传木马、病毒及危机服务器安全的文件，一经发现删除账号并报送公安机关。 
<br>3. 请不要上传大型软件，以免影响其他用户上传文件。 
<br>4. 凡上传法轮功及反动，暴力，色情等内容者，一经发现删除账号并报送公安机关。 
</font></p></td></tr>
<tr><td height=10 bgcolor=#ffffff></td></tr>
</table>
<form name="form1" method="Post" action=setup.asp?submitflag=yes onSubmit="return Add();">
<table width="560" border="0" cellspacing="0" cellpadding="0" height="84">
<tr><td align=center height="72"><table width=558 border=0 cellspacing=1 cellpadding=3 height="1">
<tr><td align=center height="41" width="536" colspan="2"><font color="#FF0000">已创建的共享文件夹列表</font></td></tr>
<tr><td>
<%
dim setuplist,i
sql="select * from Vip_User where id="&user_id
set rs=conn.execute(sql)
setuplist=split(User_Share,"|")
for i=0 to ubound(setuplist)-1
response.write setuplist(i)&"<br>"
next
rs.close
set rs=nothing
CloseData
%>
</td></tr>
</table></td></tr>
</table>
</form>
</td></tr></table>
<!--#include file="bottom.asp"-->
</body>
</html>