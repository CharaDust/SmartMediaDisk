<!--#include file="conn.asp"-->
<%
Opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
web_config
CloseData
%>
<html>
<head>
<title><%=Web_Vip_name%></title>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
<!--
.style4 {font-size: x-large}
.style5 {font-size: xx-large; }
.style6 {font-size: large; }
-->
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" background="image/bg_contents.gif">
<div align="center">
  <center>
<table width="770" border="0" cellspacing="0" cellpadding="0">
  <tr> 
<td width="120"><div align="center">
  <p class="style4">&nbsp;</p>
  <p class="style6">网络硬盘</p>
  <p class="style5">&nbsp;</p>
</div></td>
<td width="650" background=image/obj_topimage.gif align=center>
</td>
  </tr>
</table>
  </center>
</div>
<div align="center">
  <center>
<table width="770" border="0" cellspacing="0" cellpadding="0">
  <tr> 
    <td background="image/bg_menu.gif" width="15"><img src="image/spacer.gif" width="15" height="1"></td>
    <td background="image/bg_menu.gif" width="103" valign="top"><br>
      <table width="103" border="0" cellspacing="0" cellpadding="0" background="image/obj_menu_03.gif" height="241">
        <tr> 
          <td height="19"><img src="image/obj_menu_01.gif" width="103" height="17"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='list.asp' target=right>用户信息</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='Add.asp' target=right>上传文件</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='Edit.asp' target=right>修改资料</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='setup.asp' target=right>创建目录</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='FileDirList.asp' target=right>查看目录</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='User_Online.asp' target=right>在线用户</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='My_Friend.asp' target=right>我的好友</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='Mail/Mail.asp' target=right>站内短信</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='Share.asp' target=right>共享目录</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='search_user.asp' target=right>查询用户</a></td>
        </tr>
<tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='readme.asp' target=right><font color=#ff0000><b>使用帮助</b></font></a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="12" align="center"><a href='help.asp' target=right>会员等级</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="13" align="center"><a href='Exit.asp' target=_top>退出登陆</a></td>
        </tr>
        <tr> 
          <td height="12" align="center"><img src="image/obj_menu_02.gif" width="103" height="3"></td>
        </tr>
        <tr> 
          <td height="16"><img src="image/obj_menu_04.gif" width="103" height="14"></td>
        </tr>
      </table>
      <br>
    </td>
    <td background="image/line_tate.gif" width="3">
<img src="image/spacer.gif" width="3" height="1"></td>
    <td width="676" valign="top" align="center"> 
      <table width="631" border="0" cellspacing="0" cellpadding="0" height="450">
        <tr> 
          <td width="629" height="100%"> <br>
            <iframe src=list.asp width=625 height=400 name=right frameborder=0></iframe>
            <br>
          </td>
        </tr>
      </table>
    </td>
  <td background="image/line_tate.gif" width="3"><img src="image/spacer.gif" width="3" height="1"></td>
  </tr>
</table>
  </center>
</div>
<div align="center">
  <center>
<table width="770" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td background="image/obj_footer.gif"><img src="image/spacer.gif" width="1" height="5"></td>
  </tr>
  <tr>
    <td background="image/bg_title.gif" align="center"><font color=#ffffff>版权所有 请联系xingxing90◎sohu.com</font></td>      
  </tr>
</table>
  </center>
</div>
</body>
</html>
