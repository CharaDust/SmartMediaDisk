<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
.photo image {cursor:hand; border:1px solid #A58A52}
</style>
<script Language="JavaScript" src="js/common.js"></script>
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
<script language="javascript">
<!--
function Lis(ListenURL)
{
var Listen = window.open(ListenURL,"Lis","scrollbars=yes,width=340,height=250,top=100,left=100");
return false;
}
//-->
</script>
</head>
<body bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=558 border=0 cellspacing=1 cellpadding=3 class=photo>
<tr class=fiel align=center><td width="104">文件名称</td><td width="157">文件说明</td><td width="65">大小</td>
<td width="116">上传日期</td><td width="64"></td></tr>
<form name=form1 method=Post action='FileDir.asp'>
<tr><td>
<%
dim FileDir_Namelist,ID
ID=Request.QueryString("ID")
if NOT IsNumeric(ID) then
response.write "非法递交"
response.end 
end if
FileDir_Namelist=replace(Request.QueryString("FileDir_Namelist"),"'","")
if not FileDir_Name(FileDir_Namelist) then
response.write "非法递交"
response.end 
end if
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_Photo where FileDir_id in(select FileDir_id from Vip_FileDir where FileDir_Name='"&FileDir_Namelist&"' and FileDir_Userid="&ID&")"
rs.open sql,conn,1,1
if rs.eof then
response.write "暂时无文件"
else
dim pagecount,pagesize
pagesize=10    '每页数量
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
Dim i
for i=1 to rs.pagesize%>
<tr>
<td width="104" align=center>
<%
if not isnull(rs("PhotoDir_SL")) or rs("PhotoDir_SL")<>"" then
%>
<img src="upload/<%=rs("PhotoDir_SL")%>" onClick="javascript:PopImage('upload/<%=rs("PhotoDir")%>','<%=rs("id")%>')">
<%
else
if instr(ImgTypes,":"&right(rs("PhotoDir"),4)&":") then
%>
<img src='upload/<%=rs("PhotoDir")%>'   onClick="javascript:PopImage('upload/<%=rs("PhotoDir")%>','<%=rs("id")%>')">
<%
else
Dim PhotoDirIsImg
PhotoDirIsImg=LCase(rs("photoDir"))
PhotoDirIsImg=split(PhotoDirIsImg,"/")
response.write "<a href=upload/"&rs("PhotoDir")&" target=_blank>"
response.write PhotoDirIsImg(Ubound(PhotoDirIsImg))&"</a>"
end if
end if
%>
</td>
<td width="157" style="table-layout:fixed; word-break:break-all">
<%=rs("PhotoType")%>
</td>
<td width="65"><%=cint(rs("FileDateSize")/1024)%>K</td>
<td width="116"><%=rs("Times")%></td>
<td width="64"></td>
</tr>
<%
rs.movenext
if rs.eof then exit for
next
response.write"<tr><td align=center colspan=4>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=FileDir.asp?page=1&FileDir_Namelist="&FileDir_Namelist&">首页</a>&nbsp;"
response.write "<a href=FileDir.asp?page="+cstr(pagecount-1)+"&FileDir_Namelist="&FileDir_Namelist&">"
response.write "上一页</a>&nbsp;"
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write"<a href=FileDir.asp?page="+cstr(pagecount+1)+"&FileDir_Namelist="&FileDir_Namelist&">"
response.write "下一页</a>&nbsp;"
response.write "<a href=FileDir.asp?page="+cstr(rs.PageCount)+"&FileDir_Namelist="&FileDir_Namelist&">尾页</a>"    
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>" 
response.write "&nbsp;&nbsp;每页"&pagesize&"个&nbsp;&nbsp;</td></tr>"
end if
rs.close
set rs=nothing
CloseData
%>
</td></tr></table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>