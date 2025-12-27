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
<body bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=558 border=0 cellspacing=1 cellpadding=3 class=photo>
<tr class=fiel align=center><td width="104">文件名称</td><td width="157">文件说明</td><td width="65">文件大小</td><td width="116">上传日期</td></tr>
<%
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
dim pwd,User_Share,USer_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id)

Dim FileDir_id
FileDir_id=replace(Request.QueryString("FileDir_id"),"'","")
if not IsNumeric(FileDir_id) then
        response.write "非法递交"
        response.end
        end if
sql="select * from Vip_FileDir where FileDir_id="&FileDir_id
set rs=conn.execute(sql)
if rs.eof then
response.write "无此目录"
rs.close
set rs=nothing
response.end
end if
if rs("FileDir_Share")<1 then
response.write "此目录没有共享"
rs.close
set rs=nothing
response.end
end if
if rs("FileDir_Share")=1 then
Dim IsMy_Friend,rsF,SqlF
My_Friend_Name(rs("FileDir_Userid"))
if IsMy_Friend=False then
response.write "对方不是你的好友"
rs.close
set rs=nothing
response.end
end if
end if
Dim FileDir_Namelist,FileDir_Username
FileDir_Namelist=rs("FileDir_Name")
FileDir_Username=rs("FileDir_Userid")
rs.close
set rs=nothing
My_Friend_File
CloseData

Function My_Friend_File
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_Photo where  User_id="&FileDir_Username&" and FileDir_id in(select FileDir_id from Vip_FileDir where FileDir_Name='"&FileDir_Namelist&"' and FileDir_Share>0)"
rs.open sql,conn,1,1
if rs.eof then
response.write "暂时无文件"
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
for i=1 to rs.pagesize
%>
<tr><td>
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
<td width="116"><%=formatdatetime(rs("Times"),2)%></td>
</tr>
<%
rs.movenext
if rs.eof then exit for
next
response.write"<tr><td align=center colspan=4>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=My_Friend_FileDir.asp?page=1&FileDir_id="&FileDir_id&">首页</a>&nbsp;"   
response.write "<a href=My_Friend_FileDir.asp?page="+cstr(pagecount-1)+"&FileDir_id="&FileDir_id&">上一页</a>&nbsp;"
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write "<a href=My_Friend_FileDir.asp?page="+cstr(pagecount+1)+"&FileDir_id="&FileDir_id&">下一页</a>&nbsp;"
response.write "<a href=My_Friend_FileDir.asp?page="+cstr(rs.PageCount)+"&FileDir_id="&FileDir_id&">尾页</a>"    
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>" 
response.write "&nbsp;&nbsp;每页"&pagesize&"个&nbsp;&nbsp;</td></tr>"
end if
rs.close
set rs=nothing
%>
</table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>
<%
end Function
%>