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
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
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
<body>
<table width="560" border="0" cellpadding="0" cellspacing="0">
<tr><td background="images/member-02-back.gif" valign="middle"><img src="images/vip-t1.gif"></td>
</tr></table>
<table width=558 border=0 cellspacing=1 cellpadding=3 class=photo>
<tr class=fiel align=center><td width="104">照片缩略图</td><td width="157">照片说明</td><td width="65">大小</td>
<td width="116">上传日期</td><td width="64">删除</td></tr>
<form name=form1 method=Post action='type.asp'>
<tr><td>
<%
dim FileDir_Name1
FileDir_Name1=replace(Request.QueryString("FileDir_Name1"),"'","")
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_Photo where FileDir_id in(select FileDir_id from Vip_FileDir where FileDir_Name='"&FileDir_Name1&"' and FileDir_Userid="&User_id&")"
rs.open sql,conn,1,1
if rs.eof then
response.write "暂时无文件"
else
dim pagecount,pagesize
pagesize=5
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
<tr>
<td width="104" align=center>
<%
dim PhotoDir
PhotoDir=LCase(rs("photoDir"))
PhotoDir=split(photoDir,".")
if instr(Imgtypes,":."&PhotoDir(Ubound(PhotoDir))&":")<>0 then
%>
<img src="upload/<%=rs("PhotoDir")%>" onClick="javascript:PopImage('upload/<%=rs("PhotoDir")%>','<%=rs("id")%>')">
<%
else
Dim PhotoDirIsImg
PhotoDirIsImg=LCase(rs("photoDir"))
PhotoDirIsImg=split(PhotoDirIsImg,"/")
response.write "<a href=upload/"&rs("PhotoDir")&">"&PhotoDirIsImg(Ubound(PhotoDirIsImg))&"</a>"
end if
%>
</td>
<td width="157" style="table-layout:fixed; word-break:break-all">
<%if isnull(rs("PhotoType")) then 
response.write "<a href=user_phototype.asp?id="&rs("id")&" onclick='return Lis(this.href);'>添加</a>"
else
response.write rs("PhotoType")&"<br><a href=user_phototype.asp?id="&rs("id")&" onclick='return Lis(this.href);'>修改</a>"
end if%>
</td>
<td width="65"><%=cint(rs("FileDateSize")/1024)%>K</td>
<td width="116"><%=rs("Times")%></td>
<td width="64"><a href="Deldate.asp?ID=<%=rs("id")%>">删除</a></td>
</tr>
<%
rs.movenext
if rs.eof then exit for
next
end if
set rs=nothing
CloseData
%>
</td></tr></table>
</body>
</html>