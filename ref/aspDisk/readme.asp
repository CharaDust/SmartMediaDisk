<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
Closedata
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="昕格网络硬盘,昕网论坛,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
</head>
<body bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
<tr><td>
<p align=left>使用说明：
<br><font color=#B50000>
1,用户可自由的在权限范围内创建目录及上传、管理文件<br>
2,上传文件前必须要先创建目录<br>
3,上传文件的时候请选择要上传的目录，以保证文件被上传在指定目录内<br>
4,在查看目录功能里可以设置目录的共享权限，即都有谁可以访问此目录（所有人，只好友，不共享）<br>
5,用户可以在修改资料功能里面修改友好状态（即是否允许其他用户加入自己为好友）<br>
6,用户可以查询其他用户并加入其为好友，以便浏览其共享目录（需要此用户的友好状态为允许）<br>
7,用户可以在站内短信功能发送短信给指定用户或所有用户（接受对象为空则为广播，即所有人可见）<br>
8,短信在浏览过后即自动删除<br>
9,广播在发送时间开始24小时后自动删除<br>

您在本站申请的存储空间是您的私人空间，您上传的东西是否在网上公布完全取决于您自己的选择。<br>
我们承诺不会擅自公布您上传的资料，图片等任何东西，如果您想公布所上传的资料请将其所在目录权限<br>设置为所有人或只好友。
</p>
</td></tr></table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>