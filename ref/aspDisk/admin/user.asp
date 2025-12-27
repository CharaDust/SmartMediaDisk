<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="../style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
<script Language="JavaScript" src="js/common.js"></script>
<SCRIPT LANGUAGE="JavaScript">
<!--
function exit(){
	document.form1.PAction.value = "exit";
	document.form1.action = "exit.asp";
	document.form1.submit();
}
function Add(){
	document.form1.PAction.value = "Add";
	document.form1.action = "Add.asp";
	document.form1.submit();
}
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
<body>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#E0E2E0>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="536" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 用户资料</td></tr> 
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
<%
Opendata
Dim User_id
User_id=replace(Request.QueryString("id"),"'","")
if trim(User_id)="" then
response.write "无此用户"
response.end
end if
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
dim pwd,User_Share,USer_Friends,User_Friendallow
User_UpFileConfig(User_id)
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_Dir_Max,File_GFL_SL
User_Group(User_Vip)
%>
<table width="560" border="0" cellspacing="0" cellpadding="0">
  <tr> 
    <td> <table width=100% cellpadding=3 cellspacing=1>
        <col class=fiel>
        <col  bgcolor=#F6F6F6>
        <col  class=fiel>
        <col  bgcolor=#F6F6F6>
        <tr> 
          <td>用户ＩＤ：</td>
          <td><b><%=UserName%></b></td>
          <td>性    别：</td>
          <td><b><%if sex=0 then response.write "男"%><%if sex=1 then response.write "女"%></b></td>
        </tr>
        <tr> 
          <td>ＯＩＣＱ：</td>
          <td class=num><%=address%></td>
          <td>邮   箱：</td>
          <td><%=mail%></td>
        </tr>
        <tr> 
          <td>登陆时间：</td>
          <td><%=times%></td>
          <td>登陆ＩＰ：</td>
          <td><%=loginip%></td>
        </tr>
        <tr> 
          <td>会员状态：</td>
          <td><%=Group_Name%></td>
          <td>文件数量</td>
          <td><%=User_UpFileCount%></td>
        </tr>
        <tr> 
          <td>允许文件数量：</td>
          <td><%=File_Count%></td>
          <td>剩余文件数量</td>
          <td><%=File_Count-User_UpFileCount%></td>
        </tr>
        <tr> 
          <td>允许单个文件大小：</td>
          <td><%=File_Max%></td>
          <td>允许容量</td>
          <td><%=clng(File_Max_Sum)%></td>
        </tr>
        <tr> 
          <td>剩余容量：</td>
          <td><%=Clng(File_Max_Sum-Clng(User_UpFileMax/1024))%></td>
          <td>已使用容量</td>
          <td><%=Clng(User_UpFileMax/1024)%></td>
        </tr>
     </table></td>
  </tr>
</table>
  <table width="560" border="0" cellpadding="0" cellspacing="0">
    <tr> 
  <td background="../images/member-02-back.gif" valign="middle"><img src="../images/vip-t1.gif"></td>
    </tr>
  </table>
<table width="560" border="0" cellspacing="0" cellpadding="0">
	<tr><td>
		<table width=558 border=0 cellspacing=1 cellpadding=3 class=photo>
<tr class=fiel align=center><td width="99">照片缩略图</td><td width="162">照片说明</td><td width="65">大小</td>
<td width="116">上传日期</td><td width="64">删除</td></tr>
<form name=form1 method=Post action='list.asp'>
<tbody bgcolor=#F6F6F6>
<%
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_photo where User_id="&User_id
rs.open sql,conn,1,1
if rs.eof then
response.write "暂时无照片"
else
dim pagecount,pagesize
pagesize=10
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
<tr><td>
<%
if not isnull(rs("PhotoDir_SL")) or rs("PhotoDir_SL")<>"" then
%>
<img src="../upload/<%=rs("PhotoDir_SL")%>" onClick="javascript:PopImage('../upload/<%=rs("PhotoDir")%>','<%=rs("id")%>')">
<%
else
if instr(ImgTypes,":"&right(rs("PhotoDir"),4)&":") then
%>
<img src='../upload/<%=rs("PhotoDir")%>'   onClick="javascript:PopImage('../upload/<%=rs("PhotoDir")%>','<%=rs("id")%>')">
<%
else
Dim PhotoDirIsImg
PhotoDirIsImg=LCase(rs("photoDir"))
PhotoDirIsImg=split(PhotoDirIsImg,"/")
response.write "<a href=../upload/"&rs("PhotoDir")&" target=_blank>"
response.write PhotoDirIsImg(Ubound(PhotoDirIsImg))&"</a>"
end if
end if
%></td>
<td width="162" style="table-layout:fixed; word-break:break-all"><%=rs("PhotoType")%></td>
<td width="65"><%=cint(rs("FileDateSize")/1024)%>K</td>
<td width="116"><%=rs("Times")%></td>
<td width="64"><a href="Deldate.asp?ID=<%=rs("id")%>">删除</a></td>
</tr>
<%
rs.movenext
if rs.eof then exit for
next
end if%>
</tbody>
</table></td></tr>
</table>
<center><input type="button" value="修改资料" onclick="javascript:location.href='EditUser.asp?User_id=<%=User_id%>';">
&nbsp;<input type="button" value="退出登陆" onclick="exit();"> 
<input type="hidden" name="PAction"> 
</center></form> 
<table align='center'><tr><td>
<%
response.write"<form name=form2 method=Post action='user.asp?id="&user_id&"'>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=User.asp?page=1&id="&User_id&">首页</a>&nbsp;"   
response.write "<a href=User.asp?page="+cstr(pagecount-1)+"&id="&User_id&">上一页</a>&nbsp;"
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write "<a href=User.asp?page="+cstr(pagecount+1)+"&id="&User_id&">下一页</a>&nbsp;"
response.write "<a href=User.asp?page="+cstr(rs.PageCount)+"&id="&User_id&">尾页</a>"    
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>" 
response.write " 转到第<input type='text' name='page' size=2 maxLength=3 style='font-size: 9pt; color:#00006A; position: relative; height: 18' value="&PageCount&">页&nbsp;&nbsp;"
response.write "每页"&pagesize&"个&nbsp;&nbsp;"
response.write "<input type='button' value='确 定' onclick='check();'></form>"
rs.close
set rs=nothing
CloseData
%>
</td></tr></table></td></tr></table>
<!--#include file="bottom.asp"-->
</body>
</html>
