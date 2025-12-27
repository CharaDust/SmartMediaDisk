<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<%
opendata
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail,Times,Loginip
dim pwd,User_Share,USer_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id)
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_GFL_SL
User_Group(User_Vip)
%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Content-Language" content="zh-cn">
<META name="description" content="网络硬盘,ASP,数据库,SQL">
<link rel="stylesheet" href="style.css">
<style type="text/css">
.photo image {width:100px; height:100px; cursor:hand; border:1px solid #A58A52}
</style>
</head>
<body bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width=558 border=0 cellspacing=1 cellpadding=3>
<tr class=fiel align=center><td width="104">用户名称</td><td width="157">目录名称</td><td width="116">建立日期</td></tr>
<%
set rs=server.createobject("adodb.recordset")
sql="select * from Vip_FileDir where FileDir_Share=2"
rs.open sql,conn,1,1
if rs.eof and rs.bof then

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
dim i
for i=1 to rs.recordcount%>
<tr>
<td><%=Share(rs("FileDir_Userid"))%></td>
<td><a href=Share_List.asp?ID=<%=rs("FileDir_Userid")%>&FileDir_Namelist=<%=rs("FileDir_Name")%>><%=rs("FileDir_Name")%></a></td>
<td><%=rs("FileDir_Time")%></td>
</tr>
<%
rs.movenext
if i>=pagesize or rs.eof then exit for
next
response.write"<tr><td align=center colspan=3>"
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=?page=1>首页</a>&nbsp;"
response.write "<a href=?page="+cstr(pagecount-1)+">"
response.write "上一页</a>&nbsp;"
end if
if rs.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write"<a href=?page="+cstr(pagecount+1)+">"
response.write "下一页</a>&nbsp;"
response.write "<a href=?page="+cstr(rs.PageCount)+">尾页</a>"    
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs.pagecount&"页</font>" 
response.write "&nbsp;&nbsp;每页"&pagesize&"个&nbsp;&nbsp;</td></tr>"
end if
rs.close
set rs=nothing

function Share(ID)
if ID="" then exit function
if NOT IsNumeric(ID) then exit Function
Dim ShareSql,ShareRS
ShareSql="Select ID,UserName from Vip_User where ID="&ID
set ShareRS=conn.execute(ShareSql)
if ShareRS.eof and ShareRS.bof then

else
response.write "<a href=Vip_Online_List.asp?ID="&ShareRS("ID")&">"&ShareRS("UserName")&"</a>"
end if
ShareRS.close
set ShareRS=nothing
end function
%>
</table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body>
</html>
